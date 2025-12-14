import { Component } from "../base/Component";

export class GalleryView extends Component<HTMLElement[]> {
  private listEl: HTMLElement;

  constructor(container: HTMLElement) {
    super(container);
    this.listEl =
      (container.querySelector(".gallery__list") as HTMLElement) || container;
  }

  render(items?: HTMLElement[]): HTMLElement {
    this.listEl.innerHTML = "";
    if (!items?.length) return this.container;

    items.forEach((el) => this.listEl.appendChild(el));

    return this.container;
  }
}
