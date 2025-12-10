import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";

type RenderData = {
  logoSrc?: string;
  logoAlt?: string;
  count?: number;
};

export class HeaderView extends Component<RenderData> {
  private logoImg: HTMLImageElement | null = null;
  private cartButton: HTMLElement | null = null;
  private cartCount: HTMLElement | null = null;
  private uiEvents: EventEmitter;

  constructor(container: HTMLElement, uiEvents: EventEmitter) {
    super(container);
    this.uiEvents = uiEvents;

    this.logoImg = this.container.querySelector(".header__logo-image");
    this.cartButton = this.container.querySelector(".header__basket");
    this.cartCount = this.container.querySelector(".header__basket-counter");

    if (this.cartButton) {
      this.cartButton.addEventListener("click", this.handleCartClick);
    }
  }

  render(data?: Partial<RenderData>) {
    super.render(data);

    if (data?.logoSrc && this.logoImg) {
      this.setImage(this.logoImg, data.logoSrc, data.logoAlt);
    }

    if (typeof data?.count !== "undefined" && this.cartCount) {
      this.cartCount.textContent = String(data.count);
    }

    return this.container;
  }

  private handleCartClick = (e: Event) => {
    e.preventDefault();
    this.uiEvents.emit("header:cartClick");
  };
}
