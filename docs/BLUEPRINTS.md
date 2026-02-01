# Automation Blueprints

UniFi Network Map provides ready-to-use Home Assistant automation blueprints for common network monitoring scenarios.

## Available Blueprints

| Blueprint | Description |
|-----------|-------------|
| [Device Offline Alert](#device-offline-alert) | Notify when a network device goes offline |
| [Device Online Alert](#device-online-alert) | Notify when a device comes back online |
| [AP Overload Alert](#ap-overload-alert) | Alert when an AP has too many clients |
| [VLAN Client Alert](#vlan-client-alert) | Alert when a VLAN exceeds client threshold |

## Installation

### Option 1: Import via URL

1. Go to **Settings** > **Automations & Scenes** > **Blueprints**
2. Click **Import Blueprint** (bottom right)
3. Paste the blueprint URL (see links below)
4. Click **Preview** then **Import**

### Option 2: Manual Copy

1. Copy the blueprint YAML file to your Home Assistant config:
   ```
   config/blueprints/automation/unifi_network_map/
   ```
2. Reload automations or restart Home Assistant

## Blueprints

### Device Offline Alert

Send a notification when a UniFi network device (gateway, switch, or AP) goes offline.

**Import URL:**
```
https://raw.githubusercontent.com/merlijntishauser/unifi-network-maps-ha/main/custom_components/unifi_network_map/blueprints/automation/device_offline_alert.yaml
```

**Inputs:**
- **Device to Monitor:** Select the UniFi device sensor to watch
- **Notification Service:** Service to call (e.g., `notify.mobile_app_phone`)
- **Offline Delay:** Seconds to wait before alerting (default: 60, avoids false alarms during brief disconnects)

**Example Use Cases:**
- Alert when your main gateway loses connectivity
- Monitor critical switches in your network
- Get notified if an access point in a remote location goes down

---

### Device Online Alert

Send a notification when a UniFi device comes back online after being offline.

**Import URL:**
```
https://raw.githubusercontent.com/merlijntishauser/unifi-network-maps-ha/main/custom_components/unifi_network_map/blueprints/automation/device_online_alert.yaml
```

**Inputs:**
- **Device to Monitor:** Select the UniFi device sensor to watch
- **Notification Service:** Service to call

**Tip:** Pair this with the Device Offline Alert on the same device to get notified of both events.

---

### AP Overload Alert

Alert when an access point has too many connected clients, which may indicate performance issues.

**Import URL:**
```
https://raw.githubusercontent.com/merlijntishauser/unifi-network-maps-ha/main/custom_components/unifi_network_map/blueprints/automation/ap_overload_alert.yaml
```

**Inputs:**
- **Access Point:** Select the AP sensor to monitor
- **Maximum Clients:** Threshold for alerting (default: 30)
- **Notification Service:** Service to call

**Notes:**
- The `clients_connected` attribute is only available on AP device sensors
- Typical consumer APs handle 20-30 clients well; enterprise APs can handle more
- Consider your AP model's specifications when setting the threshold

---

### VLAN Client Alert

Alert when a VLAN (network segment) has too many connected devices.

**Import URL:**
```
https://raw.githubusercontent.com/merlijntishauser/unifi-network-maps-ha/main/custom_components/unifi_network_map/blueprints/automation/vlan_client_alert.yaml
```

**Inputs:**
- **VLAN Sensor:** Select the VLAN client count sensor
- **Maximum Clients:** Threshold for alerting (default: 50)
- **Notification Service:** Service to call

**Example Use Cases:**
- Monitor IoT network for unexpected device proliferation
- Track guest network usage
- Alert on potential unauthorized devices joining a segment

---

## Available Entities

These blueprints work with entities created by UniFi Network Map:

### Device Sensors (`binary_sensor.unifi_device_*`)
- **State:** `on` (online) or `off` (offline)
- **Attributes:**
  - `device_type`: gateway, switch, or ap
  - `mac`: Device MAC address
  - `ip`: Device IP address
  - `model`: Device model name
  - `uplink_device`: Name of upstream device
  - `clients_connected`: Number of connected clients (APs only)

### Client Sensors (`binary_sensor.unifi_client_*`)
- **State:** `on` (connected) or `off` (disconnected)
- **Attributes:**
  - `mac`: Client MAC address
  - `ip`: Client IP address
  - `vlan`: VLAN ID
  - `network`: Network name
  - `connected_to`: Name of device client is connected to
  - `connection_type`: wired or wireless

### VLAN Sensors (`sensor.unifi_vlan_*_clients`)
- **State:** Number of connected clients
- **Attributes:**
  - `vlan_id`: VLAN identifier
  - `vlan_name`: Friendly network name
  - `clients`: List of connected client MACs

---

## Creating Automations from Blueprints

1. Go to **Settings** > **Automations & Scenes** > **Automations**
2. Click **Create Automation** > **Create new automation**
3. Click the three dots (top right) > **Create from blueprint**
4. Select the imported blueprint
5. Fill in the required inputs
6. Click **Save**

## Troubleshooting

### Blueprint not showing up
- Ensure the file is in the correct location
- Check YAML syntax is valid
- Reload automations: Developer Tools > YAML > Reload Automations

### Entity selector shows no devices
- Verify the UniFi Network Map integration is configured
- Check that device/client sensors are enabled in the integration options
- Wait for the first data poll to complete (up to 60 seconds)

### Notifications not sending
- Test the notification service manually first
- Check the automation trace for errors
- Verify the service name format (e.g., `notify.mobile_app_yourphone`)
