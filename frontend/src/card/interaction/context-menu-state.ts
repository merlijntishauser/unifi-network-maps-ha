import { parseContextMenuAction } from "../ui/context-menu";
import type { ContextMenuState } from "../core/types";

type ContextMenuElement = HTMLElement & { _cleanup?: () => void };

export type ContextMenuController = {
  menu?: ContextMenuState;
  element?: ContextMenuElement;
};

export function createContextMenuController(): ContextMenuController {
  return {};
}

export function openContextMenu(params: {
  controller: ContextMenuController;
  menu: ContextMenuState;
  renderMenu: (nodeName: string) => string;
  onAction: (action: string, nodeName: string, mac: string | null, ip: string | null) => void;
}): void {
  const container = document.createElement("div");
  container.innerHTML = params.renderMenu(params.menu.nodeName);
  const menuEl = container.firstElementChild as ContextMenuElement | null;
  if (!menuEl) {
    return;
  }

  document.body.appendChild(menuEl);
  params.controller.menu = params.menu;
  params.controller.element = menuEl;

  positionContextMenu(menuEl, params.menu.x, params.menu.y);
  wireContextMenuEvents(
    menuEl,
    () => closeContextMenu(params.controller),
    (action, mac, ip) => params.onAction(action, params.menu.nodeName, mac, ip),
  );
}

export function closeContextMenu(controller: ContextMenuController): void {
  if (controller.element) {
    controller.element._cleanup?.();
    controller.element.remove();
  }
  controller.element = undefined;
  controller.menu = undefined;
}

function positionContextMenu(menu: HTMLElement, x: number, y: number): void {
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let adjustedX = x;
    let adjustedY = y;

    if (rect.right > viewportWidth) {
      adjustedX = viewportWidth - rect.width - 8;
    }
    if (rect.bottom > viewportHeight) {
      adjustedY = viewportHeight - rect.height - 8;
    }
    if (adjustedX < 8) {
      adjustedX = 8;
    }
    if (adjustedY < 8) {
      adjustedY = 8;
    }

    menu.style.left = `${adjustedX}px`;
    menu.style.top = `${adjustedY}px`;
  });
}

function wireContextMenuEvents(
  menu: ContextMenuElement,
  onClose: () => void,
  onAction: (action: string, mac: string | null, ip: string | null) => void,
): void {
  const handleClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const result = parseContextMenuAction(target);

    if (!result) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    onAction(result.action, result.mac, result.ip);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (!menu.contains(event.target as Node)) {
      onClose();
    }
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      onClose();
    }
  };

  menu.addEventListener("click", handleClick);
  document.addEventListener("click", handleClickOutside, { once: true });
  document.addEventListener("keydown", handleKeydown);

  menu._cleanup = () => {
    menu.removeEventListener("click", handleClick);
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeydown);
  };
}
