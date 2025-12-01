import { Component } from "../base/Component";
import { EventEmitter, AppEvents } from "../base/Events";

type RenderData = {
  logoSrc?: string;
  logoAlt?: string;
  count?: number;
};

export class HeaderView extends Component<RenderData> {
  private logoImg: HTMLImageElement | null = null;
  private cartButton: HTMLElement | null = null;
  private cartCount: HTMLElement | null = null;

  private readonly events: EventEmitter;
  private cartClickHandler?: () => void;

  constructor(
    container: HTMLElement,
    events: EventEmitter,
    cartClickHandler?: () => void
  ) {
    super(container);
    this.events = events;
    this.cartClickHandler = cartClickHandler;

    this.logoImg = this.container.querySelector(
      ".header__logo"
    ) as HTMLImageElement | null;
    this.cartButton = this.container.querySelector(
      ".header__cart"
    ) as HTMLElement | null;
    this.cartCount = this.container.querySelector(
      ".header__cart-count"
    ) as HTMLElement | null;

    if (this.cartButton) {
      this.cartButton.addEventListener("click", this.handleCartClick);
    }

    this.events.on("cart:updated", (payload) => this.onCartUpdated(payload));
  }

  render(data?: Partial<RenderData>): HTMLElement {
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
    if (typeof this.cartClickHandler === "function") {
      this.cartClickHandler();
      return;
    }
    this.events.emit("modal:open", { id: "cart" });
  };

  private onCartUpdated(payload: AppEvents["cart:updated"]) {
    const data = payload || { items: [] };
    const items = Array.isArray(data.items) ? data.items : [];
    const count = items.length;

    if (this.cartCount) {
      this.cartCount.textContent = String(count);
    }
  }
}
