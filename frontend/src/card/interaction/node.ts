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

export function annotateNodeIds(svg: SVGElement, nodeNames: string[]): void {
  if (!nodeNames.length) {
    return;
  }
  const textMap = buildTextMap(svg, "text");
  const titleMap = buildTextMap(svg, "title");

  for (const name of nodeNames) {
    if (!name) continue;
    if (svg.querySelector(`[data-node-id="${CSS.escape(name)}"]`)) {
      continue;
    }
    const ariaMatch = svg.querySelector(`[aria-label="${CSS.escape(name)}"]`);
    const textMatch = textMap.get(name)?.[0] ?? null;
    const titleMatch = titleMap.get(name)?.[0] ?? null;
    const target = (ariaMatch ?? textMatch ?? titleMatch) as Element | null;
    if (!target) {
      continue;
    }
    const holder = target.closest("g") ?? target;
    holder.setAttribute("data-node-id", name);
  }
}

export function removeSvgTitles(svg: SVGElement): void {
  // Remove <title> elements to prevent native browser tooltips
  // (we show custom tooltips instead)
  svg.querySelectorAll("title").forEach((el) => el.remove());
}

function buildTextMap(svg: SVGElement, selector: "text" | "title"): Map<string, Element[]> {
  const map = new Map<string, Element[]>();
  for (const el of svg.querySelectorAll(selector)) {
    const text = el.textContent?.trim();
    if (!text) continue;
    const list = map.get(text) ?? [];
    list.push(el);
    map.set(text, list);
  }
  return map;
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
