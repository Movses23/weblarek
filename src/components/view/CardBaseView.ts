import { Component } from "../base/Component";

import { IProduct } from "../../types";

export class CardBaseView extends Component<IProduct> {
  protected readonly root: HTMLElement;

  constructor(container: HTMLElement) {
    super(container);
    this.root = container;
  }
}
