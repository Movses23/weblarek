import { Component } from "../base/Component";
import { IEvents, AppEvents } from "../base/Events";
import { CDN_URL, categoryMap } from "../../utils/constants";
import { IProduct } from "../../types";

type ActionHandler = <K extends keyof AppEvents>(
  eventName: K,
  data?: AppEvents[K]
) => void;

export class CardBaseView extends Component<IProduct> {
  protected readonly root: HTMLElement;
  protected readonly categoryEl: HTMLElement | null;
  protected readonly titleEl: HTMLElement | null;
  protected readonly imgEl: HTMLImageElement | null;
  protected readonly priceEl: HTMLElement | null;
  protected readonly actionBtnEl: HTMLElement | null;

  private readonly emitter?: IEvents;
  private readonly handler?: ActionHandler;

  private cartItems = new Set<string>();

  private onCartUpdatedBound?: (data: AppEvents["cart:updated"]) => void;
  private onCartItemAddedBound?: (data: AppEvents["cart:item:added"]) => void;
  private onCartItemRemovedBound?: (
    data: AppEvents["cart:item:removed"]
  ) => void;

  constructor(
    container: HTMLElement,
    emitter?: IEvents,
    handler?: ActionHandler
  ) {
    super(container);
    this.root = container;
    this.emitter = emitter;
    this.handler = handler;

    this.categoryEl = container.querySelector<HTMLElement>(".card__category");
    this.titleEl = container.querySelector<HTMLElement>(".card__title");
    this.imgEl = container.querySelector<HTMLImageElement>(".card__image");
    this.priceEl = container.querySelector<HTMLElement>(".card__price");
    this.actionBtnEl = container.querySelector<HTMLElement>(".card__button");

    if (this.emitter) {
      this.onCartUpdatedBound = (payload: AppEvents["cart:updated"]) => {
        const items: IProduct[] = Array.isArray(payload?.items)
          ? payload.items
          : [];
        this.cartItems.clear();
        items.forEach((p: IProduct) => {
          if (p && p.id != null) this.cartItems.add(String(p.id));
        });
        this.updateButtonByCurrentId();
      };

      this.onCartItemAddedBound = (payload: AppEvents["cart:item:added"]) => {
        const id =
          payload?.product?.id != null ? String(payload.product.id) : undefined;
        if (id) this.cartItems.add(id);
        this.updateButtonByCurrentId();
      };

      this.onCartItemRemovedBound = (
        payload: AppEvents["cart:item:removed"]
      ) => {
        const id =
          payload?.product?.id != null ? String(payload.product.id) : undefined;
        if (id) this.cartItems.delete(id);
        this.updateButtonByCurrentId();
      };

      this.emitter.on("cart:updated", this.onCartUpdatedBound);
      this.emitter.on("cart:item:added", this.onCartItemAddedBound);
      this.emitter.on("cart:item:removed", this.onCartItemRemovedBound);
    }

    if (this.actionBtnEl) {
      const btn = this.actionBtnEl;
      btn.addEventListener("click", (evt) => {
        if (btn instanceof HTMLButtonElement && btn.disabled) {
          evt.stopPropagation();
          return;
        }
        if (
          !(btn instanceof HTMLButtonElement) &&
          btn.getAttribute("aria-disabled") === "true"
        ) {
          evt.stopPropagation();
          return;
        }

        evt.stopPropagation();
        const id = this.root.dataset.productId;
        if (!id) return;

        const inCart = btn.dataset.inCart === "true";

        if (inCart) {
          if (this.handler) {
            this.handler("cart:remove", { id });
          } else if (this.emitter) {
            this.emitter.emit("cart:remove", { id });
          }

          this.applyInCart(false);
        } else {
          if (this.handler) {
            this.handler("cart:add", { productId: id });
          } else if (this.emitter) {
            this.emitter.emit("cart:add", { productId: id });
          }

          this.applyInCart(true);
        }
      });
    }

    this.root.addEventListener("click", (evt) => {
      if (this.actionBtnEl && this.actionBtnEl.contains(evt.target as Node)) {
        return;
      }
      const id = this.root.dataset.productId;
      if (!id) return;
      if (this.handler) {
        this.handler("product:select", { productId: id });
      } else if (this.emitter) {
        this.emitter.emit("product:select", { productId: id });
      }
    });
  }

  private formatPriceValue(value: unknown): string {
    const s = String(value);
    const parts = s.split(".");
    parts[0] = parts[0].replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
    return parts.join(".");
  }

  private getButtonLabelElement(): HTMLElement | null {
    if (!this.actionBtnEl) return null;
    const labelEl = this.actionBtnEl.querySelector<HTMLElement>(
      ".card__button__label"
    );
    return labelEl ?? null;
  }

  private setButtonState(disabled: boolean, text?: string) {
    if (!this.actionBtnEl) return;

    const labelEl = this.getButtonLabelElement();

    if (typeof text !== "undefined") {
      if (labelEl) {
        labelEl.textContent = text;
      } else {
        let textNode: Node | null = null;
        for (const child of Array.from(this.actionBtnEl.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) {
            textNode = child;
            break;
          }
        }
        if (textNode) {
          textNode.textContent = text;
        } else {
          this.actionBtnEl.textContent = text;
        }
      }
    }

    if (this.actionBtnEl instanceof HTMLButtonElement) {
      this.actionBtnEl.disabled = disabled;
      if (disabled) {
        this.actionBtnEl.classList.add("is-disabled");
        this.actionBtnEl.setAttribute("aria-disabled", "true");
      } else {
        this.actionBtnEl.classList.remove("is-disabled");
        this.actionBtnEl.removeAttribute("aria-disabled");
      }
    } else {
      if (disabled) {
        this.actionBtnEl.setAttribute("aria-disabled", "true");
        this.actionBtnEl.classList.add("is-disabled");
      } else {
        this.actionBtnEl.removeAttribute("aria-disabled");
        this.actionBtnEl.classList.remove("is-disabled");
      }
    }
  }

  private applyInCart(inCart: boolean) {
    if (!this.actionBtnEl) return;
    if (inCart) {
      this.actionBtnEl.dataset.inCart = "true";
    } else {
      delete this.actionBtnEl.dataset.inCart;
    }

    const isModal =
      this.root.closest(".modal") !== null ||
      this.root.classList.contains("modal") ||
      this.root.dataset.view === "modal";

    if (isModal && inCart) {
      this.setButtonState(false, "Удалить из корзины");
    } else {
      const defaultText = isModal ? "Купить" : "В корзину";
      this.setButtonState(false, defaultText);
    }
  }

  private updateButtonByCurrentId() {
    const id = this.root.dataset.productId;
    if (!id || !this.actionBtnEl) return;

    const inCart = this.cartItems.has(id);
    this.applyInCart(inCart);
  }

  render(product?: Partial<IProduct>): HTMLElement {
    if (product) {
      if (product.id != null) {
        this.root.dataset.productId = String(product.id);
      } else {
        delete this.root.dataset.productId;
      }

      if (this.titleEl) this.titleEl.textContent = product.title ?? "";

      if (this.categoryEl) {
        const categoryEl = this.categoryEl;
        Object.values(categoryMap).forEach((mod) =>
          categoryEl.classList.remove(mod)
        );
        if (product.category) {
          const mod = categoryMap[product.category as keyof typeof categoryMap];
          if (mod) categoryEl.classList.add(mod);
          categoryEl.textContent = product.category;
        } else {
          categoryEl.textContent = "";
        }
      }

      if (this.imgEl) {
        if (product.image) {
          const src =
            typeof product.image === "string" &&
            !/^https?:\/\//i.test(product.image)
              ? `${CDN_URL}${product.image}`
              : (product.image as string);
          this.setImage(this.imgEl, src, product.title ?? "");
        } else {
          this.imgEl.removeAttribute("src");
          this.imgEl.alt = "";
        }
      }

      if (this.priceEl) {
        const price = product.price;
        if (price === undefined) {
          this.priceEl.textContent = "Бесценно";
        } else if (
          price === null ||
          (!Number.isNaN(Number(price)) && Number(price) === 0)
        ) {
          this.priceEl.textContent = "Бесценно";
        } else {
          const formatted = this.formatPriceValue(price);
          this.priceEl.textContent = `${formatted} синапсов`;
        }
      }

      if (this.actionBtnEl) {
        const isModal =
          this.root.closest(".modal") !== null ||
          this.root.classList.contains("modal") ||
          this.root.dataset.view === "modal";

        const priceVal = product.price;
        const isFree =
          priceVal === null ||
          (priceVal !== undefined &&
            !Number.isNaN(Number(priceVal)) &&
            Number(priceVal) === 0);

        if (isModal && isFree) {
          this.setButtonState(true, "Недоступен");
          delete this.actionBtnEl.dataset.inCart;
        } else {
          const explicitInCart =
            (
              product as Partial<IProduct> as Partial<IProduct> & {
                inCart?: boolean;
              }
            ).inCart === true;
          if (explicitInCart) {
            this.applyInCart(true);
          } else {
            const id = product.id ?? this.root.dataset.productId;
            const inCart = !!id && this.cartItems.has(String(id));
            this.applyInCart(inCart);
          }
        }
      }
    }
    return this.root;
  }
}
