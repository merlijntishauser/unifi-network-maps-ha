import { escapeHtml } from "../card/data/sanitize";
import type { MapPayload } from "../card/core/types";
import { renderTabContent } from "../card/ui/panel";
import type { PanelContext, PanelHelpers } from "../card/ui/panel";

const CLIENT = "aa:bb:cc:dd:ee:01";
const AP = "11:22:33:44:55:66";

const helpers = {
  escapeHtml,
  getNodeTypeIcon: () => "",
  getStatusBadgeHtml: () => "",
  formatLastChanged: () => "",
  getIcon: () => "",
  getDomainIcon: () => "",
  localize: (key: string) => key,
} as PanelHelpers;

function statsTab(payload: MapPayload): string {
  const context: PanelContext = { payload, selectedNode: CLIENT, activeTab: "stats" };
  return renderTabContent(context, CLIENT, helpers);
}

function wirelessPayload(connection: NonNullable<MapPayload["edges"][number]["connection"]>) {
  return {
    edges: [{ left: AP, right: CLIENT, wireless: true, channel: 36, connection }],
    node_types: { [CLIENT]: "phone", [AP]: "ap" },
  } as MapPayload;
}

describe("panel wireless connection quality (#33)", () => {
  it("shows signal, quality, noise, rates and satisfaction for a wireless client", () => {
    const html = statsTab(
      wirelessPayload({
        signal_dbm: -65,
        noise_dbm: -95,
        tx_rate_mbps: 866,
        rx_rate_mbps: 650,
        satisfaction: 98,
        quality: "good",
      }),
    );

    expect(html).toContain("panel.stats.wireless_signal");
    expect(html).toContain("-65 dBm");
    expect(html).toContain("panel.stats.signal_quality.good");
    expect(html).toContain('class="signal-quality signal-quality--good"');
    expect(html).toContain("-95 dBm");
    expect(html).toContain("866 Mbps");
    expect(html).toContain("650 Mbps");
    expect(html).toContain("98%");
  });

  it("leaves out rows whose value the controller did not report", () => {
    const html = statsTab(
      wirelessPayload({
        signal_dbm: -80,
        noise_dbm: null,
        tx_rate_mbps: null,
        rx_rate_mbps: null,
        satisfaction: null,
        quality: "poor",
      }),
    );

    expect(html).toContain("-80 dBm");
    expect(html).not.toContain("panel.stats.noise");
    expect(html).not.toContain("panel.stats.tx_rate");
    expect(html).not.toContain("panel.stats.satisfaction");
  });

  it("does not render an unknown quality grade as markup", () => {
    const html = statsTab(
      wirelessPayload({
        signal_dbm: -60,
        noise_dbm: null,
        tx_rate_mbps: null,
        rx_rate_mbps: null,
        satisfaction: null,
        quality: '<img src=x onerror="alert(1)">',
      }),
    );

    expect(html).not.toContain("<img");
    expect(html).not.toContain("signal-quality--");
  });

  it("does not show a client's signal when the access point is selected", () => {
    const payload = wirelessPayload({
      signal_dbm: -65,
      noise_dbm: null,
      tx_rate_mbps: null,
      rx_rate_mbps: null,
      satisfaction: null,
      quality: "good",
    });
    const context: PanelContext = { payload, selectedNode: AP, activeTab: "stats" };

    expect(renderTabContent(context, AP, helpers)).not.toContain("panel.stats.wireless_signal");
  });

  it("shows no wireless section for a wired client", () => {
    const html = statsTab({
      edges: [{ left: AP, right: CLIENT, wireless: false, connection: null }],
      node_types: { [CLIENT]: "client" },
    } as MapPayload);

    expect(html).not.toContain("panel.stats.wireless_signal");
  });
});
