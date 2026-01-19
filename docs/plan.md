Roadmap updated. Here's a summary of the assessment:

  Priority Assessment

  P2 - Bugs (High Impact)

  Moved Isometric toggle refresh here since it's a correctness issue, not just UX polish.

  P3 - UX Polish

  Reorganized into three tiers by effort:
  - Quick Wins (5 items) - Low-hanging fruit that can be done in a session
  - Medium Effort (5 items) - Requires more thought but high user value
  - Larger Scope (2 items) - Multi-site and docs need more planning

  P4 - Code Quality

  Streamlined the method list and added "Extract shared utilities" to reduce duplication.

  P5 - Features

  Reorganized with effort estimates (S/M/L) using tables for clarity:

  New features added:
  ┌─────────────────────────┬───────────────┬─────────────────────────────────────────┐
  │         Feature         │   Category    │                   Why                   │
  ├─────────────────────────┼───────────────┼─────────────────────────────────────────┤
  │ VLAN visualization      │ Visualization │ Common request for segmented networks   │
  ├─────────────────────────┼───────────────┼─────────────────────────────────────────┤
  │ Guest network highlight │ Visualization │ Quick identification of guest devices   │
  ├─────────────────────────┼───────────────┼─────────────────────────────────────────┤
  │ Firmware status badges  │ Visualization │ Actionable - shows what needs updates   │
  ├─────────────────────────┼───────────────┼─────────────────────────────────────────┤
  │ Filter by device type   │ Interactive   │ Quick focus on specific device classes  │
  ├─────────────────────────┼───────────────┼─────────────────────────────────────────┤
  │ HA theme sync           │ Integration   │ Seamless dark/light mode experience     │
  ├─────────────────────────┼───────────────┼─────────────────────────────────────────┤
  │ Full-screen mode        │ Integration   │ Better for wall-mounted displays        │
  ├─────────────────────────┼───────────────┼─────────────────────────────────────────┤
  │ Mobile-optimized view   │ Integration   │ Tablets/phones are common HA interfaces │
  └─────────────────────────┴───────────────┴─────────────────────────────────────────┘
  Future Considerations (longer-term vision):
  - Multi-controller support
  - Network health score
  - Alert integration for offline devices
  - Historical timeline with scrubber
  - Threat detection overlay
  - Bandwidth usage trends
  - Connection quality metrics

  Recommended Next Steps

  1. Quick win: Tooltip boundary detection (S effort, high annoyance fix)
  2. Quick win: Copy-to-clipboard for MAC/IP (S effort, frequently requested)
  3. Medium: Search/filter in detail panel (M effort, big UX improvement for large networks)
