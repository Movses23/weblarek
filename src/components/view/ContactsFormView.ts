import { Component } from "../base/Component";
import { EventEmitter } from "../base/Events";
import { IBuyer, TPayment } from "../../types";
import { AppEvents } from "../base/Events";

export class ContactsFormView extends Component<IBuyer> {
  private readonly emitter: EventEmitter;

  private readonly form: HTMLFormElement | null;
  private readonly paymentButtons: HTMLButtonElement[];
  private readonly emailInput: HTMLInputElement | null;
  private readonly phoneInput: HTMLInputElement | null;
  private readonly addressInput: HTMLInputElement | HTMLTextAreaElement | null;
  private readonly submitButton: HTMLButtonElement | null;

  private readonly onPaymentClickBound: (ev: MouseEvent) => void;
  private readonly onFieldInputBound: (ev: Event) => void;
  private readonly onFormSubmitBound: (ev?: Event) => void;
  private readonly onBuyerValidatedBound: (
    payload?: AppEvents["buyer:validated"]
  ) => void;

  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(container: HTMLElement, emitter: EventEmitter) {
    super(container);
    this.emitter = emitter;

    this.form = this.container.querySelector<HTMLFormElement>("form") ?? null;
    this.paymentButtons = Array.from(
      this.container.querySelectorAll<HTMLButtonElement>(
        '[data-payment], .order__buttons button, button[name="card"], button[name="cash"]'
      )
    );
    this.emailInput =
      this.container.querySelector<HTMLInputElement>(
        'input[name="email"], textarea[name="email"]'
      ) ?? null;
    this.phoneInput =
      this.container.querySelector<HTMLInputElement>(
        'input[name="phone"], textarea[name="phone"]'
      ) ?? null;
    this.addressInput =
      this.container.querySelector<HTMLInputElement>(
        'input[name="address"], textarea[name="address"]'
      ) ?? null;
    this.submitButton =
      this.container.querySelector<HTMLButtonElement>(
        'button[type="submit"]'
      ) ?? null;

    this.onPaymentClickBound = this.onPaymentClick.bind(this);
    this.onFieldInputBound = this.onFieldInput.bind(this);
    this.onFormSubmitBound = this.onFormSubmit.bind(this);
    this.onBuyerValidatedBound = this.onBuyerValidated.bind(this);

    this.paymentButtons.forEach((btn) =>
      btn.addEventListener("click", this.onPaymentClickBound)
    );
    if (this.emailInput)
      this.emailInput.addEventListener("input", this.onFieldInputBound);
    if (this.phoneInput)
      this.phoneInput.addEventListener("input", this.onFieldInputBound);
    if (this.addressInput)
      this.addressInput.addEventListener("input", this.onFieldInputBound);
    if (this.form) this.form.addEventListener("submit", this.onFormSubmitBound);
    if (
      this.submitButton &&
      (!this.form || this.submitButton.type !== "submit")
    ) {
      this.submitButton.addEventListener("click", this.onFormSubmitBound);
    }

    this.emitter.on("buyer:validated", this.onBuyerValidatedBound);

    this.updateSubmitState();
  }

  private normalize(s?: string): string {
    return (s ?? "")
      .replace(/[\u200B\u200C\u200D\uFEFF]/g, "")
      .replace(/\u00A0/g, " ")
      .trim();
  }

  private onPaymentClick(ev: MouseEvent) {
    const btn = ev.currentTarget as HTMLButtonElement | null;
    if (!btn) return;
    this.paymentButtons.forEach((b) =>
      b.classList.toggle("button_alt-active", b === btn)
    );
    this.emitChange();
  }

  private onFieldInput(_ev: Event) {
    const email = this.emailInput
      ? this.normalize(this.emailInput.value)
      : undefined;
    const phone = this.phoneInput
      ? this.normalize(this.phoneInput.value)
      : undefined;

    if (email !== undefined) {
      this.emitter.emit("buyer:setEmail", { email });
    }
    if (phone !== undefined) {
      this.emitter.emit("buyer:setPhone", { phone });
    }

    this.emitChange();

    this.updateSubmitState();

    this.debouncedValidateContacts();
  }

  private debouncedValidateContacts() {
    if (typeof window !== "undefined") {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = window.setTimeout(() => {
        this.emitter.emit("buyer:validate:contacts");
      }, 250);
    } else {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.emitter.emit("buyer:validate:contacts");
      }, 250);
    }
  }

  private onFormSubmit(ev?: Event) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (ev && ev.stopPropagation) ev.stopPropagation();

    const buyerPartial = this.collectFormData();

    const payload = {
      buyer: buyerPartial,
    } as unknown as AppEvents["contacts:submit"];

    this.emitter.emit("contacts:submit", payload);
  }

  private collectFormData(): Partial<IBuyer> {
    const result: Partial<IBuyer> = {};

    const paymentBtn = this.paymentButtons.find((b) =>
      b.classList.contains("button_alt-active")
    );
    if (paymentBtn) {
      const p = (paymentBtn.getAttribute("data-payment") ||
        paymentBtn.getAttribute("name") ||
        "") as TPayment;
      if (p) result.payment = p;
    }

    if (this.emailInput) result.email = this.normalize(this.emailInput.value);
    if (this.phoneInput) result.phone = this.normalize(this.phoneInput.value);

    if (this.addressInput)
      result.address = this.normalize(this.addressInput.value);

    return result;
  }

  private emitChange() {
    const buyerPartial = this.collectFormData();

    const payload = {
      buyer: buyerPartial,
    } as unknown as AppEvents["contacts:change"];
    this.emitter.emit("contacts:change", payload);
  }

  private onBuyerValidated(payload?: AppEvents["buyer:validated"]) {
    if (!payload || typeof payload !== "object" || !("errors" in payload))
      return;
    const errors = payload.errors as
      | Partial<Record<keyof IBuyer, string>>
      | undefined;
    const errEl = this.container.querySelector<HTMLElement>(".form__errors");
    if (!errEl) return;

    const msgs: string[] = [];
    if (errors) {
      if (errors.email) msgs.push(errors.email);
      if (errors.phone) msgs.push(errors.phone);
    }
    errEl.textContent = msgs.length ? msgs.join(". ") : "";
  }

  private updateSubmitState() {
    const emailVal = this.normalize(this.emailInput?.value);
    const phoneVal = this.normalize(this.phoneInput?.value);
    const emailOk = this.emailInput
      ? /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailVal)
      : true;
    const phoneDigits = (phoneVal || "").replace(/\D/g, "");
    const phoneOk = this.phoneInput ? phoneDigits.length >= 10 : true;

    if (this.submitButton) {
      this.submitButton.disabled = !(emailOk && phoneOk);
    }
  }

  render(data?: Partial<IBuyer>): HTMLElement {
    if (data) {
      if (data.payment !== undefined && this.paymentButtons.length) {
        this.paymentButtons.forEach((b) =>
          b.classList.toggle(
            "button_alt-active",
            b.getAttribute("data-payment") === data.payment ||
              b.getAttribute("name") === data.payment
          )
        );
      }
      if (data.email !== undefined && this.emailInput)
        this.emailInput.value = data.email ?? "";
      if (data.phone !== undefined && this.phoneInput)
        this.phoneInput.value = data.phone ?? "";
      if (data.address !== undefined && this.addressInput)
        this.addressInput.value = data.address ?? "";
    }

    this.updateSubmitState();
    return this.container;
  }

  destroy() {
    this.paymentButtons.forEach((btn) =>
      btn.removeEventListener("click", this.onPaymentClickBound)
    );
    if (this.emailInput)
      this.emailInput.removeEventListener("input", this.onFieldInputBound);
    if (this.phoneInput)
      this.phoneInput.removeEventListener("input", this.onFieldInputBound);
    if (this.addressInput)
      this.addressInput.removeEventListener("input", this.onFieldInputBound);
    if (this.form)
      this.form.removeEventListener("submit", this.onFormSubmitBound);
    if (
      this.submitButton &&
      (!this.form || this.submitButton.type !== "submit")
    ) {
      this.submitButton.removeEventListener("click", this.onFormSubmitBound);
    }

    if (typeof window !== "undefined") {
      window.clearTimeout(this.debounceTimer);
    } else {
      clearTimeout(this.debounceTimer);
    }

    this.emitter.off("buyer:validated", this.onBuyerValidatedBound);
  }
}
