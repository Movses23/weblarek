import { Component } from "../base/Component";
import { IBuyer } from "../../types";

export class FormBaseView extends Component<IBuyer> {
  protected readonly root: HTMLFormElement;
  protected readonly paymentEl: HTMLSelectElement | HTMLInputElement | null;

  protected readonly submitBtn: HTMLButtonElement | null;

  private readonly paymentButtons: HTMLElement[] = [];

  constructor(container: HTMLElement) {
    super(container);
    this.root = container as HTMLFormElement;

    this.paymentEl =
      this.root.querySelector<HTMLSelectElement>("select[name=payment]") ??
      this.root.querySelector<HTMLInputElement>("input[name=payment]") ??
      null;

    this.submitBtn =
      this.root.querySelector<HTMLButtonElement>("button[type=submit]") ?? null;

    const btns = Array.from(
      this.root.querySelectorAll<HTMLElement>(
        '[data-payment], .order__buttons button, button[name="card"], button[name="cash"]'
      )
    );
    this.paymentButtons.push(...btns);

    this.bindPaymentButtons();
  }

  private bindPaymentButtons() {
    if (!this.paymentButtons.length) return;
  }
}
