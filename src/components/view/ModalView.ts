import { Component } from "../base/Component";

type OpenOptions = {
  content?: HTMLElement;
  afterAppendRender?: () => void;
  clearBeforeAppend?: boolean;
};

export class ModalView extends Component<{}> {
  private modalElement: HTMLElement;
  private contentElement: HTMLElement;
  private closeButton: HTMLElement | null = null;
  private previouslyFocused: Element | null = null;

  private onDocumentKeydownBound = this.onDocumentKeydown.bind(this);
  private onModalClickBound = this.onModalClick.bind(this);
  private onCloseClickBound = this.onCloseClick.bind(this);

  constructor(container: HTMLElement) {
    super(container);

    const el = container.classList.contains("modal")
      ? container
      : (container.querySelector(".modal") as HTMLElement | null);

    if (!el) {
      throw new Error("Modal element not found in container");
    }
    this.modalElement = el;

    const content = this.modalElement.querySelector(
      ".modal__content"
    ) as HTMLElement | null;
    if (!content) {
      throw new Error("Modal content element (.modal__content) not found");
    }
    this.contentElement = content;

    this.closeButton = this.modalElement.querySelector(".modal__close");

    this.modalElement.addEventListener("click", this.onModalClickBound);

    const innerContainer =
      this.modalElement.querySelector<HTMLElement>(".modal__container");
    if (innerContainer) {
      innerContainer.addEventListener("click", (e) => e.stopPropagation());
    }

    this.contentElement.addEventListener("click", (e) => e.stopPropagation());

    if (this.closeButton) {
      this.closeButton.addEventListener("click", this.onCloseClickBound);
    }
  }

  getContentElement(): HTMLElement {
    return this.contentElement;
  }

  clearContent(): void {
    this.contentElement.innerHTML = "";
  }

  setContent(node: HTMLElement): void {
    this.clearContent();
    this.contentElement.appendChild(node);
  }

  appendContent(node: HTMLElement): void {
    this.contentElement.appendChild(node);
  }

  open(opts?: OpenOptions): void {
    if (opts?.content) {
      if (opts.clearBeforeAppend ?? true) {
        this.clearContent();
      }
      this.appendContent(opts.content);

      // ✅ Добавляем data-template-id для SCSS
      const templateId = opts.content.id || "";
      this.modalElement.dataset.templateId = templateId;

      if (opts.afterAppendRender) {
        opts.afterAppendRender();
      }
    }

    this.previouslyFocused = document.activeElement;
    this.modalElement.classList.add("modal_active");
    document.addEventListener("keydown", this.onDocumentKeydownBound);

    const focusable = this.modalElement.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable) {
      focusable.focus();
    } else {
      (this.modalElement as HTMLElement).setAttribute("tabindex", "-1");
      (this.modalElement as HTMLElement).focus();
    }
  }

  close(): void {
    this.modalElement.classList.remove("modal_active");

    // ✅ Сбрасываем data-template-id
    this.modalElement.removeAttribute("data-template-id");

    document.removeEventListener("keydown", this.onDocumentKeydownBound);

    try {
      if (
        this.previouslyFocused &&
        (this.previouslyFocused as HTMLElement).focus
      ) {
        (this.previouslyFocused as HTMLElement).focus();
      }
    } catch {}
  }

  render(): HTMLElement {
    return this.modalElement;
  }

  private onModalClick(evt: MouseEvent) {
    if (evt.target === this.modalElement) {
      this.close();
    }
  }

  private onCloseClick() {
    this.close();
  }

  private onDocumentKeydown(evt: KeyboardEvent) {
    if (evt.key === "Escape" || evt.key === "Esc") {
      this.close();
    }
  }
}
