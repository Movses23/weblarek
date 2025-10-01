import { EventEmitter } from "../base/Events";
import { IBuyer, IProduct } from "../../types";

export class ProductsModel extends EventEmitter {
  private products: IProduct[];
  private selectedProduct: IProduct | null;

  constructor(initialProducts: IProduct[] = []) {
    super();
    this.products = initialProducts.slice();
    this.selectedProduct = null;
  }

  setProducts(products: IProduct[]): void {
    this.products = products.slice();
    this.emit("products:updated", { products: this.getProducts() });
  }

  getProducts(): IProduct[] {
    return this.products.slice();
  }

  getProductById(id: string): IProduct | undefined {
    return this.products.find((p) => p.id === id);
  }

  setSelectedProduct(productId: string | null): void {
    if (productId === null) {
      this.selectedProduct = null;
      this.emit("product:selected", { product: null });
      return;
    }
    const found = this.getProductById(productId) ?? null;
    this.selectedProduct = found;
    this.emit("product:selected", { product: found });
  }

  getSelectedProduct(): IProduct | null {
    return this.selectedProduct ? { ...this.selectedProduct } : null;
  }
}

export interface IOrderRequest {
  buyer: IBuyer;
  items: string[];
}
