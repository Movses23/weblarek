import {
  IApi,
  IProduct,
  IProductsResponse,
  IOrderRequest,
} from "../types/index";
import { apiProducts } from "./data";

export class Communication {
  private api: IApi;

  constructor(api: IApi) {
    this.api = api;
  }

  async fetchProducts(): Promise<IProduct[]> {
    const resp = await this.api.get<IProductsResponse | { items: string[] }>(
      "/product/"
    );

    if (!Array.isArray(resp.items) || resp.items.length === 0) return [];

    const first = resp.items[0];
    if (typeof first === "string") {
      const ids = resp.items as string[];
      const items = ids
        .map((id) => apiProducts.items.find((p) => p.id === id))
        .filter((p): p is IProduct => Boolean(p));
      return items;
    }

    return resp.items as IProduct[];
  }

  async sendOrder(order: IOrderRequest): Promise<Record<string, unknown>> {
    return this.api.post<Record<string, unknown>>("/order/", order);
  }
}
