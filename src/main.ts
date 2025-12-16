import "./scss/styles.scss";
import { ProductsModel } from "./components/models/ProductsModel";
import { CartModel } from "./components/models/CartModel";
import { BuyerModel } from "./components/models/BuyerModel";
import { Api } from "./components/base/Api";
import { API_URL } from "./utils/constants";
import { Communication } from "./utils/communication";
import { IProduct, IOrderRequest, TPayment } from "./types";
import { GalleryView } from "./components/view/GalleryView";
import { BasketView } from "./components/view/BasketView";
import { ModalView } from "./components/view/ModalView";
import { EventEmitter } from "./components/base/Events";
import { OrderFormView } from "./components/view/OrderFormView";
import { ContactsFormView } from "./components/view/ContactsFormView";
import { SuccessView } from "./components/view/SuccessView";
import { CardCatalogView } from "./components/view/CardCatalogView";
import { CardBasketView } from "./components/view/CardBasketView";
import { CardPreviewView } from "./components/view/CardPreviewView";
import { cloneTemplate } from "./utils/utils";

const productsModel = new ProductsModel();
const cartModel = new CartModel();
const buyerModel = new BuyerModel();

const api = new Api(API_URL);
const comm = new Communication(api);

const uiEvents = new EventEmitter();

const galleryEl = document.querySelector(".gallery") as HTMLElement;
const galleryView = new GalleryView(galleryEl);

const modalEl = document.getElementById("modal-container") as HTMLElement;
const modalView = new ModalView(modalEl);

let activeBasketView: BasketView | null = null;
let activeOrderForm: OrderFormView | null = null;
let activeContactsForm: ContactsFormView | null = null;

const headerBasketBtn = document.querySelector(
  ".header__basket"
) as HTMLElement;
const headerBasketCounter = document.querySelector(
  ".header__basket-counter"
) as HTMLElement;

headerBasketBtn.addEventListener("click", (e) => {
  e.preventDefault();
  uiEvents.emit("header:cartClick");
});

function buildCatalogElements(products: IProduct[]): HTMLElement[] {
  return products.map((product) => {
    const el = cloneTemplate<HTMLElement>("#card-catalog");
    return new CardCatalogView(el, uiEvents).render({
      ...product,
      inCart: cartModel.hasItem(product.id),
    });
  });
}

function buildBasketElements(items: IProduct[]): HTMLElement[] {
  return items.map((product, index) => {
    const el = cloneTemplate<HTMLElement>("#card-basket");
    return new CardBasketView(el, uiEvents).render(product, index);
  });
}

function mountBasket() {
  const content = cloneTemplate<HTMLElement>("#basket");
  modalView.open({ content });

  activeBasketView = new BasketView(content, uiEvents);
  activeBasketView.render(
    buildBasketElements(cartModel.getItems()),
    cartModel.getTotalPrice()
  );
}

function mountPreview(product: IProduct) {
  const content = cloneTemplate<HTMLElement>("#card-preview");
  modalView.open({
    content: new CardPreviewView(content, uiEvents).render({
      product,
      inCart: cartModel.getItems().some((i) => i.id === product.id),
    }),
  });
}

uiEvents.on("cart:add", ({ productId }) => {
  const product = productsModel.getProductById(productId);
  if (!product) return;

  if (!cartModel.getItems().some((item) => item.id === product.id)) {
    cartModel.addItem(product);
  }

  uiEvents.emit("modal:close");
});

uiEvents.on("cart:remove", ({ id }) => {
  cartModel.removeItem(id);
  uiEvents.emit("modal:close");
});

uiEvents.on("product:select", ({ productId }) => {
  const product = productsModel.getProductById(productId);
  if (product) mountPreview(product);
});

uiEvents.on("header:cartClick", () => {
  mountBasket();
});

productsModel.on("products:updated", ({ products }) => {
  galleryView.render(buildCatalogElements(products));
});

cartModel.on("cart:updated", ({ items }) => {
  headerBasketCounter.textContent = String(items.length);

  if (activeBasketView) {
    activeBasketView.render(
      buildBasketElements(items),
      cartModel.getTotalPrice()
    );
  }
});

galleryView.render(buildCatalogElements(productsModel.getProducts()));

uiEvents.on("order:open", () => {
  const el = cloneTemplate<HTMLElement>("#order");
  activeOrderForm = new OrderFormView(el, uiEvents);

  activeOrderForm.render(buyerModel.getBuyer());

  activeOrderForm.setErrors(buyerModel.validate("order"));

  modalView.open({ content: el });
});

uiEvents.on("form:payment:changed", ({ payment }) => {
  buyerModel.setPayment(payment as TPayment);
});

uiEvents.on("form:field:changed", ({ field, value }) => {
  if (field === "address") {
    buyerModel.setAddress(value);
    activeOrderForm?.setErrors(buyerModel.validate("order"));
  }
});

uiEvents.on("order:send", () => {
  const errors = buyerModel.validate("order");
  activeOrderForm?.setErrors(errors);

  if (Object.keys(errors).length === 0) {
    const el = cloneTemplate<HTMLElement>("#contacts");
    activeContactsForm = new ContactsFormView(el, uiEvents);
    activeContactsForm.render(buyerModel.getBuyer());

    activeContactsForm.setErrors(buyerModel.validate("contacts"));

    modalView.open({ content: el });
  }
});

uiEvents.on("contacts:change", ({ buyer }) => {
  buyerModel.setBuyerData({
    email: buyer.email,
    phone: buyer.phone,
  });

  activeContactsForm?.setErrors(buyerModel.validate("contacts"));
});

uiEvents.on("contacts:submit", async ({ buyer }) => {
  buyerModel.setBuyerData({
    email: buyer.email,
    phone: buyer.phone,
  });

  const errors = buyerModel.validate("all");
  if (Object.keys(errors).length) {
    activeContactsForm?.setErrors(errors);
    return;
  }

  const order: IOrderRequest = {
    ...buyerModel.getBuyer(),
    items: cartModel.getItems().map((i) => i.id),
    total: cartModel.getTotalPrice(),
  };

  try {
    await comm.sendOrder(order);

    const el = cloneTemplate<HTMLElement>("#success");
    new SuccessView(el).render({ total: order.total });
    modalView.open({ content: el });

    el.querySelector("button")?.addEventListener("click", () => {
      cartModel.clear();
      buyerModel.clear();
      modalView.close();
    });
  } catch (err) {
    console.error("Ошибка при отправке заказа:", err);
  }
});

uiEvents.on("modal:close", () => {
  modalView.close();
  activeBasketView = null;
  activeOrderForm = null;
  activeContactsForm = null;
});

(async () => {
  const products = await comm.fetchProducts();
  productsModel.setProducts(products);
})();
