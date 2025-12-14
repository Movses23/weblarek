import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { IBuyer, TPayment } from "../../types";

export class ContactsFormView extends Component<IBuyer> {
  private readonly events: EventEmitter;
  private readonly emailInput: HTMLInputElement | null;
  private readonly phoneInput: HTMLInputElement | null;
  private readonly submitButton: HTMLButtonElement | null;
  private readonly errorEl: HTMLElement | null;

  constructor(container: HTMLElement, events: EventEmitter) {
    super(container);
    this.events = events;

    this.emailInput = container.querySelector('[name="email"]');
    this.phoneInput = container.querySelector('[name="phone"]');
    this.submitButton = container.querySelector('button[type="submit"]');
    this.errorEl = container.querySelector(".form__errors");

    this.initListeners();
  }

  private phoneMaskHandler = () => {
    if (!this.phoneInput) return;

    const digits = this.phoneInput.value.replace(/\D/g, "");
    let res = "+7 ";

    if (digits.length > 1) res += "(" + digits.slice(1, 4);
    if (digits.length >= 4) res += ") " + digits.slice(4, 7);
    if (digits.length >= 7) res += "-" + digits.slice(7, 9);
    if (digits.length >= 9) res += "-" + digits.slice(9, 11);

    this.phoneInput.value = res;
    this.emitChange();
  };

  private initListeners(): void {
    this.emailInput?.addEventListener("input", () => this.emitChange());
    this.phoneInput?.addEventListener("input", this.phoneMaskHandler);

    this.submitButton?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.events.emit("contacts:submit", { buyer: this.buildBuyer() });
    });
  }

  private emitChange(): void {
    this.events.emit("contacts:change", { buyer: this.buildBuyer() });
  }

  private buildBuyer(): IBuyer {
    return {
      email: this.emailInput?.value.trim() ?? "",
      phone: this.phoneInput?.value.trim() ?? "",
      payment: "" as TPayment,
      address: "" as string,
    };
  }

  setErrors(errors?: Partial<Record<keyof IBuyer, string>> | null): void {
    if (this.errorEl) {
      this.errorEl.textContent =
        errors && Object.keys(errors).length
          ? [errors.email, errors.phone].filter(Boolean).join(". ")
          : "";
    }

    if (this.submitButton) {
      this.submitButton.disabled = !!(errors && Object.keys(errors).length);
    }
  }
}
