import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { categoryMap } from "../../utils/constants";
import { IProduct } from "../../types";

export class CardBasketView extends Component<IProduct> {
  private readonly eventBus: EventEmitter;

  private readonly elCategory: HTMLElement | null;
  private readonly elTitle: HTMLElement | null;
  private readonly elPrice: HTMLElement | null;
  private readonly elRemoveBtn: HTMLElement | null;

  constructor(container: HTMLElement, eventBus: EventEmitter) {
    super(container);
    this.eventBus = eventBus;

    this.elCategory = this.container.querySelector(".card__category");

    this.elTitle = this.container.querySelector(".card__title");
    this.elPrice = this.container.querySelector(".card__price");
    this.elRemoveBtn = this.container.querySelector(".card__remove");

    this.onRemoveClick = this.onRemoveClick.bind(this);
    this.onOpenClick = this.onOpenClick.bind(this);

    if (this.elRemoveBtn) {
      this.elRemoveBtn.addEventListener("click", this.onRemoveClick);
    }

    if (this.elTitle) {
      this.elTitle.addEventListener("click", this.onOpenClick);
    }
  }
  private formatNumberWithSpaces(value: string | number): string {
    const str = String(value);
    return str.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  private formatPrice(price?: number | null): string {
    const formatted = this.formatNumberWithSpaces(price as string | number);

    return `${formatted} синапсов`;
  }

  render(product?: Partial<IProduct>): HTMLElement {
    if (product) {
      const id = product.id ?? "";

      if (id) {
        this.container.dataset.id = id;
      } else {
        delete this.container.dataset.id;
      }
      if (this.elCategory) {
        const base = "card__category";
        this.elCategory.className = base;
        const categoryName = product.category ?? "";
        const mod = categoryMap[categoryName as keyof typeof categoryMap];
        if (mod) {
          this.elCategory.classList.add(mod);
        }
        this.elCategory.textContent = categoryName;
      }

      if (this.elTitle) {
        this.elTitle.textContent = product.title ?? "";
      }

      if (this.elPrice) {
        const price = product.price;
        this.elPrice.textContent =
          price === null || price === undefined
            ? "Бесценно"
            : `${this.formatPrice(price)} синапсов`;
      }
    }

    return super.render();
  }

  private onRemoveClick(e: Event) {
    e.preventDefault();
    const productId = this.container.dataset.id;
    if (!productId) return;

    this.eventBus.emit("cart:remove", { id: productId });
  }

  private onOpenClick(e: Event) {
    e.preventDefault();
    const productId = this.container.dataset.id;
    if (!productId) return;
    this.eventBus.emit("product:select", { productId });
  }
}
