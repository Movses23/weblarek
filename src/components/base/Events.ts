import { IBuyer, IProduct, TPayment } from "../../types";

export type EventName = string | RegExp | "*";

export interface AppEvents {
  "buyer:updated": { buyer: IBuyer };
  "buyer:validated": {
    errors: Partial<Record<keyof IBuyer, string>>;
    buyer: IBuyer;
  };
  "buyer:validate": void;
  "buyer:validate:contacts": void;

  "cart:updated": { items: IProduct[]; added?: IProduct; removed?: IProduct };
  "cart:item:added": { product: IProduct; items: IProduct[] };
  "cart:item:removed": { product: IProduct; items: IProduct[] };
  "cart:cleared": undefined;

  "cart:clear": undefined;
  "cart:remove": { id: string };
  "cart:add": { productId: string };

  "products:updated": { products: IProduct[] };
  "product:selected": { product: IProduct | null };
  "product:select": { productId: string };

  "basket:toggle": undefined;
  "basket:close": undefined;
  "basket:checkout": undefined;

  "modal:open": { id?: string; product?: IProduct } | undefined;
  "modal:close": undefined;

  "order:submit": {
    order: { buyer: IBuyer; items: IProduct[]; total: number };
  };

  "order:success": { id: string } | undefined;

  "form:submit": { buyer: IBuyer };
  "form:reset": undefined;
  "form:payment:changed": { payment: string };
  "form:field:changed": { field: string; value: string };

  "order:open": undefined;
  "order:send": undefined;
  "order:error": { error: unknown } | undefined;

  "buyer:setPayment": { payment: TPayment };
  "buyer:setEmail": { email: string };
  "buyer:setPhone": { phone: string };
  "buyer:setAddress": { address: string };

  "contacts:change": { buyer: IBuyer };
  "contacts:submit": { buyer: IBuyer };

  "header:cartClick": undefined;
  "cart:sync": { items: IProduct[] };
}

export type EmitterEvent = {
  eventName: string;
  payload?: AppEvents[keyof AppEvents] | undefined;
};

export type SubscriberForPayload<TPayload> = (data: TPayload) => void;

export type SubscriberUnion =
  | SubscriberForPayload<AppEvents[keyof AppEvents]>
  | SubscriberForPayload<EmitterEvent>;

export interface IEvents {
  on<K extends keyof AppEvents>(
    event: K,
    callback: SubscriberForPayload<AppEvents[K]>
  ): void;
  on(event: RegExp | "*", callback: SubscriberForPayload<EmitterEvent>): void;

  off<K extends keyof AppEvents>(
    event: K,
    callback: SubscriberForPayload<AppEvents[K]>
  ): void;
  off(event: RegExp | "*", callback: SubscriberForPayload<EmitterEvent>): void;

  emit<K extends keyof AppEvents>(
    event: K,
    data: AppEvents[K] extends undefined
      ? AppEvents[K] | undefined
      : AppEvents[K]
  ): void;
  emit(event: string, data?: AppEvents[keyof AppEvents]): void;

  trigger<K extends keyof AppEvents>(
    event: K,
    context?: Partial<AppEvents[K]>
  ): (data?: AppEvents[K]) => void;
}

export class EventEmitter implements IEvents {
  private _events: Map<EventName, Set<SubscriberUnion>>;

  constructor() {
    this._events = new Map<EventName, Set<SubscriberUnion>>();
  }

  on<K extends keyof AppEvents>(
    eventName: K,
    callback: SubscriberForPayload<AppEvents[K]>
  ): void;
  on(
    eventName: RegExp | "*",
    callback: SubscriberForPayload<EmitterEvent>
  ): void;
  on(eventName: EventName, callback: SubscriberUnion): void {
    if (!this._events.has(eventName)) {
      this._events.set(eventName, new Set<SubscriberUnion>());
    }
    this._events.get(eventName)!.add(callback);
  }

  off<K extends keyof AppEvents>(
    eventName: K,
    callback: SubscriberForPayload<AppEvents[K]>
  ): void;
  off(
    eventName: RegExp | "*",
    callback: SubscriberForPayload<EmitterEvent>
  ): void;
  off(eventName: EventName, callback: SubscriberUnion): void {
    if (this._events.has(eventName)) {
      this._events.get(eventName)!.delete(callback);
      if (this._events.get(eventName)!.size === 0) {
        this._events.delete(eventName);
      }
    }
  }

  emit<K extends keyof AppEvents>(
    eventName: K | string,
    data?: AppEvents[K] | AppEvents[keyof AppEvents]
  ): void {
    this._events.forEach((subscribers, name) => {
      if (name === "*") {
        subscribers.forEach((callback) =>
          (callback as SubscriberForPayload<EmitterEvent>)({
            eventName: String(eventName),
            payload: data as AppEvents[keyof AppEvents] | undefined,
          })
        );
      }

      if (
        (name instanceof RegExp &&
          typeof eventName === "string" &&
          name.test(eventName)) ||
        name === eventName
      ) {
        subscribers.forEach((callback) =>
          (callback as SubscriberForPayload<AppEvents[keyof AppEvents]>)(
            data as AppEvents[keyof AppEvents]
          )
        );
      }
    });
  }

  onAll(callback: SubscriberForPayload<EmitterEvent>): void {
    this.on("*", callback);
  }

  offAll(): void {
    this._events.clear();
  }

  trigger<K extends keyof AppEvents>(
    eventName: K,
    context?: Partial<AppEvents[K]>
  ) {
    return (event: AppEvents[K] | undefined = undefined) => {
      const payload = {
        ...((event as object) || {}),
        ...((context as object) || {}),
      } as AppEvents[K];
      this.emit(eventName as string, payload);
    };
  }
}
