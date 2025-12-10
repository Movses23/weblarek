import "./scss/styles.scss";
import { ProductsModel } from "./components/models/ProductsModel";
import { CartModel } from "./components/models/CartModel";
import { BuyerModel } from "./components/models/BuyerModel";
import { Api } from "./components/base/Api";
import { API_URL, CDN_URL, categoryMap } from "./utils/constants";
import { Communication } from "./utils/communication";
import { IProduct, IOrderRequest } from "./types";
import { GalleryView } from "./components/view/GalleryView";
import { BasketView } from "./components/view/BasketView";
import { ModalView } from "./components/view/ModalView";
import { EventEmitter } from "./components/base/Events";
import { OrderFormView } from "./components/view/OrderFormView";
import { ContactsFormView } from "./components/view/ContactsFormView";
import { SuccessView } from "./components/view/SuccessView";

const productsModel = new ProductsModel();
const cartModel = new CartModel();
const buyerModel = new BuyerModel();
const api = new Api(API_URL);
const comm = new Communication(api);
const uiEvents = new EventEmitter();

cartModel.on("cart:updated", (p) => uiEvents.emit("cart:updated", p));
buyerModel.on("buyer:updated", (p) => uiEvents.emit("buyer:updated", p));

uiEvents.on("cart:add", ({ productId }) => {
  const product = productsModel.getProductById(productId);
  if (product) cartModel.addItem(product);
});

uiEvents.on("cart:remove", ({ id }) => cartModel.removeItem(id));

uiEvents.on("buyer:setPayment", ({ payment }) =>
  buyerModel.setPayment(payment)
);
uiEvents.on("buyer:setEmail", ({ email }) => buyerModel.setEmail(email));
uiEvents.on("buyer:setPhone", ({ phone }) => buyerModel.setPhone(phone));
uiEvents.on("buyer:setAddress", ({ address }) =>
  buyerModel.setAddress(address)
);

const galleryEl = document.querySelector(".gallery") as HTMLElement | null;
const galleryView = galleryEl ? new GalleryView(galleryEl, uiEvents) : null;

const modalEl = document.getElementById("modal-container") as HTMLElement;
const modalView = new ModalView(modalEl);

let activeBasket: BasketView | null = null;

const headerBasketBtn = document.querySelector(
  ".header__basket"
) as HTMLElement | null;
const headerBasketCount = document.querySelector(
  ".header__basket-counter"
) as HTMLElement | null;

headerBasketBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  uiEvents.emit("header:cartClick");
});

uiEvents.on("cart:updated", ({ items }) => {
  if (headerBasketCount) headerBasketCount.textContent = String(items.length);
});

function injectTemplate(id: string): HTMLElement | null {
  const tmpl = document.getElementById(id) as HTMLTemplateElement | null;
  if (!tmpl) return null;
  const container = modalEl.querySelector(".modal__content") as HTMLElement;
  container.innerHTML = "";
  const clone = tmpl.content.cloneNode(true) as DocumentFragment;
  container.appendChild(clone);
  return container.firstElementChild as HTMLElement | null;
}

function mountBasket() {
  const cont = injectTemplate("basket");
  if (!cont) return;
  activeBasket = new BasketView(modalEl, uiEvents);
  activeBasket.render(cartModel.getItems());
}

function mountPreview(product: IProduct) {
  const container = injectTemplate("card-preview");
  if (!container) return;

  const title = container.querySelector(".card__title") as HTMLElement | null;
  const image = container.querySelector(
    ".card__image"
  ) as HTMLImageElement | null;
  const category = container.querySelector(
    ".card__category"
  ) as HTMLElement | null;
  const price = container.querySelector(".card__price") as HTMLElement | null;
  const text = container.querySelector(".card__text") as HTMLElement | null;
  const button = container.querySelector(
    ".card__button"
  ) as HTMLButtonElement | null;

  if (title) title.textContent = product.title ?? "";
  if (text) text.textContent = product.description ?? "";

  if (category) {
    category.textContent = product.category ?? "";
    Object.values(categoryMap).forEach((cls) => category.classList.remove(cls));
    const mod = categoryMap[product.category];
    if (mod) category.classList.add(mod);
  }

  if (image) {
    image.src = /^https?:\/\//.test(product.image ?? "")
      ? product.image ?? ""
      : `${CDN_URL}${product.image}`;
    image.alt = product.title ?? "";
  }

  if (price) {
    price.textContent = product.price
      ? `${String(product.price)
          .replace(/\D/g, "")
          .replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ")} синапсов`
      : "Бесценно";
  }

  if (button) {
    const inCart = cartModel.getItems().some((it) => it.id === product.id);

    if (!product.price) {
      button.textContent = "Недоступно";
      button.disabled = true;
      button.onclick = null;
    } else {
      button.textContent = inCart ? "Удалить из корзины" : "Купить";
      button.disabled = false;
      button.onclick = () => {
        inCart
          ? uiEvents.emit("cart:remove", { id: product.id })
          : uiEvents.emit("cart:add", { productId: product.id });
        uiEvents.emit("modal:close");
      };
    }
  }
}

productsModel.on("products:updated", ({ products }) =>
  galleryView?.render(products)
);
cartModel.on("cart:updated", ({ items }) => activeBasket?.render(items));

uiEvents.on("product:select", ({ productId }) => {
  const product = productsModel.getProductById(productId);
  if (!product) return;
  modalView.open();
  mountPreview(product);
});

uiEvents.on("header:cartClick", () => {
  modalView.open();
  mountBasket();
});

uiEvents.on("order:open", () => {
  const orderTemplate = injectTemplate("order");
  if (!orderTemplate) return;
  const orderForm = new OrderFormView(orderTemplate, uiEvents);
  orderForm.render(buyerModel.getBuyer());
  modalView.open({ content: orderTemplate });
});

uiEvents.on("order:send", () => {
  const buyer = buyerModel.getBuyer();
  const contactsTemplate = injectTemplate("contacts");
  if (!contactsTemplate) return;

  const contactsForm = new ContactsFormView(contactsTemplate, uiEvents, buyer);
  contactsForm.render(buyer);
  modalView.open({ content: contactsTemplate });
});

uiEvents.on("contacts:submit", async ({ buyer }) => {
  try {
    buyerModel.setEmail(buyer.email);
    buyerModel.setPhone(buyer.phone);
    buyerModel.setAddress(buyer.address);

    const mergedBuyer = buyerModel.getBuyer();
    const errors = buyerModel.validate("all");
    if (Object.keys(errors).length > 0) return;

    const payload: IOrderRequest = {
      payment: mergedBuyer.payment,
      email: mergedBuyer.email,
      phone: mergedBuyer.phone,
      address: mergedBuyer.address,
      items: cartModel.getItems().map((it) => it.id),
      total: cartModel.getTotalPrice(),
    };

    await comm.sendOrder(payload);

    const successTemplate = injectTemplate("success");
    if (!successTemplate) return;

    const successView = new SuccessView(successTemplate);
    successView.render({ total: cartModel.getTotalPrice() });
    modalView.open({ content: successTemplate });

    const closeBtn = successTemplate.querySelector<HTMLButtonElement>(
      ".order-success__close"
    );
    closeBtn?.addEventListener("click", () => {
      cartModel.clear();
      buyerModel.clear();
      uiEvents.emit("modal:close");
    });
  } catch (err) {
    console.error("Ошибка отправки заказа", err);
    uiEvents.emit("order:error", { error: err });
  }
});

uiEvents.on("modal:close", () => {
  modalView.close();
  const content = modalEl.querySelector(".modal__content") as HTMLElement;
  if (content) content.innerHTML = "";
});

(async function loadProducts() {
  try {
    const products = await comm.fetchProducts();
    productsModel.setProducts(products);
  } catch (err) {
    console.error("Ошибка загрузки каталога", err);
  }
})();
