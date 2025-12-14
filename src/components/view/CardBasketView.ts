import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { IProduct } from "../../types";

export class CardBasketView extends Component<IProduct> {
  private readonly eventBus: EventEmitter;

  private productId: string = "";

  private titleEl: HTMLElement | null;
  private priceEl: HTMLElement | null;
  private indexEl: HTMLElement | null;
  private deleteBtn: HTMLButtonElement | null;

  constructor(container: HTMLElement, eventBus: EventEmitter) {
    super(container);
    this.eventBus = eventBus;

    this.indexEl = container.querySelector(".basket__item-index");
    this.titleEl = container.querySelector(".card__title");
    this.priceEl = container.querySelector(".card__price");
    this.deleteBtn = container.querySelector<HTMLButtonElement>(
      ".basket__item-delete"
    );

    this.onRemoveClick = this.onRemoveClick.bind(this);
  }

  render(product?: Partial<IProduct>, index?: number): HTMLElement {
    if (product) {
      this.productId = product.id ?? "";
      if (this.indexEl && typeof index === "number") {
        this.indexEl.textContent = String(index + 1);
      }
      if (this.titleEl) this.titleEl.textContent = product.title ?? "";
      if (this.priceEl) {
        if (product.price == null || product.price === 0)
          this.priceEl.textContent = "Бесценно";
        else
          this.priceEl.textContent = `${String(product.price)
            .replace(/\D/g, "")
            .replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ")} синапсов`;
      }
    }

    if (this.deleteBtn) {
      this.deleteBtn.removeEventListener("click", this.onRemoveClick);
      this.deleteBtn.addEventListener("click", this.onRemoveClick);
    }

    return this.container;
  }

  private onRemoveClick(e: Event) {
    e.preventDefault();
    if (!this.productId) return;

    this.eventBus.emit("cart:remove", { id: this.productId });
  }
}
