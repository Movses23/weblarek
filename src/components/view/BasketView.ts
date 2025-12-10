import { IProduct } from "../../types";
import { EventEmitter } from "../base/Events";

export class BasketView {
  private container: HTMLElement;
  private uiEvents: EventEmitter;
  private listEl: HTMLElement | null;
  private priceEl: HTMLElement | null;
  private orderBtn: HTMLButtonElement | null;

  constructor(container: HTMLElement, uiEvents: EventEmitter) {
    this.container = container;
    this.uiEvents = uiEvents;

    const root = this.container.querySelector(".basket") as HTMLElement | null;
    this.listEl = root?.querySelector(".basket__list") ?? null;
    this.priceEl = root?.querySelector(".basket__price") ?? null;
    this.orderBtn =
      root?.querySelector<HTMLButtonElement>(".basket__button") ?? null;
  }

  private formatNumberWithSpaces(value: string | number): string {
    const raw = String(value).replace(/\D/g, "");
    return raw.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  render(items: IProduct[]) {
    if (!this.listEl) return;
    this.listEl.innerHTML = "";

    if (!items.length) {
      const tmplEmpty = document.createElement("p");
      tmplEmpty.className = "basket__empty";
      tmplEmpty.textContent = "Корзина пуста";
      this.listEl.appendChild(tmplEmpty);

      if (this.orderBtn) {
        this.orderBtn.disabled = true;
        this.orderBtn.textContent = "Оформить";
      }
      if (this.priceEl) this.priceEl.textContent = "0 синапсов";
      return;
    }

    items.forEach((item, idx) => {
      const template = document.getElementById(
        "card-basket"
      ) as HTMLTemplateElement | null;
      if (!template?.content.firstElementChild) return;
      const node = template.content.firstElementChild.cloneNode(
        true
      ) as HTMLElement;

      const indexEl = node.querySelector<HTMLElement>(".basket__item-index");
      const titleEl = node.querySelector<HTMLElement>(".card__title");
      const deleteBtn = node.querySelector<HTMLButtonElement>(
        ".basket__item-delete"
      );

      if (indexEl) indexEl.textContent = String(idx + 1);
      if (titleEl) titleEl.textContent = item.title ?? "";

      if (deleteBtn) {
        deleteBtn.onclick = (e) => {
          e.preventDefault();
          this.uiEvents.emit("cart:remove", { id: item.id });
        };
      }

      if (this.listEl) {
        this.listEl.appendChild(node);
      }
    });

    const total = items.reduce((s, it) => s + (it.price ?? 0), 0);
    if (this.priceEl)
      this.priceEl.textContent = `${this.formatNumberWithSpaces(
        total
      )} синапсов`;

    if (this.orderBtn) {
      this.orderBtn.disabled = false;
      this.orderBtn.textContent = "Оформить";
      this.orderBtn.onclick = (e) => {
        e.preventDefault();
        if (!items.length) return;
        this.uiEvents.emit("order:open");
      };
    }
  }
}
