import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { IProduct } from "../../types";

export class CardBasketView extends Component<IProduct> {
  private readonly eventBus: EventEmitter;

  private productId: string = "";

  constructor(container: HTMLElement, eventBus: EventEmitter) {
    super(container);
    this.eventBus = eventBus;

    this.onRemoveClick = this.onRemoveClick.bind(this);
  }

  render(product?: Partial<IProduct>): HTMLElement {
    if (product) {
      this.productId = product.id ?? "";
    }

    return super.render();
  }

  private onRemoveClick(e: Event) {
    e.preventDefault();
    if (!this.productId) return;

    this.eventBus.emit("cart:remove", { id: this.productId });
  }
}
