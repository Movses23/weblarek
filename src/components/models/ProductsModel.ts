import { EventEmitter } from "../base/Events";
import { IProduct, IProductsResponse } from "../../types";
import { Api } from "../base/Api";
import { API_URL } from "../../utils/constants";
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
    const found = this.products.find((p) => p.id === id);
    return found ? { ...found } : undefined;
  }

  setSelectedProduct(productId: string | null): void {
    if (productId === null) {
      this.selectedProduct = null;
      this.emit("product:selected", { product: null });
      return;
    }
    const found = this.getProductById(productId) ?? null;
    this.selectedProduct = found ? { ...found } : null;
    this.emit("product:selected", { product: this.selectedProduct });
  }

  getSelectedProduct(): IProduct | null {
    return this.selectedProduct ? { ...this.selectedProduct } : null;
  }
}

const api = new Api(API_URL);
let cache: IProduct[] | null = null;

export async function getAllProducts(): Promise<IProduct[]> {
  if (!cache) {
    const res = await api.get<IProductsResponse>("/products");
    cache = res.items;
  }
  return cache;
}

export async function getProductById(
  id: string
): Promise<IProduct | undefined> {
  const items = await getAllProducts();
  return items.find((p) => p.id === id);
}
