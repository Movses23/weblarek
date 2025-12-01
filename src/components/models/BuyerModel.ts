import { EventEmitter } from "../base/Events";
import { IBuyer, TPayment } from "../../types/index";

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
    let changed = false;
    if (data.payment !== undefined && data.payment !== this.payment) {
      this.payment = data.payment!;
      changed = true;
    }
    if (data.email !== undefined && data.email !== this.email) {
      this.email = data.email!;
      changed = true;
    }
    if (data.phone !== undefined && data.phone !== this.phone) {
      this.phone = data.phone!;
      changed = true;
    }
    if (data.address !== undefined && data.address !== this.address) {
      this.address = data.address!;
      changed = true;
    }
    if (changed) {
      this.emit("buyer:updated", { buyer: this.getBuyer() });
    }
  }

  setPayment(payment: TPayment): void {
    if (this.payment !== payment) {
      this.payment = payment;
      this.emit("buyer:updated", { buyer: this.getBuyer() });
    }
  }

  setEmail(email: string): void {
    if (this.email !== email) {
      this.email = email;
      this.emit("buyer:updated", { buyer: this.getBuyer() });
    }
  }

  setPhone(phone: string): void {
    if (this.phone !== phone) {
      this.phone = phone;
      this.emit("buyer:updated", { buyer: this.getBuyer() });
    }
  }

  setAddress(address: string): void {
    if (this.address !== address) {
      this.address = address;
      this.emit("buyer:updated", { buyer: this.getBuyer() });
    }
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

  validate(
    scope: "order" | "contacts" | "all" = "all"
  ): Partial<Record<keyof IBuyer, string>> {
    const errors: Partial<Record<keyof IBuyer, string>> = {};

    if (scope === "order" || scope === "all") {
      if (
        !this.payment ||
        (this.payment !== "card" && this.payment !== "cash")
      ) {
        errors.payment = "Выберите способ оплаты";
      }
      if (!this.address || this.address.trim().length === 0) {
        errors.address = "Необходимо указать адрес";
      }
    }

    if (scope === "contacts" || scope === "all") {
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
    }
    this.emit("buyer:validated", { errors, buyer: this.getBuyer() });
    return errors;
  }
}
