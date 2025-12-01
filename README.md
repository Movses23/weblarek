# Проектная работа "Веб-ларек"

Стек: HTML, SCSS, TS, Vite

Структура проекта:

- src/ — исходные файлы проекта
- src/components/ — папка с JS компонентами
- src/components/base/ — папка с базовым кодом

Важные файлы:

- index.html — HTML-файл главной страницы
- src/types/index.ts — файл с типами
- src/main.ts — точка входа приложения
- src/scss/styles.scss — корневой файл стилей
- src/utils/constants.ts — файл с константами
- src/utils/utils.ts — файл с утилитами

## Установка и запуск

Для установки и запуска проекта необходимо выполнить команды

```
npm install
npm run start
```

или

```
yarn
yarn start
```

## Сборка

```
npm run build
```

или

```
yarn build
```

# Интернет-магазин «Web-Larёk»

«Web-Larёk» — это интернет-магазин с товарами для веб-разработчиков, где пользователи могут просматривать товары, добавлять их в корзину и оформлять заказы. Сайт предоставляет удобный интерфейс с модальными окнами для просмотра деталей товаров, управления корзиной и выбора способа оплаты, обеспечивая полный цикл покупки с отправкой заказов на сервер.

## Архитектура приложения

Код приложения разделен на слои согласно парадигме MVP (Model-View-Presenter), которая обеспечивает четкое разделение ответственности между классами слоев Model и View. Каждый слой несет свой смысл и ответственность:

Model - слой данных, отвечает за хранение и изменение данных.  
View - слой представления, отвечает за отображение данных на странице.  
Presenter - презентер содержит основную логику приложения и отвечает за связь представления и данных.

Взаимодействие между классами обеспечивается использованием событийно-ориентированного подхода. Модели и Представления генерируют события при изменении данных или взаимодействии пользователя с приложением, а Презентер обрабатывает эти события используя методы как Моделей, так и Представлений.

### Базовый код

#### Класс Component

Является базовым классом для всех компонентов интерфейса.
Класс является дженериком и принимает в переменной `T` тип данных, которые могут быть переданы в метод `render` для отображения.

Конструктор:  
`constructor(container: HTMLElement)` - принимает ссылку на DOM элемент за отображение, которого он отвечает.

Поля класса:  
`container: HTMLElement` - поле для хранения корневого DOM элемента компонента.

Методы класса:  
`render(data?: Partial<T>): HTMLElement` - Главный метод класса. Он принимает данные, которые необходимо отобразить в интерфейсе, записывает эти данные в поля класса и возвращает ссылку на DOM-элемент. Предполагается, что в классах, которые будут наследоваться от `Component` будут реализованы сеттеры для полей с данными, которые будут вызываться в момент вызова `render` и записывать данные в необходимые DOM элементы.  
`setImage(element: HTMLImageElement, src: string, alt?: string): void` - утилитарный метод для модификации DOM-элементов `<img>`

#### Класс Api

Содержит в себе базовую логику отправки запросов.

Конструктор:  
`constructor(baseUrl: string, options: RequestInit = {})` - В конструктор передается базовый адрес сервера и опциональный объект с заголовками запросов.

Поля класса:  
`baseUrl: string` - базовый адрес сервера  
`options: RequestInit` - объект с заголовками, которые будут использованы для запросов.

Методы:  
`get(uri: string): Promise<object>` - выполняет GET запрос на переданный в параметрах ендпоинт и возвращает промис с объектом, которым ответил сервер  
`post(uri: string, data: object, method: ApiPostMethods = 'POST'): Promise<object>` - принимает объект с данными, которые будут переданы в JSON в теле запроса, и отправляет эти данные на ендпоинт переданный как параметр при вызове метода. По умолчанию выполняется `POST` запрос, но метод запроса может быть переопределен заданием третьего параметра при вызове.  
`handleResponse(response: Response): Promise<object>` - защищенный метод проверяющий ответ сервера на корректность и возвращающий объект с данными полученный от сервера или отклоненный промис, в случае некорректных данных.

#### Класс EventEmitter

Брокер событий реализует паттерн "Наблюдатель", позволяющий отправлять события и подписываться на события, происходящие в системе. Класс используется для связи слоя данных и представления.

Конструктор класса не принимает параметров.

Поля класса:  
`_events: Map<string | RegExp, Set<Function>>)` - хранит коллекцию подписок на события. Ключи коллекции - названия событий или регулярное выражение, значения - коллекция функций обработчиков, которые будут вызваны при срабатывании события.

Методы класса:  
`on<T extends object>(event: EventName, callback: (data: T) => void): void` - подписка на событие, принимает название события и функцию обработчик.  
`emit<T extends object>(event: string, data?: T): void` - инициализация события. При вызове события в метод передается название события и объект с данными, который будет использован как аргумент для вызова обработчика.  
`trigger<T extends object>(event: string, context?: Partial<T>): (data: T) => void` - возвращает функцию, при вызове которой инициализируется требуемое в параметрах событие с передачей в него данных из второго параметра.

### Данные

Интерфейсы, которые используются в приложении.

IProduct — описание товара. Используется для передачи данных о товаре между слоями (получение с сервера, отображение в списках, добавление в корзину, и т.д.)
interface IProduct {
id: string; - id товара
image: string; - изображение товара
title: string; - заголовок товара
category: string; - категория товара
price: number | null; - цена товара
description: string; - краткое описание товара
}

IBuyer — описание данных покупателя. Используется при заполнении формы оформления заказа и отправке данных на сервер.

interface IBuyer {
payment: TPayment;
email: string; - эл.почта
phone: string; - номер телефона
address: string; - адрес
}

TPayment — тип для способа оплаты

type TPayment = 'card' | 'cash' | '';

Пустая строка ('') обозначает, что способ оплаты не выбран.

### Модели данных

#### Класс ProductsModel

Назначение и зона ответственности:
Хранение полного массива товаров.
Хранение товара, выбранного для отображения в модальном окне (selectedProduct).
Поиск товара по id.
Эмит событий при изменениях.

Конструктор:
constructor(initialProducts: IProduct[] = [])
initialProducts: IProduct[] — начальный массив.

Поля:
products: IProduct[] — массив всех товаров.
Описание: содержит текущий каталог; используется для рендера списка.
selectedProduct: IProduct | null — выбранный для показа товар или null — если ничего не выбрано.

Методы:
setProducts(products: IProduct[]): void
Сохраняет массив товаров в поле products и эмитит 'products:updated' с payload { products }.
getProducts(): IProduct[]
Возвращает текущий массив products.
getProductById(id: string): IProduct | undefined
Ищет и возвращает товар по id или undefined, если не найден.
setSelectedProduct(productId: string | null): void
Устанавливает selectedProduct по id (или null), эмитит 'product:selected' c payload { product: IProduct | null }.
getSelectedProduct(): IProduct | null
Возвращает selectedProduct.

#### Класс CartModel

Назначение и зона ответственности:
Хранение товаров, которые пользователь добавил в корзину.
Операции: добавление, удаление, очистка, получение суммы и количества.
Эмит событий при изменениях ('cart:updated').

Конструктор:
constructor(initialItems: IProduct[] = [])
initialItems: IProduct[] — начальный набор товаров в корзине.

Поля:
items: IProduct[] — массив товаров в корзине.
Описание: каждый элемент массива — одна единица товара.

Методы:
getItems(): IProduct[]
Возвращает массив items.
addItem(product: IProduct): void
Добавляет product в items; эмитит 'cart:updated'.
removeItem(productId: string): void
Удаляет одну единицу товара с переданным id. После удаления эмитит 'cart:updated'.
clear(): void
Очищает корзину (items = []); эмитит 'cart:updated'.
getTotalPrice(): number
Возвращает суммарную стоимость товаров: суммирует поле price каждого товара, считая price === null как 0 .
getCount(): number
Возвращает количество элементов в корзине (items.length).
hasItem(productId: string): boolean
Возвращает true, если товар с таким id присутствует в items.

#### Класс BuyerModel

Назначение и зона ответственности:
Хранение данных покупателя (payment, email, phone, address).
Очистка данных покупателя.
Валидация полей (с выдачей сообщений об ошибках для каждого поля).
Эмит событий при изменениях ('buyer:updated').

Конструктор:
constructor(initialData?: Partial<IBuyer>)
initialData: Partial<IBuyer> — объект с начальными значениями.

Поля:
payment: TPayment — 'card' | 'cash' | ''.
email: string
phone: string
address: string

Методы:
setBuyerData(data: Partial<IBuyer>): void
Обновляет только те поля, которые присутствуют в объекте data, не затирая остальные; после обновления эмитит 'buyer:updated'.
setPayment(payment: TPayment): void
Устанавливает payment и эмитит 'buyer: updated'.
setEmail(email: string): void
Устанавливает email и эмитит 'buyer: updated'.
setPhone(phone: string): void
Устанавливает phone и эмитит 'buyer: updated'.
setAddress(address: string): void
Устанавливает address и эмитит 'buyer: updated'.
getBuyer(): IBuyer
Возвращает объект со всеми полями, согласованными по дефолтам (например, пустые строки вместо undefined).
clear(): void
Очищает все поля (payment = '', email = '', phone = '', address = ''); эмитит 'buyer:updated'.
validate(): Partial<Record<keyof IBuyer, string>>
Возвращает объект ошибок валидации: ключи — поля с ошибками, значения — текст ошибки. Если ошибок нет — возвращается пустой объект {}.

### Слой коммуникаций

Назначение:

Слой коммуникации отвечает за взаимодействие с внешним сервером (API): получение каталога товаров и отправку заказов.
Он инкапсулирует HTTP-логику (вызовы fetch, обработку ошибок, нормализацию данных) и предоставляет остальному приложению удобные типизированные методы.
Реализован как класс, использующий композицию: получает в конструктор экземпляр Api и вызывает его методы get/post.

### Класс communication

Назначение:
Инкапсулировать всю сетевую логику приложения: получение каталога товаров и отправку заказов.
Предоставлять простой типизированный интерфейс для выполнения запросов (fetchProducts, sendOrder), не раскрывая деталей URL, заголовков и сериализации остальным частям приложения.

Конструктор:
constructor(api: IApi) — принимает объект, реализующий IApi.

Методы:
fetchProducts(): Promise<IProduct[]>
делает GET на /product/
возвращает массив IProduct
учитывает вариант, когда сервер может вернуть либо объекты товаров, либо только массив id (вариант B) — в таком случае класс должен либо сопоставить id с локальным кэшем, либо инициировать дополнительные запросы.
sendOrder(order: IOrderRequest): Promise<Record<string, unknown>>
делает POST на /order/ и передаёт тело заказа (buyer + items: string[]).
возвращает ответ сервера (тип можно заменить на конкретный интерфейс ответа).

### Слой представления View

Схема классов:

HeaderView — шапка (логотип, кнопка корзины и счётчик)
GalleryView — контейнер галереи, рендерит список карточек
CardBaseView — родитель для карточек
CardCatalogView — карточка в каталоге (template #card-catalog)
CardPreviewView — карточка предпросмотра / full (template #card-preview)
CardBasketView — компактная карточка в корзине (template #card-basket)
ModalView — модальное окно (не наследуется)
BasketView — содержимое модального окна корзины (template #basket) — компонент, который может рендериться в ModalView
FormBaseView — общий родитель форм
OrderFormView — форма выбора способа оплаты и адреса (template #order)
ContactsFormView — форма ввода email/phone (template #contacts)
SuccessView — шаблон успешного оформления (template #success)

#### Класс HeaderView

Назначение: отображение шапки сайта, логотипа и кнопки корзины со счётчиком.
Конструктор:

constructor(container: HTMLElement, events: EventEmitter)

Поля:
container: HTMLElement (наследуется от Component)
btnBasket: HTMLButtonElement
counterEl: HTMLElement
events: EventEmitter

Методы:
render(): HTMLElement — привязывает btnBasket и counterEl.
setCount(count: number): void — обновляет счётчик в шапке.

#### Класс GalleryView

Назначение: контейнер галереи товаров; отвечает за рендер списка карточек (вставляет экземпляры CardCatalogView) и делегирует события карточек дальше.

Конструктор: constructor(container: HTMLElement, events: EventEmitter)

Поля:
container: HTMLElement (элемент .gallery)
events: EventEmitter
list: HTMLElement

Методы:
render(products: IProduct[]): HTMLElement — очищает контейнер, создаёт и рендерит карточки для каждого товара (использует CardCatalogView).
appendCard(card: CardCatalogView): void

#### Класс CardBaseView (родитель трёх карточек)

Назначение: общий функционал для всех трех видов карточек: работа с шаблоном (cloneNode), базовый парсинг селекторов, установка изображения, заголовка, цены, категории, и общая логика привязки событий (клик по карточке, кнопки).

Конструктор: constructor(container: HTMLElement, templateId: string, events: EventEmitter)

Поля:
container: HTMLElement
templateId: string
root: HTMLElement — корневый элемент клонированного шаблона
product: IProduct | null
events: EventEmitter

Методы:
render(data: Partial<IProduct> & { product?: IProduct }): HTMLElement — клонирует шаблон, заполняет поля (в дочерних классах частично переопределяется или вызывает protected методы).
protected setImage(imgEl: HTMLImageElement, src: string, alt?: string): void (использует Component.setImage)
protected bindCommonHandlers(): void — назначает общие обработчики.
getRoot(): HTMLElement

#### Класс CardCatalogView (extends CardBaseView)

Шаблон: #card-catalog

Кликабельная кнопка (весь элемент <button class="gallery__item card">) — эмитит 'card:open' с полным продуктом.

render(product: IProduct): HTMLElement — заполняет category, title, image, price.

#### Класс CardPreviewView (extends CardBaseView)

Шаблон: #card-preview

Назначение: полная карточка товара (в модальном окне или в отдельной области).

Поведение:
Кнопка 'В корзину' => эмитит 'card:add'.
render(product: IProduct): HTMLElement — отображает описание, цену и т.п.

#### Класс CardBasketView (extends CardBaseView)

Шаблон: #card-basket

Назначение: компактный элемент списка корзины (li).

Поведение:
Кнопка удаления => эмитит 'card:remove' с payload { productId }.
render(product: IProduct, index?: number): HTMLElement

#### Класс ModalView

Конструктор:
constructor(container: HTMLElement, events: EventEmitter)
container — root модального контейнера

Поля:
container: HTMLElement (контейнер .modal)
contentContainer: HTMLElement (элемент .modal__content)
closeBtn: HTMLButtonElement
events: EventEmitter

Методы:
open(): void — открывает модал (добавляет класс открыт/стили), эмитит 'modal:open' (payload: { } или { source }).
close(): void — закрывает модал, очищает содержимое, эмитит 'modal:close'.
setContent(node: HTMLElement | Component): void — вставляет переданный элемент в .modal__content.
clearContent(): void
onBackdropClick/keyboard handlers — при закрытии эмитит событие 'modal:close-request' или просто 'modal:close'.

#### Класс BasketView

Шаблон: #basket

Назначение: компонент, который рендерит список товаров корзины, общую цену и кнопку «Оформить». Может быть отрендерен как внутри ModalView, так и в другом месте.

Конструктор: constructor(container: HTMLElement, events: EventEmitter)

Поля:
listEl: HTMLUListElement
priceEl: HTMLElement
orderButton: HTMLButtonElement
Методы:
render(items: IProduct[]): HTMLElement — рендерит список, использует CardBasketView для каждого item.
setTotalPrice(total: number)
setCount(count: number)

#### Класс FormBaseView

Назначение: вынести общую логику форм: получение элементов формы, управление состоянием кнопки submit, отображение ошибок, делегирование событий input

Конструктор: constructor(container: HTMLElement, templateId: string, events: EventEmitter)

Поля:
formEl: HTMLFormElement
submitBtn: HTMLButtonElement
errorsEl: HTMLElement
events: EventEmitter

Методы:
render(data?: Partial<IBuyer>): HTMLElement — клонирует шаблон формы и устанавливает базовые слушатели.
protected bindInputs(): void — привязка событий input/change и отправки формы.
protected setSubmitEnabled(enabled: boolean): void
protected setErrors(errors: Partial<Record<keyof IBuyer, string>> | string): void — отображение сообщений об ошибках в errorsEl.

#### Класс OrderFormView (extends FormBaseView)

Шаблон: #order
Поля:
payment buttons (name="card"/"cash"), address input

Поведение:
Кнопки оплаты переключают локальный state payment и эмитят 'form:change'.
Адрес input — эмитит 'form:change' на input.
Кнопка submit (Далее) эмитит 'form:submit' с payload IBuyer когда форма валидна.
Эвенты:
'order:payment:change' => { payment: TPayment }
Использует базовые события FormBaseView.

#### Класс ContactsFormView (extends FormBaseView)

Шаблон: #contacts

Поля:
email input, phone input

Поведение:
На input — эмитит 'form:change'
На submit — 'form:submit' с payload IBuyer (email/phone)
Эвенты:
'contacts:submit', 'contacts:change'.

#### Класс SuccessView

Шаблон: #success
Назначение: отображение успешного оформления заказа — простая вёрстка с кнопкой «За новыми покупками!».
Конструктор: constructor(container: HTMLElement, events: EventEmitter)

Методы:
render(totalText?: string): HTMLElement

### События классов в слое представления View

#### Класс HeaderView
События:

1) modal:open

Цель: попросить приложение открыть указанный модальный (в данном коде — открыть модальное окно корзины).

2) cart:updated

Когда приходит: компонент подписывается в конструкторе на this.events.on("cart:updated", …).
Что делает компонент: пересчитывает количество элементов и суммарную цену и обновляет .header__cart-count и .header__cart-price.

#### Класс GalleryView

События:

1) gallery:open-product (GalleryView.EVENTS.OPEN_PRODUCT)

Когда генерируется: делегированный обработчик кликов по списку карточек. Срабатывает, если пользователь кликнул по карточке (article.card), но не по кнопке добавления в корзину (.card__button).
Описание: сигнализирует, что нужно показать превью/детали продукта или перейти на страницу товара. productId берётся из data-id карточки (card.dataset.id).


2) gallery:add-to-cart (GalleryView.EVENTS.ADD_TO_CART)

События (общие, эмитятся через this.events):

1) cart:add
Описание: событие «добавить в корзину» — генерируется при клике на кнопку действия внутри карточки.
Когда выпускается: при клике на элемент this.actionBtnEl (обработчик click). В обработчике вызывается evt.stopPropagation(), чтобы клик по кнопке не всплывал.

2) product:selected

События:

1) "card:add"

Описание: пользователь нажал кнопку «Добавить в корзину» на карточке товара.
Когда эмитируется: при клике на элемент с классом .card__button внутри карточки.
Данные (payload):

2) "product:select"

Описание: пользователь кликнул по карточке — запрос на выбор/просмотр деталей товара.
Когда эмитируется: при клике на элемент карточки (closest(".card")).

#### Класс CardPreviewView (extends CardBaseView)

События:

1) preview:add

Когда эмитируется:
При клике пользователя по кнопке "Добавить в корзину" в окне превью товара.
Если в контейнере установлен data-product-id (через render), в payload передаётся этот id.
Если id не установлен — событие всё равно эмитируется, но productId будет пустой строкой.

2) preview:close

Когда эмитируется:
При клике пользователя по кнопке закрытия превью.
Если в контейнере установлен data-product-id — в payload будет productId, иначе поле может отсутствовать или быть undefined.

#### Класс CardBasketView (extends CardBaseView)

События:

1) "cart:remove"

Генерируется компонентом: CardBasketView
Когда генерируется: при клике на кнопку удаления товара в карточке (.card__remove).
Назначение: запрос на удаление товара из корзины (модель, подписанные на это событие, должны выполнить удаление/обновление состояния).

2) "product:open"

Генерируется компонентом: CardBasketView
Когда генерируется: при клике на изображение или заголовок карточки (img или .card__title).
Назначение: запрос на открытие/показ страницы/модалки с подробной информацией о товаре.

#### Класс ModalView

События:

1) modal:open
Описание: сигнализирует, что модальное окно открылось.
Когда генерируется: сразу после того, как выполнено открытие (например, после добавления класса modal_active).

2) modal:close
Описание: сигнализирует, что модальное окно закрылось.
Когда генерируется: сразу после удаления класса modal_active.

#### Класс BasketView

События:

1) Название: "basket:toggle"

Описание: пользователь кликнул по кнопке открытия/переключения видимости корзины (элемент с классом .basket__toggle).
Данные (payload): отсутствуют.
Когда генерируется: обработчик click на this.toggleBtn -> emitter.emit("basket:toggle").

2) Название: "basket:close"

Описание: пользователь кликнул по кнопке закрытия корзины (элемент .basket__close), если такая кнопка есть в разметке.
Данные: отсутствуют.
Когда генерируется: обработчик click на this.closeBtn -> emitter.emit("basket:close").

3) Название: "cart:clear"

Описание: пользователь кликнул кнопку очистки корзины (элемент .basket__clear).
Данные: отсутствуют.
Когда генерируется: обработчик click на this.clearBtn -> emitter.emit("cart:clear").

4) Название: "cart:remove"

Описание: пользователь запросил удаление конкретной позиции в списке корзины — клик по кнопке удаления внутри .basket__list. Кнопки удаления в разметке имеют data-action="remove" и data-id="<productId>".
Данные: объект с id товара:
{ id: string }
Когда генерируется: делегированный обработчик click на this.listEl ищет ближайший элемент с [data-action='remove'], берёт removeBtn.dataset.id и вызывает emitter.emit("cart:remove", { id }).

#### Класс FormBaseView
1) form: submit

Когда: при сабмите формы (обработчик submit вызывает evt.preventDefault()).
Описание: buyer содержит текущее состояние полей формы: payment, email, phone, address.

2) form: payment:changed

Когда генерируется: при клике на кнопку выбора способа оплаты (кнопки с data-payment). После клика у соответствующей кнопки добавляется класс "button_alt-active".
Описание: payment — значение способа оплаты, взятое из data-payment (или атрибута data-payment через getAttribute).

3) form:field:changed

Когда генерируется: при вводе/изменении любого поля формы (input/textarea), для каждого события input.
Описание:
field — имя поля (из name или data-name атрибута).
value — текущее значение поля.

4) form:reset

Когда генерируется: при сбросе формы (вызов FormBaseView.reset() или событие reset на форме). В reset форма сбрасывается, удаляется активный способ оплаты и генерируется событие.


#### Класс OrderFormView (extends FormBaseView)

События:

1) "buyer:setPayment"

Когда генерируется: при клике на кнопку выбора способа оплаты (элемент с data-payment="...").
Назначение: обновить модель покупателя (BuyerModel) — установить выбранный способ оплаты.


2) "buyer:setEmail"

Когда генерируется: при вводе (input) в поле email.
Назначение: сохранить/валидировать email в модели покупателя.

3) "buyer:setPhone"

Когда генерируется: при вводе (input) в поле телефона.
Назначение: сохранить/валидировать телефон в модели покупателя.

4) "buyer:setAddress"

Когда генерируется: при вводе (input) в поле адреса (может быть textarea или input).
Назначение: сохранить адрес в модели покупателя.

5) "order:send"

Когда генерируется: при попытке отправить заказ — submit формы (форма с preventDefault) или клик по кнопке отправки, если форма отсутствует.
Назначение: собрать данные из моделей (BuyerModel, корзины) и выполнить отправку заказа (запрос на сервер).


#### Класс ContactsFormView (extends FormBaseView)

События:

1) contacts:change

Когда генерируется:
при любом изменении полей формы:
клик по кнопке выбора оплаты (data-payment) — при этом визуально помечается выбранная кнопка;
ввод (input) в поле email;
ввод (input) в поле phone;
ввод (input) в textarea address.
Реализуется вызовом приватного метода emitChange(), который собирает текущие значения полей и вызывает this.emitter.emit("contacts:change", { buyer }).

2) contacts:submit

Когда генерируется:
при попытке отправки формы (submit):
обработчик формы this.form слушает событие submit и вызывает onFormSubmit, который вызывает preventDefault() и затем эмитит событие;
если есть отдельная кнопка отправки вне <form> (submitButton) и её тип не "submit", то клик по этой кнопке тоже вызывает onFormSubmit и генерирует событие.

#### Класс SuccessView

События:

1) success:open  

Когда генерируется: вызывается в методе open() после того, как модальному элементу добавлен класс активного состояния (modal_active).

Назначение: уведомить приложение (контроллер) о том, что окно успешного оформления стало видимым. Можно использовать для логирования, фокусировки, трекинга или синхронизации состояния.

2) success:close  

Когда генерируется: вызывается в методе close() после того, как модальному элементу удалён класс активного состояния (modal_active). Методу close() предшествуют обработчики клика по кнопкам закрытия (handleClose) и клика по оверлею (handleOverlayClick).

Назначение: уведомить приложение о том, что окно закрыто (пользователь нажал кнопку/крестик/кликнул вне содержимого или контроллер закрыл окно). Контроллер может на это реагировать (сбросить форму, обновить состояние корзины, перейти на другую страницу).


### Презентер

Код презентера написан в основном скрипте приложения в файле main.ts

##### Ссылка на макет:
https://www.figma.com/design/92C0vV1ZCsVpgN9cH2DZ2d/Yandex--%D0%92%D0%B5%D0%B1-%D0%BB%D0%B0%D1%80%D1%91%D0%BA-?node-id=201-9445&p=f&t=rIpwKgU1xJf6sAmx-0

##### Ссылка на репозиторий:
https://github.com/Movses23/weblarek