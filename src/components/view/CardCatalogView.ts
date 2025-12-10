import { Component } from "../base/Component";
import { IEvents, AppEvents } from "../base/Events";
import { CDN_URL, categoryMap } from "../../utils/constants";
import { IProduct } from "../../types";

export class CardCatalogView extends Component<IProduct> {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement | null;
  private readonly img: HTMLImageElement | null;
  private readonly price: HTMLElement | null;
  private readonly categoryEl: HTMLElement | null;
  private readonly actionBtn: HTMLElement | null;

  private productId: string = "";
  private emitter?: IEvents;
  private cartItems = new Set<string>();

  constructor(container: HTMLElement, emitter?: IEvents) {
    super(container);
    this.root = container;
    this.emitter = emitter;
    this.title = this.root.querySelector(".card__title");
    this.img = this.root.querySelector<HTMLImageElement>(".card__image");
    this.price = this.root.querySelector(".card__price");
    this.categoryEl = this.root.querySelector(".card__category");
    this.actionBtn = this.root.querySelector(".card__button");

    this.root.addEventListener("click", (evt) => {
      const target = evt.target as Element;
      const btn = target.closest(".card__button");
      if (btn) {
        if (!this.productId) return;
        const inCart = (btn as HTMLElement).dataset.inCart === "true";
        if (this.emitter) {
          if (inCart)
            this.emitter.emit("cart:remove", {
              id: this.productId,
            } as AppEvents["cart:remove"]);
          else
            this.emitter.emit("cart:add", {
              productId: this.productId,
            } as AppEvents["cart:add"]);
        }
        return;
      }
      if (!this.productId) return;
      this.emitter?.emit("product:select", { productId: this.productId });
    });

    if (this.emitter) {
      this.emitter.on("cart:updated", (payload: { items: IProduct[] }) => {
        this.cartItems.clear();
        payload.items.forEach((p) => p.id && this.cartItems.add(String(p.id)));
        this.updateButton();
      });

      this.emitter.on("cart:item:added", (payload: { product: IProduct }) => {
        if (payload.product?.id) this.cartItems.add(String(payload.product.id));
        this.updateButton();
      });

      this.emitter.on("cart:item:removed", (payload: { product: IProduct }) => {
        if (payload.product?.id)
          this.cartItems.delete(String(payload.product.id));
        this.updateButton();
      });
    }
  }

  private formatNumberWithSpaces(value: string | number): string {
    const raw = String(value).replace(/\D/g, "");
    return raw.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  private updateButton() {
    if (!this.actionBtn) return;

    const inCart = !!(this.productId && this.cartItems.has(this.productId));
    if (inCart) {
      this.actionBtn.dataset.inCart = "true";
      this.actionBtn.textContent = "Удалить из корзины";
    } else {
      delete this.actionBtn.dataset.inCart;
      this.actionBtn.textContent = "Купить";
    }
  }

  render(data?: Partial<IProduct>): HTMLElement {
    if (!data) return this.root;
    this.productId = data.id ?? "";

    if (this.title) this.title.textContent = data.title ?? "";

    if (this.categoryEl) {
      Object.values(categoryMap).forEach((mod) =>
        this.categoryEl!.classList.remove(mod)
      );
      if (data.category) {
        const mod = categoryMap[data.category as keyof typeof categoryMap];
        if (mod) this.categoryEl.classList.add(mod);
        this.categoryEl.textContent = data.category ?? "";
      }
    }

    if (this.img) {
      const src =
        typeof data.image === "string" && !/^https?:\/\//i.test(data.image)
          ? `${CDN_URL}${data.image}`
          : (data.image as string) ?? "";
      if (src) (this.img.src = src), (this.img.alt = data.title ?? "");
    }

    if (this.price) {
      if (data.price == null || data.price === 0)
        this.price.textContent = "Бесценно";
      else
        this.price.textContent = `${this.formatNumberWithSpaces(
          data.price
        )} синапсов`;
    }

    this.updateButton();
    return this.root;
  }
}
