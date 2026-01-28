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
  const resolvers = [
    resolveFromDataNodeId,
    resolveFromAriaLabel,
    resolveFromText,
    resolveFromGroupTitle,
    resolveFromGroupText,
    resolveFromElementId,
  ];
  for (const resolver of resolvers) {
    const value = resolver(target);
    if (value) {
      return value;
    }
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
    const holder = findNodeHolder(svg, name, textMap, titleMap);
    if (!holder) {
      continue;
    }
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

function findNodeHolder(
  svg: SVGElement,
  name: string,
  textMap: Map<string, Element[]>,
  titleMap: Map<string, Element[]>,
): Element | null {
  if (!name) {
    return null;
  }
  if (svg.querySelector(`[data-node-id="${CSS.escape(name)}"]`)) {
    return null;
  }
  const target = findNodeTarget(svg, name, textMap, titleMap);
  if (!target) {
    return null;
  }
  return target.closest("g") ?? target;
}

function findNodeTarget(
  svg: SVGElement,
  name: string,
  textMap: Map<string, Element[]>,
  titleMap: Map<string, Element[]>,
): Element | null {
  return (
    svg.querySelector(`[aria-label="${CSS.escape(name)}"]`) ??
    textMap.get(name)?.[0] ??
    titleMap.get(name)?.[0] ??
    null
  );
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

function resolveFromDataNodeId(target: Element): string | null {
  const node = target.closest("[data-node-id]") as Element | null;
  return node?.getAttribute("data-node-id")?.trim() ?? null;
}

function resolveFromAriaLabel(target: Element): string | null {
  const labelled = target.closest("[aria-label]") as Element | null;
  return labelled?.getAttribute("aria-label")?.trim() ?? null;
}

function resolveFromText(target: Element): string | null {
  const textNode = target.closest("text");
  return textNode?.textContent?.trim() ?? null;
}

function resolveFromGroupTitle(target: Element): string | null {
  const group = target.closest("g");
  const title = group?.querySelector("title");
  return title?.textContent?.trim() ?? null;
}

function resolveFromGroupText(target: Element): string | null {
  const group = target.closest("g");
  const groupText = group?.querySelector("text");
  return groupText?.textContent?.trim() ?? null;
}

function resolveFromElementId(target: Element): string | null {
  const idHolder = target.closest("[id]") as Element | null;
  return idHolder?.getAttribute("id")?.trim() ?? null;
}
