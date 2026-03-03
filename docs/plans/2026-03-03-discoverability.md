# Discoverability Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve how the integration is found and evaluated via GitHub/HACS
search and the repository landing page.

**Architecture:** Three independent changes -- GitHub repo metadata (gh CLI),
README structural edits (two targeted sections), and a screenshot slot
placeholder. No code changes, no tests needed.

**Tech Stack:** `gh` CLI for GitHub metadata, plain Markdown for README edits.

---

### Task 1: Set GitHub repository description and topics

**Files:**
- No files changed (GitHub API via gh CLI)

**Step 1: Set repo description and topics**

```bash
gh repo edit merlijntishauser/unifi-network-maps-ha \
  --description "Interactive UniFi network topology map for Home Assistant. Visualize device connections, monitor client presence, and display your network structure in a live Lovelace card." \
  --add-topic home-assistant \
  --add-topic hacs \
  --add-topic hacs-integration \
  --add-topic unifi \
  --add-topic unifi-network \
  --add-topic lovelace \
  --add-topic lovelace-card \
  --add-topic network-topology \
  --add-topic svg \
  --add-topic home-automation
```

**Step 2: Verify**

```bash
gh repo view merlijntishauser/unifi-network-maps-ha --json description,repositoryTopics
```

Expected: description set, 10 topics listed.

---

### Task 2: Move screenshot and add second screenshot placeholder

**Files:**
- Modify: `README.md:8-14`

**Current structure (lines 8-14):**
```
A Home Assistant integration...

This integration complements...

![UniFi Network Map in Home Assistant](screenshots/lovelace-card.png)

---
```

**Step 1: Rewrite to move screenshot immediately after the one-liner**

Replace lines 8-14 with:
```markdown
A Home Assistant integration that visualizes your UniFi network topology as an interactive map. See how your devices connect, which clients are online, and understand your network structure at a glance.

![UniFi Network Map - light theme](screenshots/lovelace-card.png)

<!-- TODO: add screenshots/lovelace-card-dark-selected.png (dark theme, node selected, detail panel open) -->

---
```

**Step 2: Verify README renders correctly**

Open `README.md` and confirm the screenshot appears immediately after the
one-liner with no intervening prose.

---

### Task 3: Replace "What You Get" prose with feature bullet list and complementary integration blurb

**Files:**
- Modify: `README.md:16-23`

**Current structure (lines 16-23):**
```
## What You Get

The integration creates an interactive SVG map of your network that updates...

Each device on the map links to...

The card supports four visual themes...
```

**Step 1: Replace the section**

Replace lines 16-23 with:
```markdown
## What You Get

- Interactive SVG topology map with pan, zoom, and touch gesture support
- Real-time updates via WebSocket (no polling)
- Device type filtering (gateway, switch, AP, clients)
- Node selection with detail panel showing IP, MAC, model, and firmware
- Entity linking to the official UniFi integration for click-through context
- VLAN coloring on nodes and edges
- Port utilization display with PoE power consumption
- 6 SVG themes: unifi, unifi-dark, minimal, minimal-dark, classic, classic-dark
- 2 icon sets: modern and isometric
- Binary sensors for device and client presence
- VLAN client-count sensors
- 4 automation blueprints (device offline/online, AP overload, VLAN threshold)

### Works alongside the official UniFi integration

The built-in `unifi` integration handles device tracking, presence detection,
and switch control. This integration adds network topology visualization --
it shows how your devices connect to each other, which clients are on which
AP or switch port, and how your network is structured. They share the same
UniFi controller but serve different purposes. Entity linking works best when
both are installed: clicking a device in the map opens its HA entity directly.

---
```

**Step 2: Verify README structure**

Confirm the section flows: one-liner → screenshot → feature list →
complementary blurb → `---` → "Before You Start".

---

### Task 4: Commit

**Step 1: Commit the README changes**

```bash
git add README.md
git commit -m "Improve discoverability: feature list, screenshot placement, integration blurb"
```

Note: GitHub metadata from Task 1 is applied directly to the remote -- no
commit needed for that.
