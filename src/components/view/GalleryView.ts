import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { IProduct } from "../../types";
import { categoryMap, CDN_URL } from "../../utils/constants";

export class GalleryView extends Component<IProduct[]> {
  static readonly EVENTS = {
    OPEN_PRODUCT: "product:select",
    ADD_TO_CART: "cart:add",
  };

  private events: EventEmitter;
  private listEl: HTMLElement;

  constructor(container: HTMLElement, events: EventEmitter) {
    super(container);
    this.events = events;

    const found = this.container.querySelector(".gallery__list");
    this.listEl = (found as HTMLElement) || this.container;

    this.listEl.addEventListener("click", this.handleClick.bind(this));
  }

  private handleClick(evt: MouseEvent) {
    const target = evt.target as HTMLElement;
    if (!target) return;

    const cardEl = target.closest(".card") as HTMLElement | null;
    if (!cardEl) return;

    const productId = cardEl.dataset.id;
    if (!productId) return;

    const addBtn = target.closest(".card__button");
    if (addBtn) {
      this.events.emit(GalleryView.EVENTS.ADD_TO_CART, { productId });
      return;
    }

    this.events.emit(GalleryView.EVENTS.OPEN_PRODUCT, { productId });
  }

  render(products?: IProduct[]): HTMLElement {
    if (!products || products.length === 0) {
      if (Array.isArray(products)) {
        this.listEl.innerHTML = "";
      }
      return this.container;
    }

    this.listEl.innerHTML = "";

    const formatNumberWithSpaces = (value: number): string =>
      value.toString().replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");

    products.forEach((p) => {
      const card = document.createElement("article");
      card.className = "card";
      card.dataset.id = p.id;

      const category = document.createElement("span");
      category.className = "card__category";
      const mapClass = p.category ? categoryMap[p.category] ?? "" : "";
      if (mapClass) category.classList.add(mapClass);
      category.textContent = p.category ?? "";
      const title = document.createElement("h3");
      title.className = "card__title";
      title.textContent = p.title ?? "";

      const img = document.createElement("img");
      img.className = "card__image";

      const src =
        p.image && p.image.startsWith("/")
          ? `${CDN_URL}${p.image}`
          : p.image ?? "";
      this.setImage(img, src, p.title ?? "");

      const footer = document.createElement("div");
      footer.className = "card__footer";

      const priceEl = document.createElement("div");
      priceEl.className = "card__price";

      if (p.price === null || p.price === undefined) {
        priceEl.textContent = "Бесценно";
      } else {
        const num = Number(p.price);
        if (Number.isFinite(num)) {
          priceEl.textContent = `${formatNumberWithSpaces(
            Math.trunc(num)
          )} синапсов`;
        } else {
          priceEl.textContent = `${String(p.price)} синапсов`;
        }
      }

      footer.appendChild(priceEl);
      card.appendChild(category);
      card.appendChild(title);
      card.appendChild(img);
      card.appendChild(footer);

      this.listEl.appendChild(card);
    });

    return this.container;
  }
}
