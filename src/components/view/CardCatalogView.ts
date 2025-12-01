import { Component } from "../base/Component";
import { IEvents } from "../base/Events";
import { CDN_URL } from "../../utils/constants";
import { IProduct } from "../../types";

export class CardCatalogView extends Component<IProduct> {
  private readonly root: HTMLElement;

  private readonly title: HTMLElement | null;
  private readonly img: HTMLImageElement | null;

  private readonly price: HTMLElement | null;

  private readonly events: IEvents;

  constructor(container: HTMLElement, events: IEvents) {
    super(container);
    this.root = container;
    this.events = events;

    this.title = this.root.querySelector(".card__title");
    this.img = this.root.querySelector(
      ".card__image"
    ) as HTMLImageElement | null;

    this.price = this.root.querySelector(".card__price");

    this.root.addEventListener("click", this.onRootClick.bind(this));
  }

  private formatNumberWithSpaces(value: string | number): string {
    const str = String(value);
    return str.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  render(data?: Partial<IProduct>): HTMLElement {
    if (!data) {
      return this.root;
    }

    if (data.id) {
      this.root.dataset.productId = String(data.id);
    } else {
      delete this.root.dataset.productId;
    }

    if (this.img) {
      const imgSrc =
        typeof data.image === "string"
          ? data.image.startsWith("/")
            ? `${CDN_URL}${data.image}`
            : data.image
          : "";

      this.setImage(this.img, imgSrc, data.title);
    }

    if (this.title) {
      this.title.textContent = data.title ?? "";
    }

    if (this.price) {
      if (data.price === null || data.price === undefined || data.price === 0) {
        this.price.textContent = "Бесценно";
      } else {
        const formatted = this.formatNumberWithSpaces(
          data.price as string | number
        );
        this.price.textContent = `${formatted} синапсов`;
      }
    }

    return this.root;
  }

  private onRootClick(evt: MouseEvent) {
    const target = evt.target as Element;

    const btn = target.closest(".card__button");
    if (btn) {
      const id = this.root.dataset.productId;
      if (id) {
        this.events.emit("cart:add", { productId: id });
      }
      return;
    }

    const card = target.closest(".card");
    if (card) {
      const id = this.root.dataset.productId;
      if (id) {
        this.events.emit("product:select", { productId: id });
      }
    }
  }
}
