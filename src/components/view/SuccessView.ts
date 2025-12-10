import { Component } from "../base/Component";

export interface ISuccessData {
  total?: number;
  totalFormatted?: string;
}

export class SuccessView extends Component<ISuccessData> {
  private readonly containerScope: HTMLElement;

  constructor(container: HTMLElement) {
    super(container);
    this.containerScope = container;
  }

  private formatNumberWithSpaces(value: string | number): string {
    const raw = String(value).replace(/\D/g, "");
    return raw.replace(/(?<=\d{2})(?=(\d{3})+(?!\d))/g, " ");
  }

  render(data?: ISuccessData): HTMLElement {
    let formatted = "";

    if (data?.totalFormatted?.trim()) {
      const digits = data.totalFormatted.replace(/\D/g, "");
      formatted = digits
        ? this.formatNumberWithSpaces(digits)
        : data.totalFormatted.trim();
    } else if (typeof data?.total === "number") {
      formatted = this.formatNumberWithSpaces(data.total);
    } else {
      formatted = "0";
    }

    const descEl = this.containerScope.querySelector<HTMLElement>(
      ".order-success__description"
    );
    if (descEl) descEl.textContent = `Списано ${formatted} синапсов`;

    return super.render(data);
  }
}
