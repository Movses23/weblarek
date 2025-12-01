import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";

export interface ISuccessData {
  total?: number;
  totalFormatted?: string;
}

export class SuccessView extends Component<ISuccessData> {
  private readonly emitter: EventEmitter;
  private readonly containerScope: HTMLElement;
  private readonly rootModal: HTMLElement | null;
  private readonly closeButtons: HTMLElement[];
  private readonly content: HTMLElement | null;

  private readonly onOverlayClickBound = this.onOverlayClick.bind(this);
  private readonly onCloseClickBound = this.onCloseClick.bind(this);
  private readonly onContentClickBound = this.onContentClick.bind(this);

  constructor(container: HTMLElement, emitter: EventEmitter) {
    super(container);
    this.emitter = emitter;
    this.containerScope = container;

    this.rootModal =
      (container.closest &&
        (container.closest(".modal") as HTMLElement | null)) ||
      document.getElementById("modal-container");

    this.content =
      this.containerScope.querySelector<HTMLElement>(".order-success") ?? null;

    const scope = this.containerScope;
    const closeSelectors = [
      ".order-success__close",
      ".order-success__button",
      ".modal__close",
      "[data-success-close]",
      ".order-success button",
    ];
    const nodes = closeSelectors.flatMap((s) =>
      Array.from(scope.querySelectorAll<HTMLElement>(s))
    );
    this.closeButtons = Array.from(new Set(nodes));

    this.closeButtons.forEach((btn) =>
      btn.addEventListener("click", this.onCloseClickBound)
    );
    if (this.rootModal) {
      this.rootModal.addEventListener("click", this.onOverlayClickBound);
    }
    this.content?.addEventListener("click", this.onContentClickBound);
  }

  private formatNumberWithSpaces(value: string | number): string {
    const raw = String(value).replace(/\D/g, "");

    return raw.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  render(data?: ISuccessData): HTMLElement {
    let formatted = "";

    if (
      data &&
      typeof data.totalFormatted === "string" &&
      data.totalFormatted.trim() !== ""
    ) {
      const digits = data.totalFormatted.replace(/\D/g, "");
      formatted = digits
        ? this.formatNumberWithSpaces(digits)
        : data.totalFormatted.trim();
    } else if (data && typeof data.total === "number") {
      formatted = this.formatNumberWithSpaces(data.total);
    } else {
      const priceEl =
        document.querySelector<HTMLElement>(".basket__price") ||
        (this.rootModal
          ? this.rootModal.querySelector<HTMLElement>(".basket__price")
          : null);
      if (priceEl && priceEl.textContent) {
        const digits = priceEl.textContent.replace(/\D/g, "");
        formatted = digits
          ? this.formatNumberWithSpaces(digits)
          : priceEl.textContent.trim();
      } else {
        formatted = "0";
      }
    }

    const descEl = (
      this.containerScope ?? this.rootModal
    )?.querySelector<HTMLElement>(".order-success__description");
    if (descEl) {
      if (/синапс/i.test(formatted)) {
        descEl.textContent = formatted;
      } else {
        descEl.textContent = `Списано ${formatted} синапсов`;
      }
    }

    return super.render(data);
  }

  open(): void {
    if (this.rootModal) {
      this.rootModal.classList.add("modal_active");
    }
    this.emitter.emit("success:open", undefined);
  }

  close(): void {
    if (this.rootModal) {
      this.rootModal.classList.remove("modal_active");
    }
    this.emitter.emit("success:close", undefined);

    this.emitter.emit("modal:close", undefined);
  }

  private onCloseClick(e: Event) {
    e.preventDefault();
    this.close();
  }

  private onOverlayClick(e: MouseEvent) {
    if (this.content && this.content.contains(e.target as Node)) return;
    this.close();
  }

  private onContentClick(e: Event) {
    e.stopPropagation();
  }

  destroy(): void {
    this.closeButtons.forEach((btn) =>
      btn.removeEventListener("click", this.onCloseClickBound)
    );
    if (this.rootModal) {
      this.rootModal.removeEventListener("click", this.onOverlayClickBound);
    }
    this.content?.removeEventListener("click", this.onContentClickBound);
  }
}
