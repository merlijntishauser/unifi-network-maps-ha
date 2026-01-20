export function resolveNodeName(event: MouseEvent | PointerEvent): string | null {
  const path = event.composedPath();
  for (const item of path) {
    if (item instanceof Element) {
      const nodeId = item.getAttribute("data-node-id");
      if (nodeId) {
        return nodeId.trim();
      }
      const aria = item.getAttribute("aria-label");
      if (aria) {
        return aria.trim();
      }
      if (item.tagName.toLowerCase() === "text" && item.textContent) {
        return item.textContent.trim();
      }
      if (item.tagName.toLowerCase() === "title" && item.textContent) {
        return item.textContent.trim();
      }
    }
  }
  const fallback = document.elementFromPoint(event.clientX, event.clientY);
  return inferNodeName(fallback);
}

export function inferNodeName(target: Element | null): string | null {
  if (!target) {
    return null;
  }
  const node = target.closest("[data-node-id]") as Element | null;
  if (node?.getAttribute("data-node-id")) {
    return node.getAttribute("data-node-id")?.trim() ?? null;
  }
  const labelled = target.closest("[aria-label]") as Element | null;
  if (labelled?.getAttribute("aria-label")) {
    return labelled.getAttribute("aria-label")?.trim() ?? null;
  }
  const textNode = target.closest("text");
  if (textNode?.textContent) {
    return textNode.textContent.trim();
  }
  const group = target.closest("g");
  const title = group?.querySelector("title");
  if (title?.textContent) {
    return title.textContent.trim();
  }
  const groupText = group?.querySelector("text");
  if (groupText?.textContent) {
    return groupText.textContent.trim();
  }
  const idHolder = target.closest("[id]") as Element | null;
  if (idHolder?.getAttribute("id")) {
    return idHolder.getAttribute("id")?.trim() ?? null;
  }
  return null;
}

export function findNodeElement(svg: SVGElement, nodeName: string): Element | null {
  return (
    findByDataNodeId(svg, nodeName) ??
    findByAriaLabel(svg, nodeName) ??
    findByTextContent(svg, nodeName) ??
    findByTitleElement(svg, nodeName)
  );
}

export function highlightSelectedNode(svg: SVGElement, selectedNode?: string): void {
  clearNodeSelection(svg);
  if (!selectedNode) {
    return;
  }
  const element = findNodeElement(svg, selectedNode);
  if (element) {
    markNodeSelected(element);
  }
}

export function clearNodeSelection(svg: SVGElement): void {
  svg.querySelectorAll("[data-selected]").forEach((el) => {
    el.removeAttribute("data-selected");
  });
  svg.querySelectorAll(".node--selected").forEach((el) => {
    el.classList.remove("node--selected");
  });
}

export function markNodeSelected(element: Element): void {
  if (element.tagName.toLowerCase() === "g") {
    element.setAttribute("data-selected", "true");
  } else {
    element.classList.add("node--selected");
  }
}

function findByDataNodeId(svg: SVGElement, nodeName: string): Element | null {
  const el = svg.querySelector(`[data-node-id="${CSS.escape(nodeName)}"]`);
  return el ? (el.closest("g") ?? el) : null;
}

function findByAriaLabel(svg: SVGElement, nodeName: string): Element | null {
  const el = svg.querySelector(`[aria-label="${CSS.escape(nodeName)}"]`);
  return el ? (el.closest("g") ?? el) : null;
}

function findByTextContent(svg: SVGElement, nodeName: string): Element | null {
  for (const textEl of svg.querySelectorAll("text")) {
    if (textEl.textContent?.trim() === nodeName) {
      return textEl.closest("g") ?? textEl;
    }
  }
  return null;
}

function findByTitleElement(svg: SVGElement, nodeName: string): Element | null {
  for (const titleEl of svg.querySelectorAll("title")) {
    if (titleEl.textContent?.trim() === nodeName) {
      return titleEl.closest("g");
    }
  }
  return null;
}
