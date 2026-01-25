import { renderEntityModal } from "../ui/entity-modal";
import type { MapPayload } from "../core/types";

export type EntityModalController = {
  overlay?: HTMLElement;
};

export function createEntityModalController(): EntityModalController {
  return {};
}

export function openEntityModal(params: {
  controller: EntityModalController;
  nodeName: string;
  payload?: MapPayload;
  theme: "dark" | "light" | "unifi" | "unifi-dark";
  getNodeTypeIcon: (nodeType: string) => string;
  formatLastChanged: (value: string | null | undefined) => string;
  localize: (key: string, replacements?: Record<string, string | number>) => string;
  onEntityDetails: (entityId: string) => void;
}): void {
  closeEntityModal(params.controller);

  const modalHtml = renderEntityModal({
    nodeName: params.nodeName,
    payload: params.payload,
    theme: params.theme,
    getNodeTypeIcon: params.getNodeTypeIcon,
    formatLastChanged: params.formatLastChanged,
    localize: params.localize,
  });

  const container = document.createElement("div");
  container.innerHTML = modalHtml;
  const overlay = container.firstElementChild as HTMLElement | null;
  if (!overlay) {
    return;
  }

  document.body.appendChild(overlay);
  params.controller.overlay = overlay;
  wireEntityModalEvents(overlay, () => closeEntityModal(params.controller), params.onEntityDetails);
}

export function closeEntityModal(controller: EntityModalController): void {
  if (controller.overlay) {
    controller.overlay.remove();
    controller.overlay = undefined;
  }
}

function wireEntityModalEvents(
  overlay: HTMLElement,
  onClose: () => void,
  onEntityDetails: (entityId: string) => void,
): void {
  overlay.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target.hasAttribute("data-modal-overlay")) {
      onClose();
      return;
    }

    const closeButton = target.closest('[data-action="close-modal"]');
    if (closeButton) {
      onClose();
      return;
    }

    const entityItem = target.closest("[data-modal-entity-id]") as HTMLElement | null;
    if (entityItem) {
      event.preventDefault();
      event.stopPropagation();
      const entityId = entityItem.getAttribute("data-modal-entity-id");
      if (entityId) {
        onEntityDetails(entityId);
      }
    }
  });
}
