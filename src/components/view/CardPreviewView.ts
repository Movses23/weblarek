import { Component } from "../base/Component";
import { ICardPreviewData } from "../../types";
import { EventEmitter } from "../base/Events";
import { CDN_URL, categoryMap } from "../../utils/constants";

export class CardPreviewView extends Component<ICardPreviewData> {
  private events: EventEmitter;
  private button: HTMLButtonElement | null;
  private productId: string | null = null;

  constructor(container: HTMLElement, events: EventEmitter) {
    super(container);
    this.events = events;
    this.button = container.querySelector(".card__button");

    this.button?.addEventListener("click", () => {
      if (!this.productId || !this.button) return;
      if (this.button.disabled) return;

      const inCart = this.button.dataset.inCart === "true";

      if (inCart) {
        this.events.emit("cart:remove", { id: this.productId });
      } else {
        this.events.emit("cart:add", { productId: this.productId });
      }

      this.events.emit("modal:close");
    });
  }
  private formatNumberWithSpaces(value: string | number): string {
    const raw = String(value).replace(/\D/g, "");
    return raw.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }
  render(data?: ICardPreviewData): HTMLElement {
    if (!data) return this.container;

    const { product, inCart } = data;
    this.productId = product.id;

    this.container.querySelector(".card__title")!.textContent = product.title;
    this.container.querySelector(".card__text")!.textContent =
      product.description;

    const img = this.container.querySelector(
      ".card__image"
    ) as HTMLImageElement;
    img.src = product.image.startsWith("http")
      ? product.image
      : `${CDN_URL}${product.image}`;
    img.alt = product.title;

    const category = this.container.querySelector(".card__category")!;
    category.textContent = product.category;
    Object.values(categoryMap).forEach((cls) => category.classList.remove(cls));
    category.classList.add(categoryMap[product.category]);

    const price = this.container.querySelector(".card__price")!;
    price.textContent = product.price
      ? `${this.formatNumberWithSpaces(product.price)} синапсов`
      : "Бесценно";

    if (!this.button) return this.container;

    if (!product.price) {
      this.button.textContent = "Недоступно";
      this.button.disabled = true;
      this.button.dataset.inCart = "false";
    } else {
      this.button.disabled = false;
      this.button.textContent = inCart ? "Удалить из корзины" : "Купить";
      this.button.dataset.inCart = String(inCart);
    }

    return this.container;
  }
}
