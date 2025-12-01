import "./scss/styles.scss";
import { ProductsModel } from "../src/components/models/ProductsModel";
import { CartModel } from "../src/components/models/CartModel";
import { BuyerModel } from "../src/components/models/BuyerModel";
import { Api } from "./components/base/Api";
import { API_URL } from "./utils/constants";
import { Communication } from "./utils/communication";
import { IProduct, IBuyer, TPayment } from "./types";
import { CardCatalogView } from "../src/components/view/CardCatalogView";
import { BasketView } from "../src/components/view/BasketView";
import { CardBaseView } from "../src/components/view/CardBaseView";
import { CardBasketView } from "../src/components/view/CardBasketView";
import { CardPreviewView } from "../src/components/view/CardPreviewView";
import { ContactsFormView } from "../src/components/view/ContactsFormView";
import { FormBaseView } from "../src/components/view/FormBaseView";
import { GalleryView } from "../src/components/view/GalleryView";
import { HeaderView } from "../src/components/view/HeaderView";
import { ModalView } from "../src/components/view/ModalView";
import { OrderFormView } from "../src/components/view/OrderFormView";
import { SuccessView } from "../src/components/view/SuccessView";
import { EventEmitter, AppEvents } from "../src/components/base/Events";

const productsModel = new ProductsModel();
const cartModel = new CartModel();
const buyerModel = new BuyerModel();
const api = new Api(API_URL);
const comm = new Communication(api);
const uiEvents = new EventEmitter();
const CATALOG_SELECTOR = ".gallery";
const galleryContainer = document.querySelector(
  CATALOG_SELECTOR
) as HTMLElement | null;
let galleryView: GalleryView | null = null;
if (galleryContainer) {
  galleryView = new GalleryView(galleryContainer, uiEvents);
}
productsModel.on("products:updated", ({ products }) => {
  if (galleryView && typeof galleryView.render === "function") {
    galleryView.render(products);
    return;
  }
  const container = document.querySelector(
    CATALOG_SELECTOR
  ) as HTMLElement | null;
  if (!container) {
    console.warn(
      "Контейнер каталога не найден по селектору:",
      CATALOG_SELECTOR
    );
    return;
  }
  container.innerHTML = "";
  const cardElements = products.map((p: IProduct) => {
    const wrapper = document.createElement("div");
    const cardRoot = wrapper.firstElementChild as HTMLElement;
    const base = new CardBaseView(cardRoot, uiEvents);
    base.render(p);
    const cardView = new CardCatalogView(cardRoot, uiEvents);
    return cardView.render(p);
  });
  cardElements.forEach((el) => container.appendChild(el));
});
uiEvents.on("product:select", ({ productId }: { productId?: string } = {}) => {
  if (productId) {
    productsModel.setSelectedProduct(productId);
  }
});
function renderTemplateIntoModalContent(
  templateId: string
): HTMLElement | null {
  const tmpl = document.getElementById(
    templateId
  ) as HTMLTemplateElement | null;
  const modal = document.querySelector(".modal") as HTMLElement | null;
  if (!tmpl || !modal) return null;
  const contentArea = modal.querySelector(".modal__content") as HTMLElement;
  if (!contentArea) return null;
  contentArea.innerHTML = "";
  const clone = tmpl.content.cloneNode(true) as DocumentFragment;
  contentArea.appendChild(clone);
  const first =
    contentArea.firstElementChild ||
    (contentArea.querySelector(":scope > *") as Element | null);
  return first as HTMLElement | null;
}
const headerEl = document.querySelector(".header") as HTMLElement | null;
if (headerEl) {
  const basketBtn = headerEl.querySelector(
    ".header__basket"
  ) as HTMLElement | null;
  if (basketBtn) basketBtn.classList.add("header__cart");
  const basketCounter = headerEl.querySelector(
    ".header__basket-counter"
  ) as HTMLElement | null;
  if (basketCounter) basketCounter.classList.add("header__cart-count");
}
let headerView: HeaderView | null = null;
if (headerEl) {
  headerView = new HeaderView(headerEl, uiEvents, () => {
    uiEvents.emit("modal:open", { id: "cart" });
  });
}
const modalEl = document.querySelector(".modal") as HTMLElement | null;
if (!modalEl) {
  throw new Error(
    "Modal element '.modal' not found in DOM — дальнейшая работа невозможна."
  );
}
const modalRoot: HTMLElement = modalEl;
modalRoot.addEventListener("click", (e: MouseEvent) => {
  if (e.target === modalRoot) {
    uiEvents.emit("modal:close");
  }
});
const modalView = new ModalView(modalRoot);
const successView = new SuccessView(modalEl, uiEvents);
let activeBasketView: BasketView | null = null;
function mountBasket(): void {
  const inserted = renderTemplateIntoModalContent("basket");
  if (!inserted) return;
  activeBasketView = new BasketView(modalRoot, uiEvents);
  activeBasketView.render(cartModel.getItems());
  const btn = modalRoot.querySelector(
    ".basket__button"
  ) as HTMLButtonElement | null;
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      mountOrderForm();
    });
  }
  syncBasketCardPresenters(cartModel.getItems());
}
let activeOrderFormView: OrderFormView | null = null;
function mountOrderForm(): void {
  const inserted = renderTemplateIntoModalContent("order");
  if (!inserted) return;

  const formEl =
    inserted.querySelector<HTMLFormElement>('form[name="order"]') ?? null;
  if (formEl) {
    formEl.addEventListener("click", (e) => e.stopPropagation());
    formEl.addEventListener("submit", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    const formEvents = new EventEmitter();
    const formView = new FormBaseView(formEl, formEvents);
    formView.render();
    formEvents.on("buyer:updated", ({ buyer }: { buyer: IBuyer }) => {
      if (buyer.email !== undefined) buyerModel.setEmail(buyer.email);
      if (buyer.phone !== undefined) buyerModel.setPhone(buyer.phone);
      if (buyer.payment !== undefined && String(buyer.payment).trim() !== "") {
        buyerModel.setPayment(buyer.payment as TPayment);
      }
      if (buyer.address !== undefined && String(buyer.address).trim() !== "") {
        buyerModel.setAddress(buyer.address);
      }
      setTimeout(() => uiEvents.emit("modal:open", { id: "contacts" }), 0);
    });
    formEvents.on(
      "buyer:validated",
      ({ buyer }: AppEvents["buyer:validated"]) => {
        if (buyer.email !== undefined) buyerModel.setEmail(buyer.email);
        if (buyer.phone !== undefined) buyerModel.setPhone(buyer.phone);
        if (buyer.address !== undefined) buyerModel.setAddress(buyer.address);

        if (
          buyer.payment !== undefined &&
          String(buyer.payment).trim() !== ""
        ) {
          buyerModel.setPayment(buyer.payment);
        }

        setTimeout(() => {
          uiEvents.emit("modal:open", { id: "contacts" });
        }, 0);
      }
    );
  }
  const payBtnCard =
    inserted.querySelector<HTMLButtonElement>('button[name="card"]') ?? null;
  const payBtnCash =
    inserted.querySelector<HTMLButtonElement>('button[name="cash"]') ?? null;
  if (payBtnCard) payBtnCard.setAttribute("data-payment", "card");
  if (payBtnCash) payBtnCash.setAttribute("data-payment", "cash");
  activeOrderFormView = new OrderFormView(
    modalRoot,
    uiEvents as EventEmitter,
    undefined
  );
  activeOrderFormView.render(buyerModel.getBuyer());
}
let activeContactsFormView: ContactsFormView | null = null;
function mountContactsForm(): void {
  const inserted = renderTemplateIntoModalContent("contacts");
  if (!inserted) return;
  inserted.addEventListener("click", (e) => e.stopPropagation());
  const contactsEvents = new EventEmitter();
  const formEl =
    inserted.querySelector<HTMLFormElement>('form[name="contacts"]') ?? null;
  const submitBtn =
    inserted.querySelector<HTMLButtonElement>('button[type="submit"]') ?? null;
  const emailInput =
    inserted.querySelector<HTMLInputElement>('input[name="email"]') ?? null;
  const phoneInput =
    inserted.querySelector<HTMLInputElement>('input[name="phone"]') ?? null;
  const errorsEl =
    inserted.querySelector<HTMLSpanElement>(".form__errors") ?? null;
  activeContactsFormView = new ContactsFormView(inserted, contactsEvents);
  activeContactsFormView.render(buyerModel.getBuyer());
  const isValidEmail = (v: string) => /^\S+@\S+.\S+$/.test(v);
  const isValidPhone = (v: string) => {
    const digits = (v || "").replace(/\D/g, "");
    return digits.length >= 10;
  };
  function updateSubmitButtonState() {
    if (!submitBtn) return;
    const email = (emailInput?.value ?? "").trim();
    const phone = (phoneInput?.value ?? "").trim();
    const hasRelevantErrors = !isValidEmail(email) || !isValidPhone(phone);
    submitBtn.disabled = hasRelevantErrors;
    if (hasRelevantErrors) submitBtn.setAttribute("disabled", "");
    else submitBtn.removeAttribute("disabled");
  }
  const emitChangeFromInputs = () => {
    const email = (emailInput?.value ?? "").trim();
    const phone = (phoneInput?.value ?? "").trim();
    buyerModel.setEmail(email);
    buyerModel.setPhone(phone);
    contactsEvents.emit(
      "contacts:change" as keyof AppEvents,
      {
        buyer: buyerModel.getBuyer(),
      } as AppEvents["contacts:change"]
    );
    updateSubmitButtonState();
  };
  const trySendOrContinue = () => {
    emitChangeFromInputs();
    const snap = buyerModel.getBuyer();
    const errors: Record<string, string> = {};
    if (!isValidEmail((emailInput?.value ?? "").trim()))
      errors.email = "Некорректный email";
    if (!isValidPhone((phoneInput?.value ?? "").trim()))
      errors.phone = "Некорректный телефон";
    if (!snap.address) errors.address = "Необходимо указать адрес";
    if (!snap.payment) errors.payment = "Выберите способ оплаты";
    const keys = Object.keys(errors);
    if (keys.length === 0) {
      cleanup();
      uiEvents.emit("order:send");
      return;
    }
    if (keys.length === 1 && errors.address) {
      cleanup();
      uiEvents.emit("modal:open", { id: "order" });
      return;
    }
    const msg = Object.values(errors).join("; ");
    if (errorsEl) errorsEl.textContent = msg;
    else console.warn("Contacts: форма невалидна:", errors);
  };
  const onEmailInput = () => emitChangeFromInputs();
  const onPhoneInput = () => emitChangeFromInputs();
  const onFormSubmit = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    trySendOrContinue();
  };
  const onSubmitBtnClick = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    if (submitBtn?.disabled) return;
    trySendOrContinue();
  };
  const onContactsChange = ({ buyer }: AppEvents["contacts:change"]) => {
    if (buyer.email !== undefined) buyerModel.setEmail(buyer.email);
    if (buyer.phone !== undefined) buyerModel.setPhone(buyer.phone);

    if (buyer.payment !== undefined && String(buyer.payment).trim() !== "") {
      buyerModel.setPayment(buyer.payment as TPayment);
    }

    if (buyer.address !== undefined && String(buyer.address).trim() !== "") {
      buyerModel.setAddress(buyer.address);
    }

    updateSubmitButtonState();
  };

  emailInput?.addEventListener("input", onEmailInput);
  phoneInput?.addEventListener("input", onPhoneInput);
  formEl?.addEventListener("submit", onFormSubmit);
  submitBtn?.addEventListener("click", onSubmitBtnClick);

  contactsEvents.on("contacts:change", onContactsChange);

  buyerModel.on("buyer:updated", updateSubmitButtonState);

  let cleaned = false;

  const onModalClose = () => cleanup();
  uiEvents.on("modal:close", onModalClose);

  function cleanup() {
    if (cleaned) return;
    cleaned = true;

    emailInput?.removeEventListener("input", onEmailInput);
    phoneInput?.removeEventListener("input", onPhoneInput);
    formEl?.removeEventListener("submit", onFormSubmit);
    submitBtn?.removeEventListener("click", onSubmitBtnClick);
    contactsEvents.off("contacts:change", onContactsChange);

    buyerModel.off("buyer:updated", updateSubmitButtonState);

    activeContactsFormView?.destroy?.();
    activeContactsFormView = null;

    uiEvents.off("modal:close", onModalClose);
  }

  updateSubmitButtonState();
}
function mountSuccess(): void {
  const inserted = renderTemplateIntoModalContent("success");
  if (!inserted) return;
  successView.open();
}
const basketCardPresenters = new Map<
  string,
  { view: CardBasketView; node: HTMLElement }
>();
function syncBasketCardPresenters(items: IProduct[]): void {
  const listEl = modalRoot.querySelector(".basket__list") as HTMLElement | null;
  if (!listEl) {
    return;
  }
  const ids = items.map((it) => it.id);
  for (const [id, entry] of Array.from(basketCardPresenters.entries())) {
    if (!ids.includes(id)) {
      if (entry.node && entry.node.parentElement) {
        entry.node.parentElement.removeChild(entry.node);
      }
      basketCardPresenters.delete(id);
    }
  }
  function formatNumberWithSpaces(value: string | number): string {
    const str = String(value);
    return str.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }
  function formatPrice(price?: number | null): string {
    if (price === null || price === undefined) return "—";
    const formatted = formatNumberWithSpaces(price);
    return `${formatted}\u00A0синапсов`;
  }
  const priceEl = modalRoot.querySelector<HTMLElement>(".basket__price");
  if (priceEl) {
    priceEl.textContent = formatPrice(cartModel.getTotalPrice());
  }
}
cartModel.on("cart:updated", ({ items }) => {
  if (activeBasketView) activeBasketView.render(items);
  syncBasketCardPresenters(items);
  uiEvents.emit("cart:updated", { items });
});
cartModel.on("cart:item:added", (payload) =>
  uiEvents.emit("cart:item:added", payload)
);
productsModel.on("products:updated", ({ products }) => {
  for (const [id, entry] of basketCardPresenters.entries()) {
    const prod = products.find((p) => p.id === id);
    if (prod) {
      entry.view.render(prod);
    }
  }
});
uiEvents.on("modal:close", () => {
  basketCardPresenters.forEach(({ node }) => {
    if (node && node.parentElement) node.parentElement.removeChild(node);
  });
  basketCardPresenters.clear();
});
buyerModel.on("buyer:updated", ({ buyer }) => {
  if (activeOrderFormView) activeOrderFormView.render(buyer);
  uiEvents.emit("buyer:updated", { buyer });
});
buyerModel.on("buyer:validated", (payload) =>
  uiEvents.emit("buyer:validated", payload)
);
uiEvents.on("cart:add", ({ productId }: { productId?: string } = {}) => {
  if (!productId) return;
  const product = productsModel.getProductById(productId);
  if (!product) {
    console.warn(
      "Попытка добавить несуществующий продукт в корзину:",
      productId
    );
    return;
  }
  cartModel.addItem(product);
});
uiEvents.on("cart:remove", ({ id }: { id?: string } = {}) => {
  if (!id) return;
  cartModel.removeItem(id);
});
uiEvents.on("cart:clear", () => {
  cartModel.clear();
});
uiEvents.on("modal:open", ({ id }: { id?: string } = {}) => {
  modalView.open();
  activeBasketView = null;
  activeOrderFormView = null;
  if (id === "cart") {
    mountBasket();
    return;
  }
  if (id === "order") {
    mountOrderForm();
    return;
  }
  if (id === "contacts") {
    mountContactsForm();
    return;
  }
  if (id === "success") {
    mountSuccess();
    return;
  }
});
uiEvents.on("modal:close", () => {
  modalView.close();
  const content = modalEl.querySelector(
    ".modal__content"
  ) as HTMLElement | null;
  if (content) content.innerHTML = "";
});
uiEvents.on("basket:toggle", () => {
  modalView.open();
  mountBasket();
});
uiEvents.on("basket:close", () => {
  modalView.close();
});
uiEvents.on("order:open", () => {
  mountOrderForm();
});
uiEvents.on("buyer:setPayment", ({ payment }) =>
  buyerModel.setPayment(payment as TPayment)
);
uiEvents.on("buyer:setEmail", ({ email }) => buyerModel.setEmail(email));
uiEvents.on("buyer:setPhone", ({ phone }) => buyerModel.setPhone(phone));
uiEvents.on("buyer:setAddress", ({ address }) =>
  buyerModel.setAddress(address)
);
uiEvents.on("order:send", async () => {
  const errors = buyerModel.validate();
  const hasErrors = Object.keys(errors).length > 0;
  if (hasErrors) {
    return;
  }
  const orderPayload = {
    buyer: buyerModel.getBuyer(),
    items: cartModel.getItems(),
    total: cartModel.getTotalPrice(),
  };

  try {
    console.info("Отправка заказа:", orderPayload);

    const total = cartModel.getTotalPrice();
    const formatted = total.toLocaleString();

    openTemplate("success", { totalFormatted: formatted });

    uiEvents.emit("order:submit", {
      order: {
        buyer: buyerModel.getBuyer(),
        items: cartModel.getItems(),
        total,
      },
    });

    cartModel.clear();
    buyerModel.clear();
  } catch (err) {
    console.error("Ошибка отправки заказа:", err);
    uiEvents.emit("order:error", { error: err });
  }
});
const modalCloseBtn = modalEl.querySelector(
  ".modal__close"
) as HTMLElement | null;
if (modalCloseBtn) {
  modalCloseBtn.addEventListener("click", (e) => {
    e.preventDefault();
    uiEvents.emit("modal:close", undefined);
  });
}
productsModel.on("product:selected", ({ product }) => {
  if (!product) return;
  modalView.open();
  const inserted = renderTemplateIntoModalContent("card-preview");
  if (!inserted) return;
  const base = new CardBaseView(inserted as HTMLElement, uiEvents);
  base.render(product);
  const previewView = new CardPreviewView(inserted as HTMLElement, uiEvents);
  previewView.render(product);
});
(async function loadCatalog() {
  try {
    const items: IProduct[] = await comm.fetchProducts();
    productsModel.setProducts(items);
  } catch (err) {
    console.error("Ошибка загрузки каталога:", err);
  }
})();
if (headerView) {
  headerView.render({
    logoSrc: undefined,
    logoAlt: undefined,
    count: cartModel.getCount(),
  });
}

const model = new BuyerModel();
const modal = new ModalView(
  document.getElementById("modal-container") as HTMLElement
);

model.on("buyer:validated", (payload: AppEvents["buyer:validated"]) => {
  uiEvents.emit("buyer:validated", payload);
});

model.on("buyer:updated", (payload: AppEvents["buyer:updated"]) => {
  uiEvents.emit("buyer:updated", payload);
});

type ViewInstance = OrderFormView | ContactsFormView | SuccessView | null;

let currentView: ViewInstance = null;

function destroyCurrentView() {
  if (currentView) {
    try {
      currentView.destroy();
    } catch {}
  }

  currentView = null;
  modal.clearContent();
}

type SuccessData = {
  total?: number;
  totalFormatted?: string;
};

function openTemplate(templateId: string, data?: SuccessData) {
  const tpl = document.getElementById(templateId) as HTMLTemplateElement | null;
  if (!tpl) return;

  destroyCurrentView();

  const wrapper = document.createElement("div");
  wrapper.appendChild(tpl.content.cloneNode(true));

  modal.open({
    content: wrapper,
    afterAppendRender: () => {
      if (templateId === "order") {
        currentView = new OrderFormView(wrapper as HTMLElement, uiEvents);
        currentView.render(buyerModel.getBuyer());
      } else if (templateId === "contacts") {
        currentView = new ContactsFormView(wrapper as HTMLElement, uiEvents);
        currentView.render(buyerModel.getBuyer());
      } else if (templateId === "success") {
        currentView = new SuccessView(wrapper as HTMLElement, uiEvents);
        try {
          currentView.render(data ?? {});
        } catch {
          currentView.render();
        }
      }
    },
  });
}

uiEvents.on("buyer:validate:contacts", () => {
  model.validate("contacts");
});

uiEvents.on("buyer:setPayment", (p) => model.setPayment(p.payment));
uiEvents.on("buyer:setEmail", (p) => model.setEmail(p.email));
uiEvents.on("buyer:setPhone", (p) => model.setPhone(p.phone));
uiEvents.on("buyer:setAddress", (p) => model.setAddress(p.address));

uiEvents.on("buyer:validate", () => {
  const errors = model.validate("order");

  if (!errors || Object.keys(errors).length === 0) {
    openTemplate("contacts");
  }
});

uiEvents.on("order:send", () => {
  const errors = model.validate("order");
  if (!errors || Object.keys(errors).length === 0) {
    openTemplate("contacts");
  }
});

uiEvents.on("contacts:submit", (payload) => {
  try {
    const buyerPartial: Partial<IBuyer> | undefined = payload.buyer;
    if (!buyerPartial) {
      console.warn("contacts:submit without buyer payload");
      return;
    }

    buyerModel.setBuyerData(buyerPartial);

    const errors = buyerModel.validate("contacts");
    if (errors && Object.keys(errors).length > 0) {
      console.warn(
        "Contacts validation failed, won't proceed to success:",
        errors
      );
      return;
    }

    const total = cartModel.getTotalPrice();

    interface WindowWithFormatPrice extends Window {
      formatPrice?: (value: number) => string;
    }

    const win = window as WindowWithFormatPrice;

    const totalFormatted: string =
      typeof win.formatPrice === "function"
        ? win.formatPrice(total)
        : total.toLocaleString();

    openTemplate("success", { total, totalFormatted });

    uiEvents.emit("order:submit", {
      order: {
        buyer: buyerModel.getBuyer(),
        items: cartModel.getItems(),
        total,
      },
    });

    cartModel.clear();
    buyerModel.clear();
  } catch (err: unknown) {
    console.error("Error handling contacts:submit:", err);

    uiEvents.emit("order:error", { error: err });
  }
});

model.on("buyer:updated", ({ buyer }: { buyer: IBuyer }) => {
  if (currentView && typeof currentView.render === "function") {
    try {
      currentView.render(buyer);
    } catch {}
  }
});

const basketBtn = document.querySelector(
  ".basket__button"
) as HTMLElement | null;
if (basketBtn) {
  basketBtn.addEventListener("click", () => openTemplate("order"));
}

uiEvents.on("modal:close", () => modal.close());
