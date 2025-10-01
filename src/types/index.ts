export type ApiPostMethods = "POST" | "PUT" | "DELETE";

export interface IApi {
  get<T extends object>(uri: string): Promise<T>;
  post<T extends object>(
    uri: string,
    data: object,
    method?: ApiPostMethods
  ): Promise<T>;
};

export type TPayment = "card" | "cash" | "";

export interface IProduct {
  id: string;
  image: string;
  title: string;
  category: string;
  price: number | null;
  description: string;
};

export interface IBuyer {
  payment: TPayment;
  email: string;
  phone: string;
  address: string;
};

export interface IProductsResponse {
  total?: number;
  items: IProduct[];
};

export interface IOrderRequest {
  buyer: IBuyer;
  items: string[];
};
