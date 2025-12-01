import { Component } from "../base/Component";
import { EventEmitter, AppEvents } from "../base/Events";
import { IBuyer, TPayment } from "../../types";

export class OrderFormView extends Component<IBuyer> {
  private readonly events: EventEmitter;
  private readonly form: HTMLFormElement | null;
  private readonly payButtons: NodeListOf<HTMLElement>;
  private readonly emailInput: HTMLInputElement | null;
  private readonly phoneInput: HTMLInputElement | null;
  private readonly addressInput: HTMLInputElement | HTMLTextAreaElement | null;
  private readonly submitButton: HTMLButtonElement | null;
  private readonly activeModifier = "button_alt-active";

  private selectedPayment: TPayment | "" = "";
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
    this.emailInput =
      container.querySelector<HTMLInputElement>('[name="email"]') ?? null;
    this.phoneInput =
      container.querySelector<HTMLInputElement>('[name="phone"]') ?? null;
    this.addressInput =
      container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        '[name="address"]'
      ) ?? null;
    this.submitButton =
      container.querySelector<HTMLButtonElement>('[type="submit"]') ?? null;

    this.initListeners();

    const onBuyerUpdated = (payload: AppEvents["buyer:updated"]) => {
      if (payload && typeof payload === "object" && "buyer" in payload) {
        this.render(payload.buyer);
      }
    };
    this.events.on("buyer:updated", onBuyerUpdated);
    this.listeners.push(() => this.events.off("buyer:updated", onBuyerUpdated));

    const onBuyerValidated = (payload: AppEvents["buyer:validated"]) => {
      if (!payload || typeof payload !== "object" || !("errors" in payload))
        return;
      const errors = payload.errors as
        | Partial<Record<keyof IBuyer, string>>
        | undefined;
      const errEl = this.container.querySelector<HTMLElement>(".form__errors");
      if (!errEl) return;
      const msgs = errors ? Object.values(errors).filter(Boolean) : [];
      errEl.textContent = msgs.length ? msgs.join(". ") : "";
    };
    this.events.on("buyer:validated", onBuyerValidated);
    this.listeners.push(() =>
      this.events.off("buyer:validated", onBuyerValidated)
    );

    this.updateSubmitState();
  }

  private initListeners(): void {
    if (this.payButtons.length > 0) {
      this.payButtons.forEach((btn) => {
        const handler = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();

          const paymentAttr = btn.getAttribute("data-payment");
          const payment =
            (paymentAttr as TPayment) ??
            (btn.getAttribute("name") as TPayment) ??
            "";
          this.selectedPayment = payment;
          this.setActivePayment(payment);

          if (payment && payment.trim() !== "") {
            this.events.emit("buyer:setPayment", { payment });
          }

          this.updateSubmitState();
        };
        btn.addEventListener("click", handler);
        this.listeners.push(() => btn.removeEventListener("click", handler));
      });
    }

    if (this.emailInput) {
      const handler = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        this.events.emit("buyer:setEmail", { email: value });
      };
      this.emailInput.addEventListener("input", handler);
      this.listeners.push(() =>
        this.emailInput?.removeEventListener("input", handler)
      );
    }

    if (this.phoneInput) {
      const handler = (ev: Event) => {
        const value = (ev.target as HTMLInputElement).value;
        this.events.emit("buyer:setPhone", { phone: value });
      };
      this.phoneInput.addEventListener("input", handler);
      this.listeners.push(() =>
        this.phoneInput?.removeEventListener("input", handler)
      );
    }

    if (this.addressInput) {
      const onInput = (ev: Event) => {
        const target = ev.target as HTMLInputElement | HTMLTextAreaElement;
        const value = target.value;
        this.events.emit("buyer:setAddress", { address: value });

        const errEl =
          this.container.querySelector<HTMLElement>(".form__errors");
        if (errEl && errEl.textContent) {
          const msgs = errEl.textContent
            .split(". ")
            .map((s) => s.trim())
            .filter(Boolean);
          const filtered = msgs.filter((m) => !/адрес/i.test(m));
          errEl.textContent = filtered.join(". ");
        }
        this.updateSubmitState();
      };
      this.addressInput.addEventListener("input", onInput);
      this.listeners.push(() =>
        this.addressInput?.removeEventListener("input", onInput)
      );

      const onClick = (e: Event) => {
        e.stopPropagation();
        const value = (
          this.addressInput as HTMLInputElement | HTMLTextAreaElement
        ).value.trim();
        this.events.emit("buyer:setAddress", { address: value });
        this.events.emit("buyer:validate");
        this.updateSubmitState();
      };
      this.addressInput.addEventListener("click", onClick);
      this.listeners.push(() =>
        this.addressInput?.removeEventListener("click", onClick)
      );
    }

    const onSubmit = (ev?: Event) => {
      if (ev) {
        ev.preventDefault();
        ev.stopPropagation();
      }
      const addressVal = this.addressInput
        ? (this.addressInput.value ?? "").trim()
        : "";
      this.events.emit("buyer:setAddress", { address: addressVal });
      this.events.emit("buyer:validate");
      this.events.emit("order:send");
      if (this.submitHandler) {
        try {
          this.submitHandler(ev);
        } catch {}
      }
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

  private setActivePayment(payment: TPayment | ""): void {
    if (this.payButtons.length === 0) return;
    this.payButtons.forEach((btn) => {
      const btnPayment =
        btn.getAttribute("data-payment") ??
        (btn.getAttribute("name") as string | null);
      if (btnPayment === payment) {
        btn.classList.add(this.activeModifier);
      } else {
        btn.classList.remove(this.activeModifier);
      }
    });
  }

  private updateSubmitState(): void {
    const addressVal = this.addressInput
      ? (this.addressInput.value ?? "").trim()
      : "";
    const hasAddress = addressVal.length > 0;
    const hasPayment = this.selectedPayment !== "";
    if (this.submitButton) {
      this.submitButton.disabled = !(hasAddress && hasPayment);
    }
  }

  render(data?: Partial<IBuyer>): HTMLElement {
    if (!data) {
      this.updateSubmitState();
      return this.container;
    }

    if (data.payment !== undefined) {
      this.selectedPayment = (data.payment as TPayment) ?? "";
      this.setActivePayment(this.selectedPayment);
    }

    if (data.email !== undefined && this.emailInput) {
      this.emailInput.value = data.email ?? "";
    }

    if (data.phone !== undefined && this.phoneInput) {
      this.phoneInput.value = data.phone ?? "";
    }

    if (data.address !== undefined && this.addressInput) {
      this.addressInput.value = data.address ?? "";
    }

    this.updateSubmitState();
    return this.container;
  }

  destroy(): void {
    this.listeners.forEach((off) => off());
    this.listeners.length = 0;
  }
}
