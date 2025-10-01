import "./scss/styles.scss";

import { apiProducts } from "./utils/data";
import { ProductsModel } from "../src/components/models/ProductsModel";
import { CartModel } from "../src/components/models/CartModel";
import { BuyerModel } from "../src/components/models/BuyerModel";

import { Api } from "./components/base/Api";
import { API_URL } from "./utils/constants";
import { Communication } from "./utils/communication";

import { IProduct, IBuyer, IOrderRequest } from "./types/index";

const productsModel = new ProductsModel();
const cartModel = new CartModel();
const buyerModel = new BuyerModel();

productsModel.on<{ products: IProduct[] }>("products:updated", (payload) =>
  console.log("products:updated ->", payload)
);
productsModel.on<{ product: IProduct | null }>("product:selected", (payload) =>
  console.log("product:selected ->", payload)
);
cartModel.on<{ items: IProduct[] }>("cart:updated", (payload) =>
  console.log("cart:updated ->", payload)
);
buyerModel.on<{ buyer: IBuyer }>("buyer:updated", (payload) =>
  console.log("buyer:updated ->", payload)
);

productsModel.setProducts(apiProducts.items);
console.log("Массив товаров:", productsModel.getProducts());

const sampleId = apiProducts.items[1]?.id ?? null;
console.log(
  "getProductById:",
  sampleId ? productsModel.getProductById(sampleId) : null
);

productsModel.setSelectedProduct(sampleId);
console.log("selectedProduct:", productsModel.getSelectedProduct());
productsModel.setSelectedProduct(null);

cartModel.addItem(apiProducts.items[0]);
cartModel.addItem(apiProducts.items[1]);
cartModel.addItem(apiProducts.items[0]);
console.log("items in cart:", cartModel.getItems());
console.log("total price:", cartModel.getTotalPrice());
console.log("count:", cartModel.getCount());
console.log("has sampleId:", sampleId ? cartModel.hasItem(sampleId) : false);
if (sampleId) cartModel.removeItem(sampleId);
console.log("after remove one:", cartModel.getItems());
cartModel.clear();
console.log("after clear:", cartModel.getItems());

buyerModel.setBuyerData({
  payment: "card",
  email: "dev@example.com",
  phone: "+7 (900) 000-00-00",
  address: "г. Москва, ул. Пример, 1",
});
console.log("buyer data:", buyerModel.getBuyer());
console.log("validate buyer:", buyerModel.validate());
buyerModel.setEmail("invalid-email");
console.log("validate buyer (email error):", buyerModel.validate());
buyerModel.clear();
console.log("buyer after clear:", buyerModel.getBuyer());
console.groupEnd();

const api = new Api(API_URL);
const comm = new Communication(api);

(async function loadCatalog() {
  try {
    const items = await comm.fetchProducts();
    productsModel.setProducts(items);
    console.log("Каталог загружен с сервера:", productsModel.getProducts());
  } catch (err) {
    console.log("каталог загружен:", productsModel.getProducts());
  }
})();

export async function sendOrderByIds(): Promise<void> {
  const buyer: IBuyer = buyerModel.getBuyer();
  const itemsIds: string[] = cartModel.getItems().map((p) => p.id);

  const order: IOrderRequest = { buyer, items: itemsIds };

  try {
    const res = await comm.sendOrder(order);
    console.log("Ответ сервера на отправку заказа:", res);
  } catch (err) {
    console.error("Ошибка при отправке заказа:", err);
  }
};
