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

    this.form = container.querySelector<HTMLFormElement>("form");
    this.payButtons = container.querySelectorAll<HTMLElement>(
      "[data-payment], .order__buttons button"
    );

    this.addressInput = container.querySelector<
      HTMLInputElement | HTMLTextAreaElement
    >('[name="address"]');
    this.submitButton =
      container.querySelector<HTMLButtonElement>('[type="submit"]');

    this.initListeners();
  }

  private initListeners(): void {
    this.payButtons.forEach((btn) => {
      const handler = (e: Event) => {
        e.preventDefault();
        const payment = (btn.getAttribute("data-payment") ||
          btn.getAttribute("name") ||
          "") as TPayment;
        this.setActivePayment(payment);
        if (payment) this.events.emit("buyer:setPayment", { payment });
        this.updateSubmitState();
      };
      btn.addEventListener("click", handler);
      this.listeners.push(() => btn.removeEventListener("click", handler));
    });

    if (this.addressInput) {
      const handler = (ev: Event) => {
        this.events.emit("buyer:setAddress", {
          address: (ev.target as HTMLInputElement | HTMLTextAreaElement).value,
        });
        this.updateSubmitState();
      };
      this.addressInput.addEventListener("input", handler);
      this.listeners.push(() =>
        this.addressInput?.removeEventListener("input", handler)
      );
    }

    const onSubmit = (ev?: Event) => {
      ev?.preventDefault();
      if (this.addressInput)
        this.events.emit("buyer:setAddress", {
          address: this.addressInput.value.trim(),
        });
      this.events.emit("buyer:validate");
      this.events.emit("order:send");
      if (this.submitHandler) this.submitHandler(ev);
      this.updateSubmitState();
    };

    if (this.form) {
      this.form.addEventListener("submit", onSubmit);
      this.listeners.push(() =>
        this.form?.removeEventListener("submit", onSubmit)
      );
    } else if (this.submitButton) {
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

  private updateSubmitState() {
    const addressVal = this.addressInput?.value.trim() ?? "";
    const hasPayment =
      this.container.querySelector<HTMLElement>(`.${this.activeModifier}`) !==
      null;

    const generalErrorsEl =
      this.container.querySelector<HTMLElement>(".form__errors");
    const errors: string[] = [];
    if (!hasPayment) errors.push("Выберите способ оплаты");
    if (!addressVal) errors.push("Необходимо указать адрес");

    if (generalErrorsEl) generalErrorsEl.textContent = errors.join(". ");
    if (this.submitButton)
      this.submitButton.disabled = !(hasPayment && addressVal);
  }

  render(data?: Partial<IBuyer>): HTMLElement {
    if (data?.payment) this.setActivePayment(data.payment);
    if (this.addressInput && data?.address)
      this.addressInput.value = data.address;
    this.updateSubmitState();
    return this.container;
  }

  destroy(): void {
    this.listeners.forEach((off) => off());
    this.listeners.length = 0;
  }
}
