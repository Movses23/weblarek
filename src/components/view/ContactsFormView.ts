import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { IBuyer } from "../../types";

export class ContactsFormView extends Component<IBuyer> {
  private readonly events: EventEmitter;
  private readonly form: HTMLFormElement | null;
  private readonly emailInput: HTMLInputElement | null;
  private readonly phoneInput: HTMLInputElement | null;
  private readonly submitButton: HTMLButtonElement | null;
  private readonly listeners: (() => void)[] = [];
  private errorEl: HTMLElement | null = null;
  private currentBuyer: IBuyer;

  constructor(container: HTMLElement, events: EventEmitter, baseBuyer: IBuyer) {
    super(container);
    this.events = events;

    this.currentBuyer = { ...baseBuyer };

    this.form = container.querySelector<HTMLFormElement>("form") ?? null;
    this.emailInput =
      container.querySelector<HTMLInputElement>('[name="email"]') ?? null;
    this.phoneInput =
      container.querySelector<HTMLInputElement>('[name="phone"]') ?? null;
    this.submitButton =
      container.querySelector<HTMLButtonElement>('[type="submit"]') ?? null;
    this.errorEl = container.querySelector(".form__errors") ?? null;

    this.initListeners();
    this.updateSubmitState();
  }

  private formatPhone(digits: string): string {
    if (!digits) return "";

    let res = "+7 ";
    if (digits.length > 1) res += "(" + digits.substring(1, 4);
    if (digits.length >= 4) res += ") " + digits.substring(4, 7);
    if (digits.length >= 7) res += "-" + digits.substring(7, 9);
    if (digits.length >= 9) res += "-" + digits.substring(9, 11);

    return res.trim();
  }

  private phoneMaskHandler = (e: Event) => {
    if (!this.phoneInput) return;

    const value = this.phoneInput.value.replace(/\D/g, "");
    const isBackspace = (e as InputEvent).inputType === "deleteContentBackward";

    if (isBackspace && value.length <= 1) {
      this.phoneInput.value = value ? "+7 " : "";
      this.updateSubmitState();
      return;
    }

    this.phoneInput.value = this.formatPhone(value);
    this.updateSubmitState();
  };

  private initListeners(): void {
    const onInput = () => this.updateSubmitState();

    if (this.emailInput) {
      this.emailInput.addEventListener("input", onInput);
      this.listeners.push(() =>
        this.emailInput?.removeEventListener("input", onInput)
      );
    }

    if (this.phoneInput) {
      this.phoneInput.addEventListener("input", this.phoneMaskHandler);
      this.listeners.push(() =>
        this.phoneInput?.removeEventListener("input", this.phoneMaskHandler)
      );
    }

    const onSubmit = (ev?: Event) => {
      ev?.preventDefault();
      ev?.stopPropagation();
      this.events.emit("contacts:submit", { buyer: this.getFormData() });
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

  private updateSubmitState() {
    const emailVal = this.emailInput ? this.emailInput.value.trim() : "";
    const phoneVal = this.phoneInput
      ? this.phoneInput.value.replace(/\D/g, "")
      : "";

    let emailError = "";
    let phoneError = "";

    if (!emailVal) emailError = "Укажите email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal))
      emailError = "Укажите email";

    if (!phoneVal) phoneError = "Укажите телефон";
    else if (phoneVal.length > 11) phoneError = "Укажите телефон";

    if (this.errorEl) {
      const messages = [];
      if (emailError) messages.push(emailError);
      if (phoneError) messages.push(phoneError);
      this.errorEl.textContent = messages.join(". ");
    }

    if (this.submitButton) {
      this.submitButton.disabled = !!emailError || !!phoneError;
    }
  }

  render(buyer: IBuyer): HTMLElement {
    this.currentBuyer = { ...buyer };

    if (this.emailInput) this.emailInput.value = String(buyer.email ?? "");
    if (this.phoneInput) this.phoneInput.value = String(buyer.phone ?? "");

    this.updateSubmitState();
    return this.container;
  }

  private getFormData(): IBuyer {
    if (!this.emailInput || !this.phoneInput) {
      throw new Error("Form inputs not initialized");
    }

    return {
      ...this.currentBuyer,
      email: String(this.emailInput.value.trim()),
      phone: String(this.phoneInput.value.trim()),
    };
  }

  destroy(): void {
    this.listeners.forEach((off) => off());
    this.listeners.length = 0;
  }
}
