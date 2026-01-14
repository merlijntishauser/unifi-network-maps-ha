import "../unifi-network-map";

type ConfigurableCard = HTMLElement & {
  setConfig: (config: { svg_url: string; data_url: string }) => void;
  connectedCallback?: () => void;
};

describe("unifi-network-map card", () => {
  it("renders the stub content", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    document.body.appendChild(element);
    element.connectedCallback?.();
    expect(element.innerHTML).toContain("UniFi Network Map (stub)");
  });

  it("accepts config without throwing", () => {
    const element = document.createElement("unifi-network-map") as ConfigurableCard;
    element.setConfig({ svg_url: "/map.svg", data_url: "/map.json" });
  });
});
