import { Component } from "../base/Component";
import { IProduct } from "../../types";
import { CardCatalogView } from "./CardCatalogView";
import { EventEmitter } from "../base/Events";

export class GalleryView extends Component<IProduct[]> {
  private listEl: HTMLElement;
  private events: EventEmitter;
  private template: HTMLTemplateElement | null;

  constructor(container: HTMLElement, events: EventEmitter) {
    super(container);
    this.events = events;
    this.listEl =
      (container.querySelector(".gallery__list") as HTMLElement) || container;
    this.template = document.getElementById(
      "card-catalog"
    ) as HTMLTemplateElement | null;
  }

  render(products?: IProduct[]): HTMLElement {
    this.listEl.innerHTML = "";
    if (!products?.length) return this.container;

    products.forEach((product) => {
      if (!this.template) return;
      const clone = this.template.content.cloneNode(true) as DocumentFragment;
      const cardEl = clone.querySelector<HTMLElement>(".card");
      if (!cardEl) return;

      cardEl.dataset.productId = String(product.id);
      new CardCatalogView(cardEl, this.events).render(product);
      this.listEl.appendChild(cardEl);
    });

    return this.container;
  }
}
