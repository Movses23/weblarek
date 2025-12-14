import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";

export class BasketView extends Component<HTMLElement[]> {
  private listEl: HTMLElement;
  private totalEl: HTMLElement;
  private orderBtn: HTMLButtonElement;
  private events: EventEmitter;

  constructor(container: HTMLElement, events: EventEmitter) {
    super(container);
    this.events = events;

    this.listEl = container.querySelector(".basket__list") as HTMLElement;
    this.totalEl = container.querySelector(".basket__price") as HTMLElement;
    this.orderBtn = container.querySelector(
      ".basket__button"
    ) as HTMLButtonElement;

    this.orderBtn.addEventListener("click", () => {
      if (!this.orderBtn.disabled) {
        this.events.emit("order:open");
      }
    });
  }
  private formatNumberWithSpaces(value: string | number): string {
    const raw = String(value).replace(/\D/g, "");
    return raw.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  render(items: HTMLElement[], total: number = 0): HTMLElement {
    this.listEl.innerHTML = "";

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "basket__empty";
      empty.textContent = "Корзина пуста";
      this.listEl.appendChild(empty);

      this.orderBtn.disabled = true;
      this.totalEl.textContent = "0 синапсов";

      return this.container;
    }

    items.forEach((el) => this.listEl.appendChild(el));

    this.orderBtn.disabled = false;
    this.totalEl.textContent = `${this.formatNumberWithSpaces(total)} синапсов`;

    return this.container;
  }
}
