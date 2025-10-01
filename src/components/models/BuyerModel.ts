import { EventEmitter } from "../base/Events";
import { IBuyer, TPayment } from "../../types";

export class BuyerModel extends EventEmitter {
  private payment: TPayment;
  private email: string;
  private phone: string;
  private address: string;

  constructor(initialData?: Partial<IBuyer>) {
    super();
    this.payment = initialData?.payment ?? "";
    this.email = initialData?.email ?? "";
    this.phone = initialData?.phone ?? "";
    this.address = initialData?.address ?? "";
  }

  setBuyerData(data: Partial<IBuyer>): void {
    if (data.payment !== undefined) this.payment = data.payment;
    if (data.email !== undefined) this.email = data.email;
    if (data.phone !== undefined) this.phone = data.phone;
    if (data.address !== undefined) this.address = data.address;
    this.emit("buyer:updated", { buyer: this.getBuyer() });
  }

  setPayment(payment: TPayment): void {
    this.payment = payment;
    this.emit("buyer:updated", { buyer: this.getBuyer() });
  }

  setEmail(email: string): void {
    this.email = email;
    this.emit("buyer:updated", { buyer: this.getBuyer() });
  }

  setPhone(phone: string): void {
    this.phone = phone;
    this.emit("buyer:updated", { buyer: this.getBuyer() });
  }

  setAddress(address: string): void {
    this.address = address;
    this.emit("buyer:updated", { buyer: this.getBuyer() });
  }

  getBuyer(): IBuyer {
    return {
      payment: this.payment ?? "",
      email: this.email ?? "",
      phone: this.phone ?? "",
      address: this.address ?? "",
    };
  }

  clear(): void {
    this.payment = "";
    this.email = "";
    this.phone = "";
    this.address = "";
    this.emit("buyer:updated", { buyer: this.getBuyer() });
  }

  validate(): Partial<Record<keyof IBuyer, string>> {
    const errors: Partial<Record<keyof IBuyer, string>> = {};

    if (!this.payment || (this.payment !== "card" && this.payment !== "cash")) {
      errors.payment = "Выберите способ оплаты";
    }

    const emailPattern = /^\S+@\S+\.\S+$/;
    if (!this.email) {
      errors.email = "Введите email";
    } else if (!emailPattern.test(this.email)) {
      errors.email = "Некорректный email";
    }

    const digits = (this.phone || "").replace(/\D/g, "");
    if (!this.phone) {
      errors.phone = "Введите телефон";
    } else if (digits.length < 10) {
      errors.phone = "Некорректный номер телефона";
    }

    if (!this.address || this.address.trim().length === 0) {
      errors.address = "Введите адрес";
    }

    return errors;
  }
}
