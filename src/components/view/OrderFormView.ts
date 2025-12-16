import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { IBuyer, TPayment } from "../../types";

export class OrderFormView extends Component<IBuyer> {
  private readonly events: EventEmitter;
  private readonly form: HTMLFormElement | null;
  private readonly payButtons: NodeListOf<HTMLElement>;
  private readonly addressInput: HTMLInputElement | HTMLTextAreaElement | null;
  private readonly submitButton: HTMLButtonElement | null;
  private readonly activeModifier = "button_alt-active";
  private readonly listeners: (() => void)[] = [];

  constructor(
    container: HTMLElement,
    events: EventEmitter,
    private readonly submitHandler?: (e?: Event) => void
  ) {
    super(container);
    this.events = events;

    this.form = container.querySelector<HTMLFormElement>("form") ?? null;
    this.payButtons = container.querySelectorAll<HTMLElement>(
      "[data-payment], .order__buttons button"
    );

    this.addressInput =
      container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        '[name="address"]'
      ) ?? null;

    this.submitButton =
      container.querySelector<HTMLButtonElement>('[type="submit"]') ?? null;

    this.initListeners();
  }

  private initListeners(): void {
    this.payButtons.forEach((btn) => {
      const handler = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        const payment = (btn.getAttribute("data-payment") ||
          btn.getAttribute("name") ||
          "") as TPayment;

        this.events.emit("form:payment:changed", { payment });
      };

      btn.addEventListener("click", handler);
      this.listeners.push(() => btn.removeEventListener("click", handler));
    });

    if (this.addressInput) {
      const handler = (ev: Event) => {
        const value = (ev.target as HTMLInputElement | HTMLTextAreaElement)
          .value;
        this.events.emit("form:field:changed", { field: "address", value });
      };

      this.addressInput.addEventListener("input", handler);
      this.listeners.push(() =>
        this.addressInput?.removeEventListener("input", handler)
      );
    }

    const onSubmit = (ev: Event) => {
      ev.preventDefault();
      ev.stopPropagation();

      this.events.emit("order:send");
      if (this.submitHandler) this.submitHandler(ev);
    };

    if (this.form) {
      this.form.addEventListener("submit", onSubmit);
      this.listeners.push(() =>
        this.form?.removeEventListener("submit", onSubmit)
      );
    }

    if (this.submitButton) {
      this.submitButton.addEventListener("click", onSubmit);
      this.listeners.push(() =>
        this.submitButton?.removeEventListener("click", onSubmit)
      );
    }
  }

  private setActivePayment(payment: TPayment | "") {
    this.payButtons.forEach((btn) => {
      const btnPayment =
        btn.getAttribute("data-payment") || btn.getAttribute("name") || "";
      btn.classList.toggle(this.activeModifier, btnPayment === payment);
    });
  }

  setErrors(errors?: Partial<Record<keyof IBuyer, string>> | null) {
    const generalErrorsEl =
      this.container.querySelector<HTMLElement>(".form__errors");

    if (generalErrorsEl) {
      if (!errors || Object.keys(errors).length === 0) {
        generalErrorsEl.textContent = "";
      } else {
        const msgs: string[] = [];
        if (errors.payment) msgs.push(errors.payment);
        if (errors.address) msgs.push(errors.address);
        generalErrorsEl.textContent = msgs.join(". ");
      }
    }

    if (this.submitButton) {
      this.submitButton.disabled = !!(errors && Object.keys(errors).length > 0);
    }
  }

  render(data?: Partial<IBuyer>): HTMLElement {
    if (data?.payment) {
      this.setActivePayment(data.payment);
    }

    if (this.addressInput && data?.address != null) {
      this.addressInput.value = data.address;
    }

    return this.container;
  }

  destroy(): void {
    this.listeners.forEach((off) => off());
    this.listeners.length = 0;
  }
}
