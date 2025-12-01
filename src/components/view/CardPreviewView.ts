import { Component } from "../base/Component";
import { EventEmitter, AppEvents } from "../base/Events";
import { categoryMap } from "../../utils/constants";
import { getProductById } from "../../components/models/ProductsModel";
import { IProduct } from "../../types";

type ProductPartial = Partial<IProduct>;

export const PREVIEW_ADD = "preview:add";
export const PREVIEW_CLOSE = "preview:close";

export class CardPreviewView extends Component<IProduct> {
  private readonly categoryEl: HTMLElement | null;
  private readonly titleEl: HTMLElement | null;
  private readonly descEl: HTMLElement | null;

  private readonly addBtnEl: HTMLElement | null;
  private readonly closeBtnEl: HTMLElement | null;
  private events: EventEmitter;

  constructor(container: HTMLElement, events: EventEmitter) {
    super(container);
    this.events = events;

    this.categoryEl = this.container.querySelector<HTMLElement>(
      ".card-preview__category"
    );
    this.titleEl = this.container.querySelector<HTMLElement>(
      ".card-preview__title"
    );
    this.descEl = this.container.querySelector<HTMLElement>(".card__text");

    this.addBtnEl = this.container.querySelector<HTMLElement>(
      ".card-preview__button"
    );
    this.closeBtnEl = this.container.querySelector<HTMLElement>(
      ".card-preview__close"
    );

    if (this.addBtnEl) {
      this.addBtnEl.addEventListener("click", () => {
        const productId: string = this.container.dataset.productId ?? "";

        this.events.emit(PREVIEW_ADD, {
          productId,
        } as AppEvents["product:select"]);
      });
    }

    if (this.closeBtnEl) {
      this.closeBtnEl.addEventListener("click", () => {
        const productId: string | undefined = this.container.dataset.productId;

        this.events.emit(PREVIEW_CLOSE, {
          productId,
        } as AppEvents[keyof AppEvents]);
      });
    }
  }

  render(data?: ProductPartial): HTMLElement {
    if (data) {
      if (data.id != null) {
        this.container.dataset.productId = String(data.id);
      } else {
        delete this.container.dataset.productId;
      }

      if (this.titleEl) {
        this.titleEl.textContent = data.title ?? "";
      }

      if (this.descEl) {
        if (data.description) {
          this.descEl.textContent = data.description;
        } else {
          this.descEl.textContent = "";
          if (data.id != null) {
            const currentId = String(data.id);
            getProductById(currentId)
              .then((found) => {
                if (this.container.dataset.productId === currentId) {
                  this.descEl!.textContent = found?.description ?? "";
                }
              })
              .catch(() => {
                if (this.container.dataset.productId === currentId) {
                  this.descEl!.textContent = "";
                }
              });
          }
        }
      }

      if (this.categoryEl) {
        const cat = data.category ?? "";

        const keep = Array.from(this.categoryEl.classList).filter(
          (c) =>
            !c.startsWith("card__category") &&
            !c.startsWith("card-preview__category")
        );
        this.categoryEl.className = keep.join(" ").trim();

        this.categoryEl.classList.add("card-preview__category");

        const modifierClass =
          (cat && categoryMap[cat as keyof typeof categoryMap]) ||
          "card__category_other";
        this.categoryEl.classList.add(modifierClass);

        this.categoryEl.textContent = cat;
      }
    }

    return this.container;
  }
}
