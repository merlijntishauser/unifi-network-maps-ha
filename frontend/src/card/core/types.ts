export type UnsubscribeFunc = () => void;

export type HassConnection = {
  subscribeMessage<T>(
    callback: (result: T) => void,
    subscribeMessage: { type: string; [key: string]: unknown },
    options?: { resubscribe?: boolean },
  ): Promise<UnsubscribeFunc>;
};

export type Hass = {
  auth?: {
    data?: {
      access_token?: string;
    };
  };
  callWS?: <T>(msg: Record<string, unknown>) => Promise<T>;
  connection?: HassConnection;
};

export type CardConfig = {
  type?: string;
  entry_id?: string;
  svg_url?: string;
  data_url?: string;
  theme?: "dark" | "light" | "unifi" | "unifi-dark";
  card_height?: string | number;
};

export type ConfigEntry = {
  entry_id: string;
  title: string;
  domain: string;
};

export type NodeStatus = {
  entity_id: string;
  state: "online" | "offline" | "unknown";
  last_changed?: string | null;
};

export type Edge = {
  left: string;
  right: string;
  label?: string | null;
  poe?: boolean | null;
  wireless?: boolean | null;
  speed?: number | null;
  channel?: number | null;
};

export type Point = {
  x: number;
  y: number;
};

export type ViewTransform = {
  x: number;
  y: number;
  scale: number;
};

export type ViewBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DeviceCounts = {
  gateways: number;
  switches: number;
  aps: number;
  clients: number;
  other: number;
};

export type StatusCounts = {
  online: number;
  offline: number;
  hasStatus: boolean;
};

export type Neighbor = {
  name: string;
  label?: string | null;
  portNumber?: number;
  wireless?: boolean | null;
  poe?: boolean | null;
};

export type FormSchemaEntry = {
  name: string;
  required?: boolean;
  selector: {
    select?: {
      mode: string;
      options: Array<{ label: string; value: string }>;
    };
    text?: {
      type?: string;
      prefix?: string;
      suffix?: string;
    };
  };
  label: string;
};

export type RelatedEntity = {
  entity_id: string;
  domain: string;
  state: string | null;
  last_changed?: string | null;
  ip?: string | null;
  friendly_name?: string | null;
};

export type ContextMenuState = {
  nodeName: string;
  x: number;
  y: number;
};

export type PortInfo = {
  port: number;
  connectedDevice: string | null;
  connectedDeviceType: string | null;
  poe: boolean;
  poeActive: boolean;
  poePower: number | null;
  speed: number | null;
};

export type DevicePort = {
  port: number;
  name: string | null;
  speed: number | null;
  poe_enabled: boolean;
  poe_active: boolean;
  poe_power: number | null;
};

export type PortModalState = {
  nodeName: string;
  nodeType: string;
  ports: PortInfo[];
};

export type VlanInfo = {
  id: number;
  name: string;
};

export type DeviceDetails = {
  mac?: string | null;
  ip?: string | null;
  model?: string | null;
  model_name?: string | null;
  uplink_device?: string | null;
};

export type MapPayload = {
  schema_version?: string;
  edges: Edge[];
  node_types: Record<string, string>;
  gateways?: string[];
  client_entities?: Record<string, string>;
  device_entities?: Record<string, string>;
  node_entities?: Record<string, string>;
  node_status?: Record<string, NodeStatus>;
  client_macs?: Record<string, string>;
  device_macs?: Record<string, string>;
  client_ips?: Record<string, string>;
  device_ips?: Record<string, string>;
  related_entities?: Record<string, RelatedEntity[]>;
  node_vlans?: Record<string, number | null>;
  vlan_info?: Record<number, VlanInfo>;
  ap_client_counts?: Record<string, number>;
  device_details?: Record<string, DeviceDetails>;
  device_ports?: Record<string, DevicePort[]>;
};

export type DeviceType = "gateway" | "switch" | "ap" | "client" | "other";

export type DeviceTypeFilters = {
  gateway: boolean;
  switch: boolean;
  ap: boolean;
  client: boolean;
  other: boolean;
};
