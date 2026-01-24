export type Hass = {
  auth?: {
    data?: {
      access_token?: string;
    };
  };
  callWS?: <T>(msg: Record<string, unknown>) => Promise<T>;
};

export type CardConfig = {
  type?: string;
  entry_id?: string;
  svg_url?: string;
  data_url?: string;
  theme?: "dark" | "light" | "unifi";
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
  wireless?: boolean | null;
  poe?: boolean | null;
};

export type FormSchemaEntry = {
  name: string;
  required?: boolean;
  selector: {
    select: {
      mode: string;
      options: Array<{ label: string; value: string }>;
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
  related_entities?: Record<string, RelatedEntity[]>;
};
