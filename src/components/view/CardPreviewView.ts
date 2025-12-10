import { Component } from "../base/Component";
import { EventEmitter, AppEvents } from "../base/Events";

import { IProduct } from "../../types";

export const PREVIEW_ADD = "preview:add";
export const PREVIEW_CLOSE = "preview:close";

export class CardPreviewView extends Component<IProduct> {
  private readonly addBtnEl: HTMLButtonElement | null;
  private readonly closeBtnEl: HTMLElement | null;
  private events: EventEmitter;
  private productId: string = "";

  constructor(container: HTMLElement, events: EventEmitter) {
    super(container);
    this.events = events;

    this.addBtnEl = this.container.querySelector(".card-preview__button");
    this.closeBtnEl = this.container.querySelector(".card__close");

    if (this.addBtnEl) {
      this.addBtnEl.addEventListener("click", () => {
        if (this.productId && !this.addBtnEl?.disabled) {
          this.events.emit(PREVIEW_ADD, {
            productId: this.productId,
          } as AppEvents["product:select"]);
        }
      });
    }

    if (this.closeBtnEl) {
      this.closeBtnEl.addEventListener("click", () => {
        this.events.emit(PREVIEW_CLOSE, {
          productId: this.productId,
        } as AppEvents[keyof AppEvents]);
      });
    }
  }

  render(product?: IProduct): HTMLElement {
    if (!product) return this.container;
    this.productId = product.id;

    return this.container;
  }
}
