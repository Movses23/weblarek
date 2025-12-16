import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { IBuyer, TPayment } from "../../types";

export class OrderFormView extends Component<IBuyer> {
  private readonly form: HTMLFormElement | null;
  private readonly payButtons: NodeListOf<HTMLElement>;
  private readonly addressInput: HTMLInputElement | HTMLTextAreaElement | null;
  private readonly submitButton: HTMLButtonElement | null;
  private readonly activeModifier = "button_alt-active";

  constructor(container: HTMLElement, private readonly events: EventEmitter) {
    super(container);

    this.form = container.querySelector("form");
    this.payButtons = container.querySelectorAll(
      "[data-payment], .order__buttons button"
    );
    this.addressInput = container.querySelector('[name="address"]');
    this.submitButton = container.querySelector('[type="submit"]');

    this.initListeners();
  }

  private initListeners(): void {
    this.payButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const payment = (btn.getAttribute("data-payment") ||
          btn.getAttribute("name") ||
          "") as TPayment;

        this.events.emit("form:payment:changed", { payment });
      });
    });

    this.addressInput?.addEventListener("input", (e) => {
      const value = (e.target as HTMLInputElement).value;
      this.events.emit("form:field:changed", { field: "address", value });
    });

    this.form?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.events.emit("order:send");
    });
  }

  private setActivePayment(payment: TPayment | "") {
    this.payButtons.forEach((btn) => {
      const btnPayment =
        btn.getAttribute("data-payment") || btn.getAttribute("name") || "";
      btn.classList.toggle(this.activeModifier, btnPayment === payment);
    });
  }

  setErrors(errors?: Partial<Record<keyof IBuyer, string>> | null) {
    const el = this.container.querySelector<HTMLElement>(".form__errors");
    if (el) {
      el.textContent = errors
        ? [errors.payment, errors.address].filter(Boolean).join(". ")
        : "";
    }
    if (this.submitButton) {
      this.submitButton.disabled = !!(errors && Object.keys(errors).length);
    }
  }

  render(data?: Partial<IBuyer>): HTMLElement {
    if (data?.payment) this.setActivePayment(data.payment);
    if (this.addressInput && data?.address != null) {
      this.addressInput.value = data.address;
    }
    return this.container;
  }
}
