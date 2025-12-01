import { Component } from "../base/Component";
import { IEvents } from "../base/Events";
import { IProduct } from "../../types";

export class BasketView extends Component<IProduct[]> {
  private emitter: IEvents;
  private toggleBtn: HTMLElement | null;
  private countEl: HTMLElement | null;
  private totalEl: HTMLElement | null;
  private listEl: HTMLElement | null;
  private emptyEl: HTMLElement | null;
  private clearBtn: HTMLElement | null;
  private closeBtn: HTMLElement | null;
  private orderBtn: HTMLElement | null;

  private itemTemplate: HTMLTemplateElement | null;

  constructor(container: HTMLElement, emitter: IEvents) {
    super(container);
    this.emitter = emitter;

    const rootEl =
      (this.container.querySelector(".basket") as HTMLElement) ||
      (this.container as HTMLElement);

    this.toggleBtn = rootEl.querySelector(".basket__toggle");
    this.countEl = rootEl.querySelector(".basket__count");
    this.totalEl = rootEl.querySelector(".basket__total");
    this.listEl = rootEl.querySelector(".basket__list");
    this.emptyEl = rootEl.querySelector(".basket__empty");
    this.clearBtn = rootEl.querySelector(".basket__clear");
    this.closeBtn = rootEl.querySelector(".basket__close");
    this.orderBtn = rootEl.querySelector(".basket__button");

    this.itemTemplate = document.getElementById(
      "card-basket"
    ) as HTMLTemplateElement | null;

    if (this.toggleBtn) {
      this.toggleBtn.addEventListener("click", () =>
        this.emitter.emit("basket:toggle")
      );
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", () =>
        this.emitter.emit("basket:close")
      );
    }

    if (this.clearBtn) {
      this.clearBtn.addEventListener("click", () =>
        this.emitter.emit("cart:clear")
      );
    }

    if (this.listEl) {
      this.listEl.addEventListener("click", (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const removeBtn = target.closest(
          "[data-action='remove']"
        ) as HTMLElement | null;
        if (removeBtn) {
          const id = removeBtn.dataset.id;
          if (id) {
            this.emitter.emit("cart:remove", { id });
          }
        }
      });
    }
  }

  render(items?: IProduct[]): HTMLElement {
    if (Array.isArray(items)) {
      this.update(items);
    }
    return this.container;
  }

  private update(items: IProduct[]) {
    const count = items.length;
    const total = items.reduce((s, p) => s + (p.price ?? 0), 0);

    if (this.countEl) this.countEl.textContent = String(count);
    if (this.totalEl) this.totalEl.textContent = this.formatPrice(total);

    if (!this.listEl) return;
    const listEl = this.listEl;
    listEl.innerHTML = "";

    const disableOrder = (disable: boolean) => {
      if (!this.orderBtn) return;
      const el = this.orderBtn as HTMLElement;

      (el as HTMLButtonElement).disabled = disable;

      el.setAttribute("aria-disabled", disable ? "true" : "false");
      if (disable) {
        el.classList.add("button_disabled");
      } else {
        el.classList.remove("button_disabled");
      }
    };

    if (items.length === 0) {
      const emptyNode: HTMLElement =
        (this.emptyEl as HTMLElement) ?? document.createElement("p");
      emptyNode.classList.add("basket__empty");
      emptyNode.textContent = "Корзина пуста";
      listEl.appendChild(emptyNode);

      disableOrder(true);
      return;
    }

    const prevEmpty = listEl.querySelectorAll(".basket__empty");
    prevEmpty.forEach((n) => n.remove());

    disableOrder(false);

    items.forEach((item, index) => {
      let node: HTMLElement | null = null;

      if (this.itemTemplate && this.itemTemplate.content) {
        const frag = this.itemTemplate.content.cloneNode(
          true
        ) as DocumentFragment;
        const li = frag.querySelector(".basket__item") as HTMLElement | null;
        if (li) {
          const idxEl = li.querySelector(".basket__item-index");
          if (idxEl) idxEl.textContent = String(index + 1);

          const titleEl = li.querySelector(".card__title, .basket__item-title");
          if (titleEl) titleEl.textContent = item.title ?? "";

          const priceEl = li.querySelector(".card__price, .basket__item-price");
          if (priceEl) priceEl.textContent = this.formatPrice(item.price);

          const removeBtn = li.querySelector(
            ".basket__item-delete, .card__button, button"
          ) as HTMLElement | null;
          if (removeBtn) {
            removeBtn.dataset.action = "remove";
            removeBtn.dataset.id = item.id;
            if ((removeBtn as HTMLButtonElement).tagName === "BUTTON") {
              try {
                (removeBtn as HTMLButtonElement).setAttribute("type", "button");
              } catch {}
            }
            if (!removeBtn.getAttribute("title")) {
              removeBtn.setAttribute("title", "Удалить товар");
            }
          }

          node = li;
        } else {
          const first = frag.firstElementChild as HTMLElement | null;
          if (first) node = first;
        }

        if (node) {
          listEl.appendChild(node);
          return;
        }
      }

      const li = document.createElement("li");
      li.className = "basket__item";

      const title = document.createElement("h3");
      title.className = "basket__item-title";
      title.textContent = item.title ?? "";

      const meta = document.createElement("p");
      meta.className = "basket__item-meta";

      const price = document.createElement("span");
      price.className = "basket__item-price";
      price.textContent = this.formatPrice(item.price);

      const removeBtn = document.createElement("button");
      removeBtn.className = "basket__item-remove button button_alt";
      removeBtn.setAttribute("type", "button");
      removeBtn.dataset.action = "remove";
      removeBtn.dataset.id = item.id;
      removeBtn.title = "Удалить товар";
      removeBtn.textContent = "Удалить";

      meta.appendChild(price);
      meta.appendChild(removeBtn);

      li.appendChild(title);
      li.appendChild(meta);

      listEl.appendChild(li);
    });
  }

  private formatNumberWithSpaces(value: string | number): string {
    const str = String(value);
    return str.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  private formatPrice(price?: number | null): string {
    const formatted = this.formatNumberWithSpaces(price as string | number);
    return `${formatted} синапсов`;
  }
}
