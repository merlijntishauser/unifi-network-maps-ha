import DOMPurify from "dompurify";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const DOMPURIFY_CONFIG = {
  USE_PROFILES: { html: true, svg: true, svgFilters: true },
  ADD_ATTR: [
    "data-node-id",
    "data-action",
    "data-tab",
    "data-edge",
    "data-edge-left",
    "data-edge-right",
    "data-entity-id",
    "data-copy-value",
    "data-context-action",
    "data-context-node",
    "data-mac",
    "data-modal-overlay",
    "data-modal-entity-id",
  ],
};

export function sanitizeHtml(markup: string): string {
  return DOMPurify.sanitize(markup, DOMPURIFY_CONFIG);
}

export function sanitizeSvg(svg: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, "image/svg+xml");
  const svgElement = doc.querySelector("svg");
  if (!svgElement) {
    return "";
  }
  const dangerousElements = svgElement.querySelectorAll("script, foreignObject");
  dangerousElements.forEach((el) => el.remove());
  const allElements = svgElement.querySelectorAll("*");
  const eventAttrs = /^on[a-z]+$/i;
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (eventAttrs.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
      if (attr.value.toLowerCase().includes("javascript:")) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return svgElement.outerHTML;
}
