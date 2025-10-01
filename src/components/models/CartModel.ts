import { EventEmitter } from "../base/Events";
import { IProduct } from "../../types";

export class CartModel extends EventEmitter {
  private items: IProduct[];

  constructor(initialItems: IProduct[] = []) {
    super();
    this.items = initialItems.slice();
  }

  getItems(): IProduct[] {
    return this.items.slice();
  }

  addItem(product: IProduct): void {
    this.items.push(product);
    this.emit("cart:updated", { items: this.getItems() });
  }

  removeItem(productId: string): void {
    const idx = this.items.findIndex((p) => p.id === productId);
    if (idx >= 0) {
      this.items.splice(idx, 1);
      this.emit("cart:updated", { items: this.getItems() });
    }
  }

  clear(): void {
    this.items = [];
    this.emit("cart:updated", { items: this.getItems() });
  }

  getTotalPrice(): number {
    return this.items.reduce((sum, p) => sum + (p.price ?? 0), 0);
  }

  getCount(): number {
    return this.items.length;
  }

  hasItem(productId: string): boolean {
    return this.items.some((p) => p.id === productId);
  }
}
