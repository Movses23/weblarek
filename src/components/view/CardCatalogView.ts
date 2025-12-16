import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { CDN_URL, categoryMap } from "../../utils/constants";
import { IProduct } from "../../types";

type CardCatalogRenderData = IProduct & {
  inCart?: boolean;
};

export class CardCatalogView extends Component<CardCatalogRenderData> {
  private readonly root: HTMLElement;
  private readonly title: HTMLElement | null;
  private readonly img: HTMLImageElement | null;
  private readonly price: HTMLElement | null;
  private readonly categoryEl: HTMLElement | null;
  private readonly actionBtn: HTMLElement | null;

  private productId = "";

  constructor(container: HTMLElement, private readonly events: EventEmitter) {
    super(container);
    this.root = container;

    this.title = this.root.querySelector(".card__title");
    this.img = this.root.querySelector<HTMLImageElement>(".card__image");
    this.price = this.root.querySelector(".card__price");
    this.categoryEl = this.root.querySelector(".card__category");
    this.actionBtn = this.root.querySelector(".card__button");

    this.root.addEventListener("click", (evt) => {
      const target = evt.target as Element;

      if (target.closest(".card__button")) {
        if (!this.productId) return;
        this.events.emit("card:action", { productId: this.productId });
        return;
      }

      if (!this.productId) return;
      this.events.emit("product:select", { productId: this.productId });
    });
  }

  private formatPrice(value: number): string {
    return String(value)
      .replace(/\D/g, "")
      .replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  render(data?: Partial<CardCatalogRenderData>): HTMLElement {
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
        this.categoryEl.textContent = data.category;
      }
    }

    if (this.img && data.image) {
      const src = /^https?:\/\//i.test(data.image)
        ? data.image
        : `${CDN_URL}${data.image}`;
      this.img.src = src;
      this.img.alt = data.title ?? "";
    }

    if (this.price) {
      if (data.price == null || data.price === 0) {
        this.price.textContent = "Бесценно";
      } else {
        this.price.textContent = `${this.formatPrice(data.price)} синапсов`;
      }
    }

    if (this.actionBtn) {
      if (data.price == null) {
        this.actionBtn.textContent = "Недоступно";
        this.actionBtn.setAttribute("disabled", "true");
      } else if (data.inCart) {
        this.actionBtn.textContent = "Удалить из корзины";
        this.actionBtn.removeAttribute("disabled");
      } else {
        this.actionBtn.textContent = "Купить";
        this.actionBtn.removeAttribute("disabled");
      }
    }

    return this.root;
  }
}
