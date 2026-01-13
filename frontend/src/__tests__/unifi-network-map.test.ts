import "../unifi-network-map";

describe("unifi-network-map card", () => {
  it("renders the stub content", () => {
    const element = document.createElement("unifi-network-map") as HTMLElement;
    document.body.appendChild(element);
    (element as any).connectedCallback?.();
    expect(element.innerHTML).toContain("UniFi Network Map (stub)");
  });

  it("accepts config without throwing", () => {
    const element = document.createElement("unifi-network-map") as any;
    element.setConfig({ svg_url: "/map.svg", data_url: "/map.json" });
  });
});
