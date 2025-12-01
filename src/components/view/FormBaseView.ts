import { Component } from "../base/Component";
import { IEvents, AppEvents } from "../base/Events";
import { IBuyer, TPayment } from "../../types";

type FormActionHandler = <K extends keyof AppEvents>(
  eventName: K,
  data?: AppEvents[K]
) => void;

export class FormBaseView extends Component<IBuyer> {
  protected readonly root: HTMLFormElement;
  protected readonly paymentEl: HTMLSelectElement | HTMLInputElement | null;
  protected readonly emailEl: HTMLInputElement | null;
  protected readonly phoneEl: HTMLInputElement | null;
  protected readonly addressEl: HTMLInputElement | null;
  protected readonly submitBtn: HTMLButtonElement | null;

  private readonly emitter?: IEvents;
  private readonly handler?: FormActionHandler;

  private readonly paymentButtons: HTMLElement[] = [];
  private selectedPayment: TPayment = "";

  constructor(
    container: HTMLElement,
    emitter?: IEvents,
    handler?: FormActionHandler
  ) {
    super(container);
    this.root = container as HTMLFormElement;
    this.emitter = emitter;
    this.handler = handler;

    this.paymentEl =
      this.root.querySelector<HTMLSelectElement>("select[name=payment]") ??
      this.root.querySelector<HTMLInputElement>("input[name=payment]") ??
      null;
    this.emailEl =
      this.root.querySelector<HTMLInputElement>("input[name=email]") ?? null;
    this.phoneEl =
      this.root.querySelector<HTMLInputElement>("input[name=phone]") ?? null;
    this.addressEl =
      this.root.querySelector<HTMLInputElement>("input[name=address]") ?? null;
    this.submitBtn =
      this.root.querySelector<HTMLButtonElement>("button[type=submit]") ?? null;

    const btns = Array.from(
      this.root.querySelectorAll<HTMLElement>(
        '[data-payment], .order__buttons button, button[name="card"], button[name="cash"]'
      )
    );
    this.paymentButtons.push(...btns);

    if (this.paymentEl && (this.paymentEl as HTMLInputElement).value) {
      this.selectedPayment = (this.paymentEl as HTMLInputElement)
        .value as TPayment;
    }

    this.bindPaymentButtons();
    this.bindFieldInputs();
    this.bindFormSubmit();
  }

  private bindPaymentButtons() {
    if (!this.paymentButtons.length) return;

    this.paymentButtons.forEach((btn) => {
      btn.addEventListener("click", (evt) => {
        evt.preventDefault();
        evt.stopPropagation();

        this.paymentButtons.forEach((b) =>
          b.classList.toggle("button_alt-active", b === btn)
        );

        const paymentAttr = btn.getAttribute("data-payment");
        const nameAttr = (btn as HTMLButtonElement).name;
        const payment =
          (paymentAttr as TPayment) || (nameAttr as TPayment) || "";

        this.selectedPayment = payment;

        if (this.paymentEl) {
          try {
            (this.paymentEl as HTMLInputElement).value = payment;
          } catch {}
        }

        const payload = { payment } as AppEvents["form:payment:changed"];
        if (this.handler) {
          this.handler("form:payment:changed", payload);
        } else if (this.emitter) {
          this.emitter.emit("form:payment:changed", payload);
        }
      });
    });
  }

  private bindFieldInputs() {
    const emitFieldChanged = (field: string, value: string) => {
      const payload = { field, value } as AppEvents["form:field:changed"];
      if (this.handler) {
        this.handler("form:field:changed", payload);
      } else if (this.emitter) {
        this.emitter.emit("form:field:changed", payload);
      }
    };

    if (this.emailEl) {
      this.emailEl.addEventListener("input", (e) => {
        const v = (e.target as HTMLInputElement).value;
        emitFieldChanged("email", v);
      });
    }

    if (this.phoneEl) {
      this.phoneEl.addEventListener("input", (e) => {
        const v = (e.target as HTMLInputElement).value;
        emitFieldChanged("phone", v);
      });
    }

    if (this.addressEl) {
      this.addressEl.addEventListener("input", (e) => {
        const v = (e.target as HTMLInputElement).value;
        emitFieldChanged("address", v);
      });

      this.addressEl.addEventListener("click", () => {
        const v = (this.addressEl as HTMLInputElement).value.trim();

        emitFieldChanged("address", v);

        const buyer = this.collectFormData();
        const errors = this.validate(buyer);

        const payload = { errors, buyer } as AppEvents["buyer:validated"];
        if (this.handler) {
          this.handler("buyer:validated", payload);
        } else if (this.emitter) {
          this.emitter.emit("buyer:validated", payload);
        }
      });
    }
  }

  private bindFormSubmit() {
    this.root.addEventListener("submit", (evt) => {
      evt.preventDefault();

      const buyer = this.collectFormData();
      const errors = this.validate(buyer);

      if (Object.keys(errors).length > 0) {
        const payload = { errors, buyer } as AppEvents["buyer:validated"];
        if (this.handler) {
          this.handler("buyer:validated", payload);
        } else if (this.emitter) {
          this.emitter.emit("buyer:validated", payload);
        }
        return;
      }

      const updPayload = { buyer } as AppEvents["buyer:updated"];
      if (this.handler) {
        this.handler("buyer:updated", updPayload);
      } else if (this.emitter) {
        this.emitter.emit("buyer:updated", updPayload);
      }
    });

    if (this.submitBtn) {
      this.submitBtn.addEventListener("click", () => {
        if (!this.root) return;

        try {
          this.root.dispatchEvent(
            new Event("submit", { bubbles: true, cancelable: true })
          );
        } catch {}
      });
    }
  }

  protected collectFormData(): IBuyer {
    const payment = (this.selectedPayment ||
      (this.paymentEl
        ? (this.paymentEl as HTMLInputElement).value
        : "")) as TPayment;

    return {
      payment: payment || "",
      email: this.emailEl?.value.trim() || "",
      phone: this.phoneEl?.value.trim() || "",
      address: this.addressEl?.value.trim() || "",
    };
  }

  protected validate(buyer: IBuyer): Partial<Record<keyof IBuyer, string>> {
    const errors: Partial<Record<keyof IBuyer, string>> = {};

    if (!buyer.email) {
      errors.email = "Введите email";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyer.email)) {
      errors.email = "Неверный формат email";
    }

    if (!buyer.phone) {
      errors.phone = "Введите телефон";
    } else if (!/^[\d+\-\s()]{6,}$/.test(buyer.phone)) {
      errors.phone = "Неверный формат телефона";
    }

    if (!buyer.address) {
      errors.address = "Необходимо указать адрес";
    }

    return errors;
  }

  render(data?: Partial<IBuyer>): HTMLElement {
    if (data) {
      if (data.payment !== undefined) {
        const payment = data.payment ?? "";
        this.selectedPayment = payment;
        if (this.paymentEl) {
          try {
            (this.paymentEl as HTMLInputElement).value = payment;
          } catch {}
        }
        if (this.paymentButtons.length) {
          this.paymentButtons.forEach((b) => {
            const btnPayment =
              b.getAttribute("data-payment") ||
              (b as HTMLButtonElement).name ||
              "";
            b.classList.toggle("button_alt-active", btnPayment === payment);
          });
        }
      }
      if (data.email !== undefined && this.emailEl)
        this.emailEl.value = data.email ?? "";
      if (data.phone !== undefined && this.phoneEl)
        this.phoneEl.value = data.phone ?? "";
      if (data.address !== undefined && this.addressEl)
        this.addressEl.value = data.address ?? "";
    }
    return this.root;
  }
}
