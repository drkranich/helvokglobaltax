export function renderDashboard(): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Helvok Tax - Command Center</title>
    <meta
      name="description"
      content="Helvok Tax command center for multi-tenant global fiscal compliance operations."
    />
    <style>
      :root {
        color-scheme: dark;
        --royal-950: #06133f;
        --royal-900: #071a5c;
        --royal-800: #0a2579;
        --royal-700: #1536a5;
        --royal-500: #2f64ff;
        --royal-300: #8eb4ff;
        --ochre-600: #b86f16;
        --ochre-500: #d88a1d;
        --ochre-300: #ffc56c;
        --frost: #f7fbff;
        --frost-80: rgba(247, 251, 255, 0.8);
        --frost-64: rgba(247, 251, 255, 0.64);
        --frost-18: rgba(247, 251, 255, 0.18);
        --frost-10: rgba(247, 251, 255, 0.1);
        --ink: #05091d;
        --ink-soft: #0b1436;
        --glass-blue: rgba(11, 34, 103, 0.48);
        --glass-deep: rgba(4, 12, 43, 0.64);
        --line: rgba(247, 251, 255, 0.16);
        --line-strong: rgba(247, 251, 255, 0.28);
        --good: #59f1bd;
        --warn: #ffc56c;
        --danger: #ff6b6b;
        --shadow: 0 24px 80px rgba(1, 7, 30, 0.48);
        --radius: 8px;
        --font-display: "Space Grotesk", "Inter Tight", "Segoe UI", sans-serif;
        --font-body: "Inter", "Segoe UI", system-ui, sans-serif;
        --font-data: "IBM Plex Mono", "Cascadia Code", "Consolas", monospace;
      }

      * {
        box-sizing: border-box;
      }

      html {
        min-height: 100%;
        background: var(--ink);
      }

      body {
        min-height: 100vh;
        margin: 0;
        overflow-x: hidden;
        font-family: var(--font-body);
        color: var(--frost);
        letter-spacing: 0;
        background:
          linear-gradient(115deg, rgba(7, 26, 92, 0.86), rgba(5, 9, 29, 0.96) 54%, rgba(184, 111, 22, 0.3)),
          radial-gradient(circle at 18% 16%, rgba(47, 100, 255, 0.38), transparent 30%),
          linear-gradient(180deg, #06133f 0%, #05091d 100%);
      }

      body::before {
        position: fixed;
        inset: 0;
        z-index: -2;
        pointer-events: none;
        content: "";
        background-image:
          linear-gradient(rgba(247, 251, 255, 0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(247, 251, 255, 0.045) 1px, transparent 1px);
        background-size: 52px 52px;
        mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.94), rgba(0, 0, 0, 0.28));
      }

      body::after {
        position: fixed;
        inset: 0;
        z-index: -1;
        pointer-events: none;
        content: "";
        background:
          linear-gradient(100deg, transparent 0%, rgba(142, 180, 255, 0.08) 42%, transparent 62%),
          repeating-linear-gradient(135deg, rgba(255, 197, 108, 0.05) 0 1px, transparent 1px 18px);
        animation: sweep 13s linear infinite;
      }

      ::selection {
        color: var(--ink);
        background: var(--ochre-300);
      }

      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(5, 9, 29, 0.28);
      }

      ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(142, 180, 255, 0.52), rgba(216, 138, 29, 0.72));
        border: 3px solid rgba(5, 9, 29, 0.2);
        border-radius: 999px;
      }

      a {
        color: inherit;
      }

      .hidden {
        display: none !important;
      }

      button,
      input,
      select {
        font: inherit;
      }

      .app-shell {
        display: grid;
        grid-template-columns: 276px minmax(0, 1fr);
        min-height: 100vh;
      }

      .side-rail {
        position: sticky;
        top: 0;
        display: flex;
        flex-direction: column;
        gap: 24px;
        height: 100vh;
        padding: 22px;
        border-right: 1px solid var(--line);
        background: linear-gradient(180deg, rgba(3, 11, 42, 0.76), rgba(7, 26, 92, 0.38));
        backdrop-filter: blur(24px) saturate(150%);
      }

      .brand {
        display: grid;
        gap: 12px;
      }

      .brand-mark {
        position: relative;
        display: grid;
        grid-template-columns: 46px minmax(0, 1fr);
        gap: 12px;
        align-items: center;
      }

      .brand-sigil {
        position: relative;
        display: grid;
        place-items: center;
        width: 46px;
        height: 46px;
        overflow: hidden;
        border: 1px solid rgba(255, 197, 108, 0.42);
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(47, 100, 255, 0.62), rgba(216, 138, 29, 0.36)),
          rgba(247, 251, 255, 0.08);
        box-shadow: 0 18px 34px rgba(2, 8, 30, 0.34);
      }

      .brand-sigil::before,
      .brand-sigil::after {
        position: absolute;
        inset: 8px;
        content: "";
        border: 1px solid rgba(247, 251, 255, 0.44);
        transform: rotate(45deg);
      }

      .brand-sigil::after {
        inset: 15px;
        border-color: rgba(255, 197, 108, 0.72);
        animation: sigilPulse 2.8s ease-in-out infinite;
      }

      .brand-copy strong {
        display: block;
        font-family: var(--font-display);
        font-size: 22px;
        font-weight: 760;
        line-height: 1;
      }

      .brand-copy span {
        display: block;
        margin-top: 4px;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
        text-transform: uppercase;
      }

      .env-pill {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
        color: var(--frost-80);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .pulse-dot {
        display: inline-flex;
        width: 9px;
        height: 9px;
        margin-right: 7px;
        border-radius: 999px;
        background: var(--good);
        box-shadow: 0 0 0 0 rgba(89, 241, 189, 0.6);
        animation: livePulse 1.9s ease-out infinite;
      }

      .nav-stack {
        display: grid;
        gap: 8px;
      }

      .nav-button {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-height: 42px;
        padding: 10px 12px;
        border: 1px solid transparent;
        border-radius: var(--radius);
        background: transparent;
        color: var(--frost-64);
        text-decoration: none;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease;
      }

      .nav-button:hover,
      .nav-button.active {
        border-color: var(--line);
        background: rgba(247, 251, 255, 0.1);
        color: var(--frost);
        transform: translateX(3px);
      }

      .nav-code {
        color: var(--ochre-300);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .rail-footer {
        display: grid;
        gap: 12px;
        margin-top: auto;
      }

      .glass-note {
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.09);
        color: var(--frost-64);
        font-size: 12px;
        line-height: 1.55;
      }

      .content {
        display: grid;
        gap: 22px;
        padding: 22px;
      }

      .topbar {
        position: sticky;
        top: 0;
        z-index: 5;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 14px;
        align-items: center;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(6, 19, 63, 0.62);
        backdrop-filter: blur(24px) saturate(150%);
        box-shadow: var(--shadow);
      }

      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        min-width: 0;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 12px;
      }

      .breadcrumb strong {
        color: var(--frost);
        font-family: var(--font-display);
        font-size: 16px;
      }

      .top-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
      }

      .glass-field,
      .glass-select,
      .glass-button {
        min-height: 40px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.1);
        color: var(--frost);
        outline: none;
        backdrop-filter: blur(18px) saturate(150%);
      }

      .glass-field {
        width: min(260px, 100%);
        padding: 0 12px;
      }

      .glass-field::placeholder {
        color: rgba(247, 251, 255, 0.48);
      }

      .glass-select {
        padding: 0 36px 0 12px;
        color: var(--frost);
        appearance: none;
        background-image:
          linear-gradient(45deg, transparent 50%, var(--ochre-300) 50%),
          linear-gradient(135deg, var(--ochre-300) 50%, transparent 50%),
          linear-gradient(90deg, rgba(247, 251, 255, 0.16), rgba(247, 251, 255, 0.16));
        background-position:
          calc(100% - 18px) 17px,
          calc(100% - 13px) 17px,
          calc(100% - 34px) 9px;
        background-size: 5px 5px, 5px 5px, 1px 22px;
        background-repeat: no-repeat;
      }

      .glass-select option {
        color: var(--frost);
        background: var(--royal-950);
      }

      .glass-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 14px;
        cursor: pointer;
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      }

      .glass-button:hover {
        border-color: rgba(255, 197, 108, 0.52);
        background: rgba(216, 138, 29, 0.18);
        transform: translateY(-1px);
      }

      .glass-button.primary {
        border-color: rgba(255, 197, 108, 0.58);
        background: linear-gradient(135deg, rgba(216, 138, 29, 0.92), rgba(47, 100, 255, 0.54));
        color: white;
        box-shadow: 0 14px 34px rgba(216, 138, 29, 0.18);
      }

      .hero-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
        gap: 22px;
        align-items: stretch;
      }

      .hero-panel,
      .panel,
      .metric,
      .feed,
      .module {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: linear-gradient(145deg, rgba(247, 251, 255, 0.13), rgba(7, 26, 92, 0.28));
        backdrop-filter: blur(26px) saturate(155%);
        box-shadow: var(--shadow);
      }

      .hero-panel {
        position: relative;
        min-height: 392px;
        overflow: hidden;
        padding: clamp(24px, 4vw, 42px);
      }

      .hero-panel::before {
        position: absolute;
        inset: 0;
        pointer-events: none;
        content: "";
        background:
          linear-gradient(90deg, rgba(255, 197, 108, 0.24), transparent 18%, transparent 82%, rgba(142, 180, 255, 0.18)),
          repeating-linear-gradient(90deg, transparent 0 64px, rgba(247, 251, 255, 0.08) 65px, transparent 66px);
      }

      .hero-panel::after {
        position: absolute;
        left: -20%;
        right: -20%;
        top: 26%;
        height: 2px;
        content: "";
        background: linear-gradient(90deg, transparent, rgba(255, 197, 108, 0.86), rgba(142, 180, 255, 0.86), transparent);
        animation: scanLine 4.5s ease-in-out infinite;
      }

      .hero-content {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 22px;
        height: 100%;
      }

      .eyebrow {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        border: 1px solid rgba(255, 197, 108, 0.34);
        border-radius: var(--radius);
        background: rgba(216, 138, 29, 0.11);
        color: var(--ochre-300);
        font-family: var(--font-data);
        font-size: 11px;
        text-transform: uppercase;
      }

      .hero-title {
        max-width: 760px;
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(46px, 8vw, 104px);
        font-weight: 820;
        line-height: 0.86;
      }

      .hero-title span {
        color: transparent;
        background: linear-gradient(92deg, var(--frost), var(--royal-300), var(--ochre-300));
        -webkit-background-clip: text;
        background-clip: text;
      }

      .hero-subtitle {
        max-width: 690px;
        margin: 0;
        color: var(--frost-80);
        font-size: clamp(15px, 1.7vw, 19px);
        line-height: 1.65;
      }

      .hero-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: auto;
      }

      .strip-cell {
        min-height: 78px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
      }

      .strip-cell span {
        display: block;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
        text-transform: uppercase;
      }

      .strip-cell strong {
        display: block;
        margin-top: 8px;
        font-family: var(--font-display);
        font-size: 24px;
      }

      .status-panel {
        display: grid;
        gap: 14px;
        padding: 18px;
      }

      .panel-title {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
      }

      .panel-title h2,
      .panel-title h3 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 17px;
      }

      .panel-title span {
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .system-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        align-items: center;
        min-height: 54px;
        padding: 11px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
      }

      .system-row strong {
        display: block;
        font-size: 14px;
      }

      .system-row span {
        display: block;
        margin-top: 4px;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 72px;
        padding: 7px 9px;
        border: 1px solid rgba(89, 241, 189, 0.36);
        border-radius: var(--radius);
        background: rgba(89, 241, 189, 0.1);
        color: var(--good);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .status-badge.pending {
        border-color: rgba(255, 197, 108, 0.42);
        background: rgba(255, 197, 108, 0.1);
        color: var(--ochre-300);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .metric {
        min-height: 138px;
        padding: 16px;
      }

      .metric span {
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
        text-transform: uppercase;
      }

      .metric strong {
        display: block;
        margin-top: 18px;
        font-family: var(--font-display);
        font-size: clamp(30px, 4vw, 48px);
        line-height: 0.9;
      }

      .metric small {
        display: block;
        margin-top: 12px;
        color: var(--frost-64);
      }

      .work-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(320px, 0.72fr);
        gap: 22px;
      }

      .panel {
        padding: 18px;
      }

      .access-grid {
        display: grid;
        grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
        gap: 14px;
      }

      .access-panel {
        display: grid;
        gap: 12px;
      }

      .access-matrix {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .access-cell {
        min-height: 88px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
      }

      .access-cell span {
        display: block;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
        text-transform: uppercase;
      }

      .access-cell strong {
        display: block;
        margin-top: 10px;
        overflow-wrap: anywhere;
        font-family: var(--font-display);
        font-size: 18px;
      }

      .access-pulse {
        position: relative;
        min-height: 210px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background:
          linear-gradient(145deg, rgba(47, 100, 255, 0.18), rgba(216, 138, 29, 0.14)),
          rgba(247, 251, 255, 0.07);
      }

      .access-pulse::before {
        position: absolute;
        inset: 18px;
        content: "";
        border: 1px solid rgba(255, 197, 108, 0.36);
        transform: skewX(-12deg);
      }

      .access-pulse::after {
        position: absolute;
        left: 12%;
        right: 12%;
        top: 50%;
        height: 2px;
        content: "";
        background: linear-gradient(90deg, transparent, var(--ochre-300), var(--royal-300), transparent);
        animation: scanLine 5.2s ease-in-out infinite;
      }

      .access-pulse-copy {
        position: relative;
        z-index: 1;
        display: grid;
        gap: 10px;
        height: 100%;
        align-content: end;
        padding: 18px;
      }

      .access-pulse-copy strong {
        font-family: var(--font-display);
        font-size: 24px;
      }

      .access-pulse-copy span {
        color: var(--frost-64);
        line-height: 1.5;
      }

      .members-workbench {
        display: grid;
        grid-template-columns: minmax(0, 1.12fr) minmax(340px, 0.88fr);
        gap: 22px;
      }

      .members-panel {
        display: grid;
        gap: 14px;
      }

      .member-list,
      .invitation-list,
      .role-grid,
      .audit-mini {
        display: grid;
        gap: 10px;
      }

      .member-card,
      .invitation-card,
      .invitation-link-card,
      .role-card,
      .audit-card,
      .empty-state {
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
      }

      .member-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        min-height: 86px;
        padding: 13px;
      }

      .member-card strong,
      .invitation-card strong,
      .role-card strong,
      .audit-card strong {
        display: block;
        overflow-wrap: anywhere;
      }

      .member-card span,
      .invitation-card span,
      .role-card span,
      .audit-card span,
      .empty-state span {
        display: block;
        margin-top: 5px;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .member-role-badge {
        display: inline-flex;
        justify-content: center;
        min-width: 92px;
        padding: 8px 10px;
        border: 1px solid rgba(255, 197, 108, 0.42);
        border-radius: var(--radius);
        color: var(--ochre-300);
        background: rgba(216, 138, 29, 0.12);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .member-form {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(130px, 0.42fr) minmax(130px, 0.38fr);
        gap: 10px;
      }

      .member-form .glass-button {
        grid-column: 1 / -1;
      }

      .invitation-panel {
        grid-column: 1 / -1;
      }

      .invitation-form {
        grid-template-columns: minmax(0, 1fr) minmax(150px, 0.34fr) minmax(130px, 0.28fr);
      }

      .invitation-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
        min-height: 92px;
        padding: 13px;
      }

      .invitation-card.pending {
        border-color: rgba(255, 197, 108, 0.38);
        background:
          linear-gradient(135deg, rgba(216, 138, 29, 0.16), rgba(247, 251, 255, 0.08));
      }

      .invitation-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
      }

      .mini-button {
        min-height: 34px;
        padding: 0 10px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
        color: var(--frost-80);
        font-family: var(--font-data);
        font-size: 10px;
        cursor: pointer;
      }

      .mini-button.warn {
        border-color: rgba(255, 107, 107, 0.38);
        color: #ffb0b0;
      }

      .invitation-link-card {
        display: grid;
        gap: 10px;
        padding: 12px;
        background:
          linear-gradient(135deg, rgba(47, 100, 255, 0.2), rgba(216, 138, 29, 0.14)),
          rgba(247, 251, 255, 0.08);
      }

      .copy-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
      }

      .copy-row input {
        min-width: 0;
      }

      .role-card {
        min-height: 74px;
        padding: 12px;
      }

      .audit-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        padding: 12px;
      }

      .audit-card time {
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .empty-state {
        min-height: 86px;
        padding: 14px;
        color: var(--frost-80);
      }

      .jurisdiction-map {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
        margin-top: 16px;
      }

      .country-tile {
        position: relative;
        min-height: 116px;
        overflow: hidden;
        padding: 13px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background:
          linear-gradient(145deg, rgba(47, 100, 255, 0.16), rgba(247, 251, 255, 0.06)),
          rgba(247, 251, 255, 0.07);
      }

      .country-tile::after {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        content: "";
        background: linear-gradient(90deg, var(--royal-500), var(--ochre-500));
        transform-origin: left;
        transform: scaleX(var(--fill, 0.24));
        transition: transform 400ms ease;
      }

      .country-tile.active {
        border-color: rgba(255, 197, 108, 0.48);
        --fill: 0.86;
      }

      .country-tile strong {
        display: block;
        font-family: var(--font-display);
        font-size: 18px;
      }

      .country-tile span {
        display: block;
        margin-top: 10px;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .country-tile small {
        position: absolute;
        right: 12px;
        bottom: 12px;
        color: var(--ochre-300);
        font-family: var(--font-data);
      }

      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        margin-top: 16px;
      }

      .field-block {
        display: grid;
        gap: 7px;
      }

      .field-block label {
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
        text-transform: uppercase;
      }

      .field-block .glass-field,
      .field-block .glass-select {
        width: 100%;
      }

      .range-wrap {
        display: grid;
        grid-column: 1 / -1;
        gap: 8px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
      }

      input[type="range"] {
        width: 100%;
        accent-color: var(--ochre-500);
      }

      .tax-workbench {
        grid-template-columns: minmax(0, 1.08fr) minmax(420px, 0.92fr);
      }

      .tax-simulator-panel,
      .tax-result-panel {
        display: grid;
        gap: 14px;
      }

      .tax-simulator-grid {
        display: grid;
        gap: 12px;
      }

      .tax-section {
        display: grid;
        gap: 12px;
        padding: 13px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(47, 100, 255, 0.12), rgba(216, 138, 29, 0.08)),
          rgba(247, 251, 255, 0.07);
      }

      .tax-section-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
        text-transform: uppercase;
      }

      .tax-input-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .tax-input-grid.two {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .tax-kpi-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .tax-kpi {
        min-height: 96px;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
      }

      .tax-kpi span {
        display: block;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 10px;
        text-transform: uppercase;
      }

      .tax-kpi strong {
        display: block;
        margin-top: 12px;
        overflow-wrap: anywhere;
        font-family: var(--font-display);
        font-size: clamp(22px, 3vw, 34px);
        line-height: 1;
      }

      .tax-mini-grid,
      .tax-line-list,
      .tax-doc-list,
      .tax-warning-list,
      .tax-chain-list {
        display: grid;
        gap: 9px;
      }

      .tax-mini-card,
      .tax-line-card,
      .tax-doc-card,
      .tax-warning-card,
      .tax-chain-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: center;
        min-height: 58px;
        padding: 11px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.075);
      }

      .tax-warning-card {
        align-items: start;
        border-color: rgba(255, 197, 108, 0.32);
        color: var(--ochre-300);
      }

      .tax-doc-card {
        grid-template-columns: auto minmax(0, 1fr);
      }

      .tax-chain-card {
        position: relative;
        overflow: hidden;
      }

      .tax-chain-card::after {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        content: "";
        background: linear-gradient(90deg, var(--royal-500), var(--ochre-500));
        transform-origin: left;
        transform: scaleX(var(--share, 0.1));
      }

      .tax-mini-card strong,
      .tax-line-card strong,
      .tax-doc-card strong,
      .tax-warning-card strong,
      .tax-chain-card strong {
        display: block;
        overflow-wrap: anywhere;
        font-size: 13px;
      }

      .tax-mini-card span,
      .tax-line-card span,
      .tax-doc-card span,
      .tax-warning-card span,
      .tax-chain-card span {
        display: block;
        margin-top: 4px;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .tax-amount {
        color: var(--ochre-300);
        font-family: var(--font-data);
        font-size: 12px;
        text-align: right;
        white-space: nowrap;
      }

      .tax-market-strip {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .tax-status-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 28px;
        padding: 0 9px;
        border: 1px solid rgba(89, 241, 189, 0.34);
        border-radius: var(--radius);
        color: var(--good);
        background: rgba(89, 241, 189, 0.09);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .feed {
        display: grid;
        max-height: 520px;
        overflow: hidden;
      }

      .feed-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        padding: 18px;
        border-bottom: 1px solid var(--line);
        background: rgba(247, 251, 255, 0.06);
      }

      .feed-list {
        display: grid;
        gap: 10px;
        max-height: 432px;
        overflow: auto;
        padding: 14px;
      }

      .feed-item {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 10px;
        align-items: start;
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.07);
      }

      .feed-index {
        color: var(--ochre-300);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .feed-copy strong {
        display: block;
        font-size: 13px;
      }

      .feed-copy span {
        display: block;
        margin-top: 4px;
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .feed-time {
        color: var(--frost-64);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .modules-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
      }

      .module {
        min-height: 176px;
        padding: 16px;
      }

      .module h3 {
        margin: 0;
        font-family: var(--font-display);
        font-size: 18px;
      }

      .module p {
        margin: 12px 0 0;
        color: var(--frost-64);
        line-height: 1.55;
      }

      .module-meter {
        height: 8px;
        margin-top: 20px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(247, 251, 255, 0.1);
      }

      .module-meter span {
        display: block;
        width: var(--meter, 40%);
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--royal-500), var(--ochre-500));
        transition: width 700ms ease;
      }

      .glass-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--line-strong), transparent);
      }

      .session-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 40px;
        max-width: 240px;
        padding: 0 12px;
        overflow: hidden;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.1);
        color: var(--frost-80);
        font-family: var(--font-data);
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
        backdrop-filter: blur(18px) saturate(150%);
      }

      .auth-gate {
        position: fixed;
        inset: 0;
        z-index: 40;
        display: grid;
        place-items: center;
        padding: 22px;
        background:
          linear-gradient(115deg, rgba(5, 9, 29, 0.72), rgba(6, 19, 63, 0.82)),
          repeating-linear-gradient(90deg, rgba(247, 251, 255, 0.05) 0 1px, transparent 1px 70px);
        backdrop-filter: blur(18px) saturate(155%);
      }

      .auth-gate.hidden {
        display: none;
      }

      .auth-card {
        width: min(1040px, 100%);
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(340px, 0.72fr);
        gap: 18px;
        padding: 18px;
        border: 1px solid var(--line-strong);
        border-radius: var(--radius);
        background: linear-gradient(145deg, rgba(247, 251, 255, 0.16), rgba(7, 26, 92, 0.42));
        box-shadow: 0 34px 120px rgba(1, 7, 30, 0.62);
      }

      .auth-story,
      .auth-form-panel {
        min-height: 430px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
        backdrop-filter: blur(24px) saturate(160%);
      }

      .auth-story {
        position: relative;
        display: grid;
        align-content: end;
        gap: 22px;
        overflow: hidden;
        padding: clamp(22px, 4vw, 38px);
      }

      .auth-story::before {
        position: absolute;
        inset: 0;
        content: "";
        background:
          linear-gradient(100deg, rgba(255, 197, 108, 0.22), transparent 34%),
          repeating-linear-gradient(135deg, rgba(142, 180, 255, 0.09) 0 1px, transparent 1px 18px);
      }

      .auth-story > * {
        position: relative;
        z-index: 1;
      }

      .auth-story h2 {
        max-width: 610px;
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(42px, 7vw, 84px);
        line-height: 0.88;
      }

      .auth-story p {
        max-width: 560px;
        margin: 0;
        color: var(--frost-80);
        line-height: 1.65;
      }

      .auth-form-panel {
        display: grid;
        align-content: start;
        gap: 14px;
        padding: 18px;
      }

      .auth-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .auth-tab {
        min-height: 38px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
        color: var(--frost-64);
        cursor: pointer;
      }

      .auth-tab.active {
        border-color: rgba(255, 197, 108, 0.52);
        background: rgba(216, 138, 29, 0.18);
        color: var(--frost);
      }

      .auth-message {
        min-height: 44px;
        padding: 11px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(247, 251, 255, 0.08);
        color: var(--frost-64);
        font-size: 13px;
        line-height: 1.45;
      }

      .auth-message.good {
        border-color: rgba(89, 241, 189, 0.35);
        color: var(--good);
      }

      .auth-message.warn {
        border-color: rgba(255, 197, 108, 0.42);
        color: var(--ochre-300);
      }

      .mobile-brand {
        display: none;
      }

      @keyframes livePulse {
        0% {
          box-shadow: 0 0 0 0 rgba(89, 241, 189, 0.55);
        }
        70% {
          box-shadow: 0 0 0 12px rgba(89, 241, 189, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(89, 241, 189, 0);
        }
      }

      @keyframes sweep {
        from {
          transform: translateX(-9%);
        }
        to {
          transform: translateX(9%);
        }
      }

      @keyframes sigilPulse {
        0%,
        100% {
          opacity: 0.48;
          transform: rotate(45deg) scale(0.92);
        }
        50% {
          opacity: 1;
          transform: rotate(45deg) scale(1.08);
        }
      }

      @keyframes scanLine {
        0%,
        100% {
          transform: translateY(-80px) rotate(-6deg);
          opacity: 0;
        }
        35%,
        60% {
          opacity: 1;
        }
        80% {
          transform: translateY(120px) rotate(-6deg);
          opacity: 0;
        }
      }

      @media (max-width: 1180px) {
        .app-shell {
          grid-template-columns: 1fr;
        }

        .side-rail {
          position: static;
          height: auto;
          padding: 14px;
        }

        .nav-stack {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .rail-footer {
          display: none;
        }

        .hero-grid,
        .work-grid,
        .tax-workbench,
        .members-workbench,
        .access-grid {
          grid-template-columns: 1fr;
        }

        .metrics-grid,
        .modules-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .content {
          padding: 12px;
        }

        .side-rail {
          display: none;
        }

        .mobile-brand {
          display: grid;
          gap: 6px;
          padding: 14px;
          border: 1px solid var(--line);
          border-radius: var(--radius);
          background: rgba(6, 19, 63, 0.68);
          backdrop-filter: blur(22px);
        }

        .mobile-brand strong {
          font-family: var(--font-display);
          font-size: 24px;
        }

        .topbar {
          grid-template-columns: 1fr;
          position: static;
        }

        .top-actions {
          justify-content: stretch;
        }

        .top-actions > * {
          width: 100%;
        }

        .session-chip {
          max-width: none;
          width: 100%;
        }

        .auth-card {
          grid-template-columns: 1fr;
          max-height: calc(100vh - 24px);
          overflow: auto;
        }

        .auth-story,
        .auth-form-panel {
          min-height: auto;
        }

        .hero-panel {
          min-height: 0;
        }

        .hero-strip,
        .metrics-grid,
        .modules-grid,
        .jurisdiction-map,
        .form-grid,
        .tax-input-grid,
        .tax-input-grid.two,
        .tax-kpi-grid,
        .tax-market-strip,
        .member-form,
        .invitation-form,
        .copy-row,
        .access-matrix {
          grid-template-columns: 1fr;
        }

        .hero-title {
          font-size: clamp(42px, 16vw, 64px);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *,
        *::before,
        *::after {
          animation-duration: 1ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 1ms !important;
        }
      }
    </style>
  </head>
  <body>
    <section class="auth-gate" id="auth-gate" aria-label="Acesso Helvok Tax">
      <div class="auth-card">
        <div class="auth-story">
          <span class="eyebrow"><i class="pulse-dot"></i>Supabase Auth conectado</span>
          <h2>Acesso fiscal sem painel genérico.</h2>
          <p>
            Entre para sincronizar sua sessão com o core multi-tenant. O navegador usa apenas chave pública;
            permissões, tenants e memberships continuam protegidos por RLS e pelo Worker.
          </p>
          <div class="auth-message hidden" id="invite-accept-card">
            Link de convite detectado. Entre com o mesmo email convidado e aceite para ativar o acesso no tenant.
            <button class="glass-button primary" id="invite-accept-button" type="button" style="margin-top: 10px; width: 100%;">Aceitar convite</button>
          </div>
          <div class="hero-strip">
            <div class="strip-cell"><span>Auth</span><strong id="auth-health-label">online</strong></div>
            <div class="strip-cell"><span>Core user</span><strong id="auth-core-label">sync</strong></div>
            <div class="strip-cell"><span>Tenant</span><strong id="auth-tenant-label">guarded</strong></div>
          </div>
        </div>
        <form class="auth-form-panel" id="auth-form">
          <div class="panel-title">
            <h2 id="auth-title">Entrar na Helvok Tax</h2>
            <span id="auth-mode-label">login</span>
          </div>
          <div class="auth-tabs" role="tablist" aria-label="Modo de acesso">
            <button class="auth-tab active" type="button" data-auth-mode="login">Entrar</button>
            <button class="auth-tab" type="button" data-auth-mode="signup">Criar acesso</button>
          </div>
          <div class="field-block">
            <label for="auth-name">Nome</label>
            <input id="auth-name" class="glass-field" autocomplete="name" placeholder="Seu nome" />
          </div>
          <div class="field-block">
            <label for="auth-email">Email</label>
            <input id="auth-email" class="glass-field" autocomplete="email" inputmode="email" placeholder="voce@empresa.com" required />
          </div>
          <div class="field-block">
            <label for="auth-password">Senha</label>
            <input id="auth-password" class="glass-field" autocomplete="current-password" type="password" minlength="6" placeholder="minimo 6 caracteres" required />
          </div>
          <button class="glass-button primary" id="auth-submit" type="submit">Entrar</button>
          <button class="glass-button" id="auth-skip" type="button">Ver cockpit sem sessao</button>
          <div class="auth-message" id="auth-message">Use seu email e senha do Supabase Auth. Se criar acesso e o projeto exigir confirmacao, confirme no email antes de entrar.</div>
        </form>
      </div>
    </section>

    <div class="app-shell">
      <aside class="side-rail" aria-label="Navegacao principal">
        <div class="brand">
          <div class="brand-mark">
            <div class="brand-sigil" aria-hidden="true"></div>
            <div class="brand-copy">
              <strong>Helvok Tax</strong>
              <span>global fiscal mesh</span>
            </div>
          </div>
          <div class="env-pill"><span><i class="pulse-dot"></i>Cloudflare live</span><span id="rail-clock">--:--</span></div>
        </div>

        <nav class="nav-stack">
          <a class="nav-button active" href="#dashboard"><span>Dashboard</span><span class="nav-code">D01</span></a>
          <a class="nav-button" href="#usuarios"><span>Usuarios</span><span class="nav-code">USR</span></a>
          <a class="nav-button" href="#empresas"><span>Empresas</span><span class="nav-code">TEN</span></a>
          <a class="nav-button" href="#motor"><span>Motor tributario</span><span class="nav-code">RUL</span></a>
          <a class="nav-button" href="#documentos"><span>Documentos</span><span class="nav-code">DOC</span></a>
          <a class="nav-button" href="#auditoria"><span>Auditoria</span><span class="nav-code">LOG</span></a>
          <a class="nav-button" href="#integracoes"><span>Integracoes</span><span class="nav-code">SDK</span></a>
        </nav>

        <div class="rail-footer">
          <div class="glass-note">
            Painel conectado ao Worker publico. O token admin continua protegido em secret e nao vai para o navegador.
          </div>
          <button class="glass-button" type="button" data-action="pulse">Sincronizar painel</button>
        </div>
      </aside>

      <main class="content" id="dashboard">
        <section class="mobile-brand" aria-label="Marca">
          <strong>Helvok Tax</strong>
          <span><i class="pulse-dot"></i>painel operacional na Cloudflare</span>
        </section>

        <header class="topbar">
          <div class="breadcrumb">
            <span>Tenant</span>
            <strong id="breadcrumb-tenant">helvok-tax-foundation</strong>
            <span>/</span>
            <span>Organizacao</span>
            <strong id="breadcrumb-organization">Helvok Tax</strong>
          </div>
          <div class="top-actions">
            <span class="session-chip" id="session-chip">sessao anonima</span>
            <input class="glass-field" type="search" placeholder="Buscar regra, documento, pais..." />
            <select class="glass-select" aria-label="Ambiente">
              <option>Sandbox</option>
              <option>Production</option>
            </select>
            <button class="glass-button" id="session-button" type="button">Entrar</button>
            <button class="glass-button primary" type="button" data-action="pulse">Executar varredura</button>
          </div>
        </header>

        <section class="hero-grid">
          <article class="hero-panel">
            <div class="hero-content">
              <span class="eyebrow"><i class="pulse-dot"></i>Command center vivo</span>
              <h1 class="hero-title">Helvok <span>Tax</span></h1>
              <p class="hero-subtitle">
                Infraestrutura global de compliance fiscal, preparada para tenants, paises, regras versionadas,
                documentos fiscais, auditoria imutavel e adaptadores por jurisdicao.
              </p>
              <div class="hero-strip" aria-label="Indicadores principais">
                <div class="strip-cell">
                  <span>Runtime</span>
                  <strong id="runtime-label">Workers</strong>
                </div>
                <div class="strip-cell">
                  <span>API</span>
                  <strong id="api-label">v1</strong>
                </div>
                <div class="strip-cell">
                  <span>Atualizacao</span>
                  <strong id="last-sync">agora</strong>
                </div>
              </div>
            </div>
          </article>

          <aside class="status-panel panel">
            <div class="panel-title">
              <h2>Infraestrutura</h2>
              <span id="request-label">polling</span>
            </div>
            <div class="system-row">
              <div><strong>Cloudflare Worker</strong><span id="worker-detail">checando /health</span></div>
              <span class="status-badge" id="worker-status">live</span>
            </div>
            <div class="system-row">
              <div><strong>Supabase</strong><span id="supabase-detail">configuracao protegida</span></div>
              <span class="status-badge pending" id="supabase-status">sync</span>
            </div>
            <div class="system-row">
              <div><strong>Admin API</strong><span>token em secret, sem exposicao no frontend</span></div>
              <span class="status-badge">sealed</span>
            </div>
            <div class="system-row">
              <div><strong>Outbox</strong><span>eventos prontos para filas e workflows</span></div>
              <span class="status-badge">armed</span>
            </div>
          </aside>
        </section>

        <section class="metrics-grid" aria-label="Metricas">
          <article class="metric">
            <span>Tenants ativos</span>
            <strong data-count="1">1</strong>
            <small>Bootstrap real criado pela API admin.</small>
          </article>
          <article class="metric">
            <span>Organizacoes</span>
            <strong data-count="1">1</strong>
            <small>Helvok Tax registrada no tenant foundation.</small>
          </article>
          <article class="metric">
            <span>Audit events</span>
            <strong data-count="2">2</strong>
            <small>tenant.created e organization.created.</small>
          </article>
          <article class="metric">
            <span>Outbox events</span>
            <strong data-count="2">2</strong>
            <small>Base pronta para filas e notificacoes.</small>
          </article>
        </section>

        <section class="access-grid" aria-label="Acesso multi-tenant">
          <article class="panel access-panel">
            <div class="panel-title">
              <h2>Malha de acesso</h2>
              <span id="access-state-label">guarded</span>
            </div>
            <div class="access-matrix">
              <div class="access-cell">
                <span>Usuario core</span>
                <strong id="access-user-label">aguardando login</strong>
              </div>
              <div class="access-cell">
                <span>Role efetiva</span>
                <strong id="access-role-label">sem membership</strong>
              </div>
              <div class="access-cell">
                <span>Tenant ativo</span>
                <strong id="access-tenant-label">convite pendente</strong>
              </div>
              <div class="access-cell">
                <span>Permissoes</span>
                <strong id="access-permission-label">0 permissoes</strong>
              </div>
            </div>
          </article>

          <aside class="panel access-panel">
            <div class="panel-title">
              <h2>Owner operacional</h2>
              <span>RBAC</span>
            </div>
            <div class="access-pulse">
              <div class="access-pulse-copy">
                <strong id="access-pulse-title">Aguardando primeiro owner</strong>
                <span id="access-pulse-caption">
                  Entre com Supabase Auth uma vez; depois a Admin API concede membership no tenant foundation.
                </span>
              </div>
            </div>
          </aside>
        </section>

        <section class="members-workbench" id="usuarios" aria-label="Usuarios, roles e memberships">
          <article class="panel members-panel">
            <div class="panel-title">
              <h2>Usuarios e memberships</h2>
              <span id="members-count-label">aguardando sessao</span>
            </div>
            <div class="member-list" id="members-list">
              <div class="empty-state">
                <strong>Nenhum membership carregado</strong>
                <span>Entre como owner para carregar usuarios, roles e permissoes do tenant.</span>
              </div>
            </div>
          </article>

          <aside class="panel members-panel">
            <div class="panel-title">
              <h2>Conceder acesso</h2>
              <span id="member-action-label">members.manage</span>
            </div>
            <form class="member-form" id="member-form">
              <div class="field-block">
                <label for="member-email">Email do usuario</label>
                <input id="member-email" class="glass-field" type="email" placeholder="usuario@empresa.com" required />
              </div>
              <div class="field-block">
                <label for="member-role">Role</label>
                <select id="member-role" class="glass-select">
                  <option value="viewer">Viewer</option>
                  <option value="auditor">Auditor</option>
                  <option value="developer">Developer</option>
                  <option value="accountant">Accountant</option>
                  <option value="fiscal_manager">Fiscal manager</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div class="field-block">
                <label for="member-status">Status</label>
                <select id="member-status" class="glass-select">
                  <option value="active">Active</option>
                  <option value="invited">Invited</option>
                  <option value="disabled">Disabled</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
              <button class="glass-button primary" type="submit">Salvar membership</button>
            </form>
            <div class="auth-message" id="member-message">O usuario precisa entrar uma vez antes de receber membership.</div>
            <div class="panel-title">
              <h3>Roles disponiveis</h3>
              <span id="roles-count-label">0 roles</span>
            </div>
            <div class="role-grid" id="roles-grid"></div>
            <div class="panel-title">
              <h3>Auditoria de acesso</h3>
              <span id="access-audit-label">0 eventos</span>
            </div>
            <div class="audit-mini" id="membership-audit"></div>
          </aside>

          <article class="panel members-panel invitation-panel">
            <div class="panel-title">
              <h2>Convites de acesso</h2>
              <span id="invitations-count-label">0 pendentes</span>
            </div>
            <form class="member-form invitation-form" id="invitation-form">
              <div class="field-block">
                <label for="invite-email">Email convidado</label>
                <input id="invite-email" class="glass-field" type="email" placeholder="novo@empresa.com" required />
              </div>
              <div class="field-block">
                <label for="invite-role">Role</label>
                <select id="invite-role" class="glass-select">
                  <option value="viewer">Viewer</option>
                  <option value="auditor">Auditor</option>
                  <option value="developer">Developer</option>
                  <option value="accountant">Accountant</option>
                  <option value="fiscal_manager">Fiscal manager</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <div class="field-block">
                <label for="invite-expiry">Expira em</label>
                <select id="invite-expiry" class="glass-select">
                  <option value="3">3 dias</option>
                  <option value="7" selected>7 dias</option>
                  <option value="14">14 dias</option>
                  <option value="30">30 dias</option>
                </select>
              </div>
              <button class="glass-button primary" type="submit">Gerar convite</button>
            </form>
            <div class="auth-message" id="invitation-message">Convites geram um link unico. Envio automatico por email entra na proxima camada transacional.</div>
            <div class="invitation-link-card hidden" id="invitation-link-card">
              <strong>Link de convite gerado</strong>
              <div class="copy-row">
                <input id="invitation-link" class="glass-field" readonly value="" />
                <button class="glass-button" id="copy-invitation-link" type="button">Copiar</button>
              </div>
            </div>
            <div class="invitation-list" id="invitations-list">
              <div class="empty-state">
                <strong>Nenhum convite carregado</strong>
                <span>Os convites pendentes, aceitos, expirados e revogados aparecem aqui.</span>
              </div>
            </div>
          </article>
        </section>

        <section class="work-grid">
          <article class="panel" id="empresas">
            <div class="panel-title">
              <h2>Malha fiscal por jurisdicao</h2>
              <span>adaptadores</span>
            </div>
            <div class="jurisdiction-map" id="jurisdiction-map">
              <div class="country-tile active"><strong>Carregando</strong><span>rule pack global</span><small>...</small></div>
            </div>
          </article>

          <aside class="feed" id="auditoria">
            <div class="feed-head">
              <div class="panel-title">
                <h3>Auditoria viva</h3>
                <span id="feed-sequence">seq 000</span>
              </div>
            </div>
            <div class="feed-list" id="feed-list" aria-live="polite"></div>
          </aside>
        </section>

        <section class="work-grid tax-workbench" id="motor">
          <article class="panel tax-simulator-panel">
            <div class="panel-title">
              <h2>Simulador fiscal operacional</h2>
              <span id="tax-result-status">api edge</span>
            </div>
            <form class="tax-simulator-grid" id="tax-simulator-form">
              <div class="tax-section">
                <div class="tax-section-head"><strong>Operacao</strong><span id="tax-rule-pack">rule pack</span></div>
                <div class="tax-input-grid">
                  <div class="field-block">
                    <label for="tax-origin">Origem</label>
                    <select id="tax-origin" class="glass-select">
                      <option value="BR" selected>Brasil</option>
                    </select>
                  </div>
                  <div class="field-block">
                    <label for="tax-destination">Destino</label>
                    <select id="tax-destination" class="glass-select"></select>
                  </div>
                  <div class="field-block">
                    <label for="tax-incoterm">Incoterm</label>
                    <select id="tax-incoterm" class="glass-select">
                      <option value="DDP" selected>DDP</option>
                      <option value="DAP">DAP</option>
                      <option value="CIF">CIF</option>
                      <option value="FOB">FOB</option>
                      <option value="EXW">EXW</option>
                    </select>
                  </div>
                  <div class="field-block">
                    <label for="tax-operation-type">Tipo</label>
                    <select id="tax-operation-type" class="glass-select">
                      <option value="export_goods" selected>Exportacao de mercadorias</option>
                      <option value="domestic_goods">Venda domestica</option>
                      <option value="marketplace_sale">Marketplace</option>
                      <option value="digital_service">Servico digital</option>
                      <option value="professional_service">Servico profissional</option>
                    </select>
                  </div>
                  <div class="field-block">
                    <label for="tax-customer-type">Cliente</label>
                    <select id="tax-customer-type" class="glass-select">
                      <option value="b2c" selected>B2C</option>
                      <option value="b2b">B2B</option>
                    </select>
                  </div>
                  <div class="field-block">
                    <label for="tax-channel">Canal</label>
                    <select id="tax-channel" class="glass-select">
                      <option value="marketplace" selected>Marketplace</option>
                      <option value="ecommerce">E-commerce proprio</option>
                      <option value="distributor">Distribuidor</option>
                      <option value="erp">ERP/SaaS</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="tax-section">
                <div class="tax-section-head"><strong>Produto e classificacao</strong><span>HS/NCM</span></div>
                <div class="tax-input-grid">
                  <div class="field-block">
                    <label for="tax-item-description">Produto</label>
                    <input id="tax-item-description" class="glass-field" value="Cachaca premium 700ml" />
                  </div>
                  <div class="field-block">
                    <label for="tax-item-category">Categoria</label>
                    <select id="tax-item-category" class="glass-select">
                      <option value="beverage_alcohol" selected>Bebida alcoolica</option>
                      <option value="goods">Mercadoria geral</option>
                      <option value="food">Alimentos</option>
                      <option value="cosmetics">Cosmeticos</option>
                      <option value="digital_product">Produto digital</option>
                      <option value="saas">SaaS</option>
                    </select>
                  </div>
                  <div class="field-block">
                    <label for="tax-ncm">NCM/HS</label>
                    <input id="tax-ncm" class="glass-field" placeholder="2208.40" />
                  </div>
                  <div class="field-block">
                    <label for="tax-quantity">Quantidade</label>
                    <input id="tax-quantity" class="glass-field" type="number" step="1" min="1" value="120" />
                  </div>
                  <div class="field-block">
                    <label for="tax-unit-price">Preco unitario</label>
                    <input id="tax-unit-price" class="glass-field" type="number" step="0.01" min="0" value="45" />
                  </div>
                  <div class="field-block">
                    <label for="tax-unit-cost">Custo unitario</label>
                    <input id="tax-unit-cost" class="glass-field" type="number" step="0.01" min="0" value="22" />
                  </div>
                </div>
              </div>

              <div class="tax-section">
                <div class="tax-section-head"><strong>Logistica, burocracia e canal</strong><span>custo real</span></div>
                <div class="tax-input-grid">
                  <div class="field-block">
                    <label for="tax-packaging-cost">Embalagem</label>
                    <input id="tax-packaging-cost" class="glass-field" type="number" step="0.01" min="0" value="240" />
                  </div>
                  <div class="field-block">
                    <label for="tax-preparation-cost">Preparacao</label>
                    <input id="tax-preparation-cost" class="glass-field" type="number" step="0.01" min="0" value="180" />
                  </div>
                  <div class="field-block">
                    <label for="tax-export-clearance-cost">Despacho origem</label>
                    <input id="tax-export-clearance-cost" class="glass-field" type="number" step="0.01" min="0" value="320" />
                  </div>
                  <div class="field-block">
                    <label for="tax-compliance-cost">Compliance</label>
                    <input id="tax-compliance-cost" class="glass-field" type="number" step="0.01" min="0" value="260" />
                  </div>
                  <div class="field-block">
                    <label for="tax-freight">Frete</label>
                    <input id="tax-freight" class="glass-field" type="number" step="0.01" min="0" value="680" />
                  </div>
                  <div class="field-block">
                    <label for="tax-insurance">Seguro</label>
                    <input id="tax-insurance" class="glass-field" type="number" step="0.01" min="0" value="90" />
                  </div>
                  <div class="field-block">
                    <label for="tax-storage-cost">Armazenagem</label>
                    <input id="tax-storage-cost" class="glass-field" type="number" step="0.01" min="0" value="180" />
                  </div>
                  <div class="field-block">
                    <label for="tax-local-delivery-cost">Last mile</label>
                    <input id="tax-local-delivery-cost" class="glass-field" type="number" step="0.01" min="0" value="140" />
                  </div>
                  <div class="field-block">
                    <label for="tax-marketing-cost">Marketing</label>
                    <input id="tax-marketing-cost" class="glass-field" type="number" step="0.01" min="0" value="300" />
                  </div>
                </div>
              </div>

              <div class="tax-section">
                <div class="tax-section-head"><strong>Impostos, fees e margem</strong><span>percentuais</span></div>
                <div class="tax-input-grid">
                  <div class="field-block">
                    <label for="tax-import-duty-rate">Tarifa %</label>
                    <input id="tax-import-duty-rate" class="glass-field" type="number" step="0.01" min="0" value="8" />
                  </div>
                  <div class="field-block">
                    <label for="tax-excise-rate">Excise %</label>
                    <input id="tax-excise-rate" class="glass-field" type="number" step="0.01" min="0" value="12" />
                  </div>
                  <div class="field-block">
                    <label for="tax-destination-tax-rate">Imposto destino %</label>
                    <input id="tax-destination-tax-rate" class="glass-field" type="number" step="0.01" min="0" placeholder="auto" />
                  </div>
                  <div class="field-block">
                    <label for="tax-payment-fee-rate">Pagamento %</label>
                    <input id="tax-payment-fee-rate" class="glass-field" type="number" step="0.01" min="0" value="3" />
                  </div>
                  <div class="field-block">
                    <label for="tax-marketplace-fee-rate">Marketplace %</label>
                    <input id="tax-marketplace-fee-rate" class="glass-field" type="number" step="0.01" min="0" value="10" />
                  </div>
                  <div class="field-block">
                    <label for="tax-margin-target-rate">Margem alvo %</label>
                    <input id="tax-margin-target-rate" class="glass-field" type="number" step="0.01" min="0" value="38" />
                  </div>
                </div>
              </div>

              <button class="glass-button primary" id="tax-simulate-button" type="submit">Calcular impostos e preco real</button>
            </form>
          </article>

          <aside class="panel tax-result-panel" id="documentos">
            <div class="panel-title">
              <h2>Resultado da simulacao</h2>
              <span id="tax-market-name">aguardando</span>
            </div>
            <div class="tax-market-strip">
              <div class="tax-mini-card"><strong id="tax-currency-label">--</strong><span>Moeda</span></div>
              <div class="tax-mini-card"><strong id="tax-market-tax-label">--</strong><span>Imposto destino</span></div>
              <div class="tax-mini-card"><strong id="tax-source-label">--</strong><span>Fonte</span></div>
            </div>
            <div class="tax-kpi-grid">
              <div class="tax-kpi"><span>Total cliente</span><strong id="tax-customer-total">--</strong></div>
              <div class="tax-kpi"><span>Desembolso vendedor</span><strong id="tax-seller-out">--</strong></div>
              <div class="tax-kpi"><span>Margem estimada</span><strong id="tax-margin">--</strong></div>
              <div class="tax-kpi"><span>Preco unitario alvo</span><strong id="tax-suggested">--</strong></div>
            </div>
            <div class="tax-section">
              <div class="tax-section-head"><strong>Linhas tributarias e fees</strong><span>base x aliquota</span></div>
              <div class="tax-line-list" id="tax-lines">
                <div class="tax-line-card"><strong>Nenhuma simulacao</strong><span>calcule para gerar linhas</span><em class="tax-amount">--</em></div>
              </div>
            </div>
            <div class="tax-section">
              <div class="tax-section-head"><strong>Cadeia de valor</strong><span>origem ao mercado</span></div>
              <div class="tax-chain-list" id="tax-value-chain"></div>
            </div>
            <div class="tax-section">
              <div class="tax-section-head"><strong>Documentos e pendencias</strong><span>pre-emissao</span></div>
              <div class="tax-doc-list" id="tax-docs"></div>
              <div class="tax-warning-list" id="tax-required-data"></div>
            </div>
            <div class="tax-section">
              <div class="tax-section-head"><strong>Alertas</strong><span>compliance</span></div>
              <div class="tax-warning-list" id="tax-warnings"></div>
            </div>
          </aside>
        </section>

        <section class="modules-grid" id="integracoes">
          <article class="module">
            <h3>Shopify</h3>
            <p>Conector preparado para pedidos, clientes, produtos e webhooks fiscais.</p>
            <div class="module-meter"><span style="--meter: 22%;"></span></div>
          </article>
          <article class="module">
            <h3>ERPs</h3>
            <p>Base para importar cadastros, regimes, estabelecimentos e documentos emitidos.</p>
            <div class="module-meter"><span style="--meter: 18%;"></span></div>
          </article>
          <article class="module">
            <h3>SDK publico</h3>
            <p>TypeScript, REST, webhooks e CLI vao nascer sobre o mesmo core versionado.</p>
            <div class="module-meter"><span style="--meter: 14%;"></span></div>
          </article>
        </section>
      </main>
    </div>

    <script>
      const feedSeeds = [
        ["tenant.created", "Tenant foundation confirmado"],
        ["organization.created", "Organizacao Helvok Tax criada"],
        ["worker.health", "Cloudflare Worker respondeu"],
        ["api.version", "Contrato publico v1 sincronizado"],
        ["outbox.ready", "Outbox aguardando filas"],
        ["rule.engine", "Motor tributario em modo preview"],
        ["adapter.br", "Adaptador Brasil priorizado"],
        ["audit.scan", "Auditoria imutavel verificada"]
      ];

      const authStorage = {
        access: "helvok_access_token",
        refresh: "helvok_refresh_token",
        email: "helvok_session_email"
      };

      const authState = {
        mode: "login",
        config: null,
        session: null,
        access: null,
        pendingInviteToken: new URLSearchParams(window.location.search).get("invite") || ""
      };

      const taxState = {
        markets: [],
        rulePackVersion: "",
        currency: "GBP"
      };

      let feedCounter = 0;

      function qs(selector) {
        return document.querySelector(selector);
      }

      function formatTime(date) {
        return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      }

      function setText(selector, value) {
        const node = qs(selector);
        if (node) {
          node.textContent = value;
        }
      }

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      function numberValue(selector) {
        const node = qs(selector);
        if (!node) {
          return 0;
        }
        const value = Number(String(node.value || "0").replace(",", "."));
        return Number.isFinite(value) ? value : 0;
      }

      function textValue(selector) {
        const node = qs(selector);
        return node ? String(node.value || "").trim() : "";
      }

      function formatCurrency(value, currency) {
        try {
          return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: currency || taxState.currency || "USD",
            maximumFractionDigits: 2
          }).format(Number(value || 0));
        } catch {
          return (currency || taxState.currency || "USD") + " " + Number(value || 0).toFixed(2);
        }
      }

      function formatPercent(value) {
        return new Intl.NumberFormat("pt-BR", {
          style: "percent",
          minimumFractionDigits: 1,
          maximumFractionDigits: 1
        }).format(Number(value || 0));
      }

      function findTaxMarket(code) {
        return taxState.markets.find((market) => market.code === code) || null;
      }

      function setAuthMessage(message, tone) {
        const node = qs("#auth-message");
        if (!node) {
          return;
        }
        node.textContent = message;
        node.classList.remove("good", "warn");
        if (tone) {
          node.classList.add(tone);
        }
      }

      function setAuthMode(mode) {
        authState.mode = mode;
        document.querySelectorAll("[data-auth-mode]").forEach((button) => {
          button.classList.toggle("active", button.getAttribute("data-auth-mode") === mode);
        });
        setText("#auth-title", mode === "signup" ? "Criar acesso Helvok Tax" : "Entrar na Helvok Tax");
        setText("#auth-mode-label", mode === "signup" ? "signup" : "login");
        setText("#auth-submit", mode === "signup" ? "Criar acesso" : "Entrar");
        const nameField = qs("#auth-name");
        if (nameField) {
          nameField.closest(".field-block").style.display = mode === "signup" ? "grid" : "none";
        }
      }

      function showAuthGate(show) {
        const gate = qs("#auth-gate");
        if (gate) {
          gate.classList.toggle("hidden", !show);
        }
      }

      function getStoredAccessToken() {
        return window.localStorage.getItem(authStorage.access) || "";
      }

      function storeAuthSession(payload) {
        if (payload && payload.access_token) {
          window.localStorage.setItem(authStorage.access, payload.access_token);
        }
        if (payload && payload.refresh_token) {
          window.localStorage.setItem(authStorage.refresh, payload.refresh_token);
        }
        const email = payload && payload.user && payload.user.email ? payload.user.email : "";
        if (email) {
          window.localStorage.setItem(authStorage.email, email);
        }
      }

      function clearAuthSession() {
        window.localStorage.removeItem(authStorage.access);
        window.localStorage.removeItem(authStorage.refresh);
        window.localStorage.removeItem(authStorage.email);
        authState.session = null;
        authState.access = null;
        setText("#session-chip", "sessao anonima");
        setText("#session-button", "Entrar");
        renderTenantAccess(null);
        showAuthGate(true);
        addFeed("auth.logout", "Sessao local encerrada");
      }

      function setInvitationMessage(message, tone) {
        const node = qs("#invitation-message");
        if (!node) {
          return;
        }
        node.textContent = message;
        node.classList.remove("good", "warn");
        if (tone) {
          node.classList.add(tone);
        }
      }

      function showInvitationLink(url) {
        const card = qs("#invitation-link-card");
        const input = qs("#invitation-link");
        if (input) {
          input.value = url || "";
        }
        if (card) {
          card.classList.toggle("hidden", !url);
        }
      }

      function renderInviteAcceptState() {
        const card = qs("#invite-accept-card");
        if (!card) {
          return;
        }
        card.classList.toggle("hidden", !authState.pendingInviteToken);
        if (authState.pendingInviteToken) {
          setAuthMessage("Link de convite detectado. Entre com o email convidado e aceite o acesso.", null);
        }
      }

      async function getAuthConfig() {
        if (authState.config) {
          return authState.config;
        }

        const response = await fetch("/v1/auth/config", { cache: "no-store" });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Auth config unavailable");
        }
        authState.config = body.auth;
        setText("#auth-health-label", "online");
        return authState.config;
      }

      async function callSupabaseAuth(path, payload) {
        const config = await getAuthConfig();
        const response = await fetch(config.supabase_url + path, {
          method: "POST",
          headers: {
            apikey: config.supabase_publishable_key,
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.msg || body.message || body.error_description || "Supabase Auth rejected the request");
        }
        return body;
      }

      async function syncSession() {
        const accessToken = getStoredAccessToken();
        if (!accessToken) {
          showAuthGate(true);
          return null;
        }

        const response = await fetch("/v1/session/sync", {
          method: "POST",
          headers: {
            authorization: "Bearer " + accessToken
          }
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Session sync failed");
        }
        authState.session = body.session;
        renderSession(body.session);
        return body.session;
      }

      async function loadSession() {
        const accessToken = getStoredAccessToken();
        if (!accessToken) {
          showAuthGate(true);
          return null;
        }

        const response = await fetch("/v1/me", {
          headers: {
            authorization: "Bearer " + accessToken
          },
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Session unavailable");
        }
        authState.session = body.session;
        renderSession(body.session);
        return body.session;
      }

      function getActiveTenantId() {
        if (authState.access && authState.access.tenant && authState.access.tenant.id) {
          return authState.access.tenant.id;
        }

        const session = authState.session;
        const tenants = session && Array.isArray(session.tenants) ? session.tenants : [];
        return tenants.length > 0 && tenants[0].id ? tenants[0].id : "";
      }

      function setMemberMessage(message, tone) {
        const node = qs("#member-message");
        if (!node) {
          return;
        }
        node.textContent = message;
        node.classList.remove("good", "warn");
        if (tone) {
          node.classList.add(tone);
        }
      }

      function renderTenantAccess(access) {
        authState.access = access || null;
        const memberships = access && Array.isArray(access.memberships) ? access.memberships : [];
        const roles = access && Array.isArray(access.roles) ? access.roles : [];
        const invitations = access && Array.isArray(access.invitations) ? access.invitations : [];
        const auditEvents = access && Array.isArray(access.audit_events) ? access.audit_events : [];
        const membersList = qs("#members-list");
        const invitationsList = qs("#invitations-list");
        const rolesGrid = qs("#roles-grid");
        const auditList = qs("#membership-audit");
        const roleSelect = qs("#member-role");
        const inviteRoleSelect = qs("#invite-role");
        const pendingInvitationCount = invitations.filter((invitation) => invitation && invitation.status === "pending").length;

        setText("#members-count-label", memberships.length + " memberships");
        setText("#roles-count-label", roles.length + " roles");
        setText("#invitations-count-label", pendingInvitationCount + " pendentes");
        setText("#access-audit-label", auditEvents.length + " eventos");

        if (membersList) {
          if (memberships.length === 0) {
            membersList.innerHTML =
              '<div class="empty-state"><strong>Nenhum usuario vinculado</strong><span>Conceda uma role para um usuario sincronizado pelo Auth.</span></div>';
          } else {
            membersList.innerHTML = memberships.map((membership) => {
              const user = membership.user || {};
              const role = membership.role || {};
              return (
                '<div class="member-card">' +
                  '<div><strong>' + escapeHtml(user.full_name || user.email || "usuario") + '</strong>' +
                  '<span>' + escapeHtml(user.email || "sem email") + ' / ' + escapeHtml(membership.status || "status") +
                  ' / ' + escapeHtml(membership.scope_type || "tenant") + '</span></div>' +
                  '<span class="member-role-badge">' + escapeHtml(role.role_key || "role") + '</span>' +
                '</div>'
              );
            }).join("");
          }
        }

        if (rolesGrid) {
          rolesGrid.innerHTML = roles.length === 0
            ? '<div class="empty-state"><strong>Roles indisponiveis</strong><span>A sessao precisa de members.manage para carregar roles.</span></div>'
            : roles.map((role) => (
                '<div class="role-card">' +
                  '<strong>' + escapeHtml(role.name || role.role_key) + '</strong>' +
                  '<span>' + escapeHtml(role.role_key) + ' / ' + Number(role.permission_count || 0) + ' permissoes</span>' +
                '</div>'
              )).join("");
        }

        [roleSelect, inviteRoleSelect].forEach((select) => {
          if (select && roles.length > 0) {
            const currentValue = select.value || "viewer";
            select.innerHTML = roles.map((role) => (
              '<option value="' + escapeHtml(role.role_key) + '">' + escapeHtml(role.name || role.role_key) + '</option>'
            )).join("");
            select.value = roles.some((role) => role.role_key === currentValue) ? currentValue : "viewer";
          }
        });

        if (invitationsList) {
          if (invitations.length === 0) {
            invitationsList.innerHTML =
              '<div class="empty-state"><strong>Nenhum convite emitido</strong><span>Gere um link unico para convidar usuarios antes do primeiro login.</span></div>';
          } else {
            invitationsList.innerHTML = invitations.map((invitation) => {
              const role = invitation.role || {};
              const status = invitation.status || "pending";
              const expiresAt = invitation.expires_at
                ? new Date(invitation.expires_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
                : "--";
              const actions = status === "pending"
                ? '<div class="invitation-actions">' +
                    '<button class="mini-button" type="button" data-invitation-action="resend" data-invitation-id="' + escapeHtml(invitation.id) + '">Reenviar link</button>' +
                    '<button class="mini-button warn" type="button" data-invitation-action="revoke" data-invitation-id="' + escapeHtml(invitation.id) + '">Revogar</button>' +
                  '</div>'
                : '<span class="member-role-badge">' + escapeHtml(status) + '</span>';

              return (
                '<div class="invitation-card ' + escapeHtml(status) + '">' +
                  '<div><strong>' + escapeHtml(invitation.email || "email convidado") + '</strong>' +
                  '<span>' + escapeHtml(role.role_key || "role") + ' / ' + escapeHtml(status) + ' / expira ' + escapeHtml(expiresAt) + '</span></div>' +
                  actions +
                '</div>'
              );
            }).join("");
          }
        }

        if (auditList) {
          auditList.innerHTML = auditEvents.length === 0
            ? '<div class="empty-state"><strong>Nenhum evento de acesso</strong><span>Alteracoes futuras aparecem aqui.</span></div>'
            : auditEvents.map((event) => (
                '<div class="audit-card">' +
                  '<div><strong>' + escapeHtml(event.event_type || "membership.event") + '</strong>' +
                  '<span>' + escapeHtml(event.resource_type || "core.membership") + '</span></div>' +
                  '<time>' + escapeHtml(event.created_at ? new Date(event.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--") + '</time>' +
                '</div>'
              )).join("");
        }
      }

      async function loadTenantAccess(tenantId) {
        const accessToken = getStoredAccessToken();
        if (!accessToken || !tenantId) {
          renderTenantAccess(null);
          return null;
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/access", {
          headers: {
            authorization: "Bearer " + accessToken
          },
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Tenant access unavailable");
        }
        renderTenantAccess(body.access);
        addFeed("members.access", "Usuarios e roles sincronizados");
        return body.access;
      }

      function renderSession(session) {
        const user = session && session.user ? session.user : null;
        const email = user && user.email ? user.email : window.localStorage.getItem(authStorage.email);
        const tenantCount = session && session.counts ? Number(session.counts.tenants || 0) : 0;
        const tenants = session && Array.isArray(session.tenants) ? session.tenants : [];
        const organizations = session && Array.isArray(session.organizations) ? session.organizations : [];
        const permissions = session && Array.isArray(session.permissions) ? session.permissions : [];
        const primaryTenant = tenants.length > 0 ? tenants[0] : null;
        const primaryOrganization = organizations.length > 0 ? organizations[0] : null;
        const roleLabels = Array.from(new Set(tenants.map((tenant) => tenant && tenant.role_key).filter(Boolean))).join(", ");
        const tenantLabel = primaryTenant
          ? (primaryTenant.display_name || primaryTenant.legal_name || primaryTenant.slug || "tenant ativo")
          : "convite pendente";
        const organizationLabel = primaryOrganization
          ? (primaryOrganization.trade_name || primaryOrganization.legal_name || "organizacao ativa")
          : "Helvok Tax";

        setText("#session-chip", email ? email + " / tenants " + tenantCount : "perfil sincronizado");
        setText("#session-button", "Sair");
        setText("#auth-core-label", user ? "ready" : "created");
        setText("#auth-tenant-label", tenantCount > 0 ? "linked" : "invite");
        setText("#access-user-label", email || "perfil sincronizado");
        setText("#access-role-label", roleLabels || "sem membership");
        setText("#access-tenant-label", tenantLabel);
        setText("#access-permission-label", permissions.length + " permissoes");
        setText("#access-state-label", tenantCount > 0 ? "linked" : "guarded");
        setText("#access-pulse-title", tenantCount > 0 ? "Owner ligado ao core" : "Aguardando primeiro owner");
        setText(
          "#access-pulse-caption",
          tenantCount > 0
            ? "Sessao autorizada por membership ativo. O painel agora enxerga tenants, organizacoes e permissoes via RLS."
            : "Entre com Supabase Auth uma vez; depois a Admin API concede membership no tenant foundation.",
        );
        setText("#breadcrumb-tenant", primaryTenant && primaryTenant.slug ? primaryTenant.slug : "helvok-tax-foundation");
        setText("#breadcrumb-organization", organizationLabel);
        showAuthGate(false);

        if (tenantCount === 0) {
          addFeed("auth.provisioned", "Usuario autenticado; aguardando membership no tenant");
          renderTenantAccess(null);
        } else {
          addFeed("auth.session", "Sessao ligada ao core multi-tenant");
          if (primaryTenant && primaryTenant.id) {
            loadTenantAccess(primaryTenant.id).catch((error) => {
              setMemberMessage(error instanceof Error ? error.message : "Nao foi possivel carregar usuarios.", "warn");
              addFeed("members.error", "Falha ao carregar memberships");
            });
          }
        }
      }

      async function submitMemberForm(event) {
        event.preventDefault();
        const tenantId = getActiveTenantId();
        const email = qs("#member-email").value.trim().toLowerCase();
        const roleKey = qs("#member-role").value;
        const status = qs("#member-status").value;

        if (!tenantId) {
          setMemberMessage("Sessao sem tenant ativo.", "warn");
          return;
        }

        if (!email) {
          setMemberMessage("Informe o email do usuario.", "warn");
          return;
        }

        const accessToken = getStoredAccessToken();
        if (!accessToken) {
          setMemberMessage("Entre novamente para alterar memberships.", "warn");
          showAuthGate(true);
          return;
        }

        setMemberMessage("Salvando membership no core...", null);

        try {
          const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/memberships", {
            method: "POST",
            headers: {
              authorization: "Bearer " + accessToken,
              "content-type": "application/json"
            },
            body: JSON.stringify({
              email: email,
              role_key: roleKey,
              status: status
            })
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Membership update failed");
          }

          if (body.access) {
            renderTenantAccess(body.access);
          } else {
            await loadTenantAccess(tenantId);
          }

          setMemberMessage("Membership salvo e auditado.", "good");
          addFeed(body.event_type || "membership.updated", email + " / " + roleKey);
          qs("#member-email").value = "";
        } catch (error) {
          setMemberMessage(error instanceof Error ? error.message : "Nao foi possivel salvar membership.", "warn");
          addFeed("members.error", "Falha ao salvar membership");
        }
      }

      async function submitInvitationForm(event) {
        event.preventDefault();
        const tenantId = getActiveTenantId();
        const email = qs("#invite-email").value.trim().toLowerCase();
        const roleKey = qs("#invite-role").value;
        const expiresInDays = Number(qs("#invite-expiry").value || "7");
        const accessToken = getStoredAccessToken();

        if (!tenantId) {
          setInvitationMessage("Sessao sem tenant ativo para convite.", "warn");
          return;
        }

        if (!accessToken) {
          setInvitationMessage("Entre novamente para gerar convites.", "warn");
          showAuthGate(true);
          return;
        }

        setInvitationMessage("Gerando token e registrando convite...", null);

        try {
          const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/invitations", {
            method: "POST",
            headers: {
              authorization: "Bearer " + accessToken,
              "content-type": "application/json"
            },
            body: JSON.stringify({
              email: email,
              role_key: roleKey,
              expires_in_days: expiresInDays
            })
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Invitation creation failed");
          }

          if (body.access) {
            renderTenantAccess(body.access);
          } else {
            await loadTenantAccess(tenantId);
          }

          showInvitationLink(body.invitation_url || "");
          setInvitationMessage("Convite gerado. Copie o link e envie ao usuario convidado.", "good");
          addFeed(body.event_type || "invitation.created", email + " / " + roleKey);
          qs("#invite-email").value = "";
        } catch (error) {
          setInvitationMessage(error instanceof Error ? error.message : "Nao foi possivel gerar convite.", "warn");
          addFeed("invitation.error", "Falha ao gerar convite");
        }
      }

      async function resendInvitation(invitationId) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        const expiresInDays = Number(qs("#invite-expiry").value || "7");
        if (!tenantId || !accessToken) {
          setInvitationMessage("Sessao sem acesso para reenviar convite.", "warn");
          return;
        }

        setInvitationMessage("Rotacionando link do convite...", null);

        try {
          const response = await fetch(
            "/v1/tenants/" + encodeURIComponent(tenantId) + "/invitations/" + encodeURIComponent(invitationId) + "/resend",
            {
              method: "POST",
              headers: {
                authorization: "Bearer " + accessToken,
                "content-type": "application/json"
              },
              body: JSON.stringify({ expires_in_days: expiresInDays })
            }
          );
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Invitation resend failed");
          }
          if (body.access) {
            renderTenantAccess(body.access);
          }
          showInvitationLink(body.invitation_url || "");
          setInvitationMessage("Novo link gerado. O link antigo deixa de funcionar.", "good");
          addFeed(body.event_type || "invitation.resent", "Link de convite rotacionado");
        } catch (error) {
          setInvitationMessage(error instanceof Error ? error.message : "Nao foi possivel reenviar convite.", "warn");
          addFeed("invitation.error", "Falha ao reenviar convite");
        }
      }

      async function revokeInvitation(invitationId) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!tenantId || !accessToken) {
          setInvitationMessage("Sessao sem acesso para revogar convite.", "warn");
          return;
        }

        setInvitationMessage("Revogando convite...", null);

        try {
          const response = await fetch(
            "/v1/tenants/" + encodeURIComponent(tenantId) + "/invitations/" + encodeURIComponent(invitationId) + "/revoke",
            {
              method: "POST",
              headers: {
                authorization: "Bearer " + accessToken
              }
            }
          );
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Invitation revoke failed");
          }
          if (body.access) {
            renderTenantAccess(body.access);
          }
          setInvitationMessage("Convite revogado e auditado.", "good");
          addFeed(body.event_type || "invitation.revoked", "Convite revogado");
        } catch (error) {
          setInvitationMessage(error instanceof Error ? error.message : "Nao foi possivel revogar convite.", "warn");
          addFeed("invitation.error", "Falha ao revogar convite");
        }
      }

      async function acceptPendingInvitation() {
        const accessToken = getStoredAccessToken();
        if (!authState.pendingInviteToken) {
          setAuthMessage("Nenhum convite detectado nesta URL.", "warn");
          return;
        }

        if (!accessToken) {
          showAuthGate(true);
          setAuthMessage("Entre com o email convidado antes de aceitar.", "warn");
          return;
        }

        setAuthMessage("Aceitando convite e criando membership...", null);

        try {
          const response = await fetch("/v1/invitations/accept", {
            method: "POST",
            headers: {
              authorization: "Bearer " + accessToken,
              "content-type": "application/json"
            },
            body: JSON.stringify({ token: authState.pendingInviteToken })
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Invitation accept failed");
          }
          authState.pendingInviteToken = "";
          window.history.replaceState({}, "", window.location.pathname);
          renderInviteAcceptState();
          await syncSession();
          setAuthMessage("Convite aceito. Membership ativo no tenant.", "good");
          addFeed(body.event_type || "invitation.accepted", "Convite aceito e auditado");
        } catch (error) {
          setAuthMessage(error instanceof Error ? error.message : "Nao foi possivel aceitar o convite.", "warn");
          addFeed("invitation.error", "Falha ao aceitar convite");
        }
      }

      function handleInvitationListClick(event) {
        const button = event.target.closest("[data-invitation-action]");
        if (!button) {
          return;
        }

        const invitationId = button.getAttribute("data-invitation-id");
        const action = button.getAttribute("data-invitation-action");
        if (!invitationId) {
          return;
        }

        if (action === "resend") {
          resendInvitation(invitationId);
        }

        if (action === "revoke") {
          revokeInvitation(invitationId);
        }
      }

      async function submitAuthForm(event) {
        event.preventDefault();
        const email = qs("#auth-email").value.trim().toLowerCase();
        const password = qs("#auth-password").value;
        const fullName = qs("#auth-name").value.trim();

        if (!email || !password) {
          setAuthMessage("Informe email e senha para continuar.", "warn");
          return;
        }

        setAuthMessage("Autenticando com Supabase Auth...", null);

        try {
          const payload = authState.mode === "signup"
            ? await callSupabaseAuth("/auth/v1/signup", {
                email: email,
                password: password,
                data: {
                  full_name: fullName || email
                }
              })
            : await callSupabaseAuth("/auth/v1/token?grant_type=password", {
                email: email,
                password: password
              });

          if (!payload.access_token) {
            setAuthMessage("Acesso criado. Se o Supabase exigir confirmacao, confirme no email e depois entre.", "warn");
            addFeed("auth.pending", "Acesso criado aguardando confirmacao");
            return;
          }

          storeAuthSession(payload);
          await syncSession();
          if (authState.pendingInviteToken) {
            await acceptPendingInvitation();
          } else {
            setAuthMessage("Sessao sincronizada com o core Helvok Tax.", "good");
          }
        } catch (error) {
          setAuthMessage(error instanceof Error ? error.message : "Nao foi possivel autenticar.", "warn");
          addFeed("auth.error", "Falha na autenticacao ou sincronizacao");
        }
      }

      function renderJurisdictionMap(markets) {
        const map = qs("#jurisdiction-map");
        if (!map) {
          return;
        }
        if (!markets || markets.length === 0) {
          map.innerHTML = '<div class="country-tile active"><strong>Sem mercados</strong><span>API indisponivel</span><small>hold</small></div>';
          return;
        }

        map.innerHTML = markets.map((market) => {
          const active = ["BR", "GB", "US", "CA", "SG", "JP"].includes(market.code) ? " active" : "";
          const fill = market.sourceStatus === "official-seed" ? "0.86" : market.sourceStatus === "manual-required" ? "0.34" : "0.58";
          const rateLabel = market.standardRate > 0 ? formatPercent(market.standardRate) : "manual";
          return (
            '<div class="country-tile' + active + '" style="--fill: ' + fill + ';">' +
              '<strong>' + escapeHtml(market.name) + '</strong>' +
              '<span>' + escapeHtml(market.indirectTaxName) + ' / ' + escapeHtml(market.eInvoiceStatus) + '</span>' +
              '<small>' + escapeHtml(rateLabel) + '</small>' +
            '</div>'
          );
        }).join("");
      }

      function populateMarketSelects(markets) {
        const origin = qs("#tax-origin");
        const destination = qs("#tax-destination");
        if (!origin || !destination) {
          return;
        }

        const options = markets.map((market) => (
          '<option value="' + escapeHtml(market.code) + '">' + escapeHtml(market.name) + ' / ' + escapeHtml(market.currency) + '</option>'
        )).join("");
        origin.innerHTML = options;
        destination.innerHTML = options;
        origin.value = markets.some((market) => market.code === "BR") ? "BR" : (markets[0] && markets[0].code ? markets[0].code : "");
        destination.value = markets.some((market) => market.code === "GB") ? "GB" : (markets[0] && markets[0].code ? markets[0].code : "");
      }

      async function loadTaxMarkets() {
        try {
          const response = await fetch("/v1/tax/markets", { cache: "no-store" });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Tax markets unavailable");
          }
          taxState.markets = Array.isArray(body.markets) ? body.markets : [];
          taxState.rulePackVersion = body.rule_pack_version || "";
          renderJurisdictionMap(taxState.markets);
          populateMarketSelects(taxState.markets);
          setText("#tax-rule-pack", taxState.rulePackVersion || "rule pack");
          addFeed("tax.markets", String(taxState.markets.length) + " mercados de exportacao carregados");
          await runTaxSimulation();
        } catch (error) {
          setText("#tax-result-status", "offline");
          addFeed("tax.markets.error", "Nao foi possivel carregar mercados fiscais");
        }
      }

      function collectTaxPayload() {
        const destinationCode = textValue("#tax-destination") || "GB";
        const market = findTaxMarket(destinationCode);
        const destinationTaxOverride = textValue("#tax-destination-tax-rate");
        const ncm = textValue("#tax-ncm");
        const payload = {
          origin_country: textValue("#tax-origin") || "BR",
          destination_country: destinationCode,
          currency: market && market.currency ? market.currency : taxState.currency,
          operation_type: textValue("#tax-operation-type") || "export_goods",
          customer_type: textValue("#tax-customer-type") || "b2c",
          incoterm: textValue("#tax-incoterm") || "DDP",
          channel: textValue("#tax-channel") || "marketplace",
          ncm: ncm,
          hs_code: ncm,
          items: [
            {
              description: textValue("#tax-item-description") || "Produto exportado",
              category: textValue("#tax-item-category") || "goods",
              quantity: numberValue("#tax-quantity"),
              unit_price: numberValue("#tax-unit-price"),
              unit_cost: numberValue("#tax-unit-cost")
            }
          ],
          freight: numberValue("#tax-freight"),
          insurance: numberValue("#tax-insurance"),
          packaging_cost: numberValue("#tax-packaging-cost"),
          preparation_cost: numberValue("#tax-preparation-cost"),
          export_clearance_cost: numberValue("#tax-export-clearance-cost"),
          compliance_cost: numberValue("#tax-compliance-cost"),
          storage_cost: numberValue("#tax-storage-cost"),
          local_delivery_cost: numberValue("#tax-local-delivery-cost"),
          marketing_cost: numberValue("#tax-marketing-cost"),
          import_duty_rate: numberValue("#tax-import-duty-rate"),
          excise_rate: numberValue("#tax-excise-rate"),
          payment_fee_rate: numberValue("#tax-payment-fee-rate"),
          marketplace_fee_rate: numberValue("#tax-marketplace-fee-rate"),
          margin_target_rate: numberValue("#tax-margin-target-rate")
        };

        if (destinationTaxOverride !== "") {
          payload.destination_tax_rate = numberValue("#tax-destination-tax-rate");
        }

        return payload;
      }

      async function runTaxSimulation(event) {
        if (event) {
          event.preventDefault();
        }

        const button = qs("#tax-simulate-button");
        if (button) {
          button.disabled = true;
          button.textContent = "Calculando no Worker...";
        }
        setText("#tax-result-status", "calculando");

        try {
          const response = await fetch("/v1/tax/simulate", {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify(collectTaxPayload())
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Tax simulation failed");
          }
          renderTaxSimulation(body.simulation);
          addFeed(body.event_type || "tax.simulation.completed", "Custo total e impostos recalculados");
        } catch (error) {
          setText("#tax-result-status", "erro");
          const warnings = qs("#tax-warnings");
          if (warnings) {
            warnings.innerHTML = '<div class="tax-warning-card"><strong>Falha na simulacao</strong><span>' + escapeHtml(error instanceof Error ? error.message : "Erro desconhecido") + '</span></div>';
          }
          addFeed("tax.simulation.error", "Falha ao calcular impostos");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Calcular impostos e preco real";
          }
        }
      }

      function renderTaxSimulation(simulation) {
        if (!simulation || !simulation.totals) {
          return;
        }
        const totals = simulation.totals;
        const market = simulation.market || {};
        const snapshot = simulation.input_snapshot || {};
        const currency = snapshot.currency || market.currency || taxState.currency || "USD";
        taxState.currency = currency;

        setText("#tax-result-status", "estimativa viva");
        setText("#tax-rule-pack", simulation.rule_pack_version || taxState.rulePackVersion || "rule pack");
        setText("#tax-market-name", (market.name || "mercado") + " / " + (snapshot.incoterm || "incoterm"));
        setText("#tax-currency-label", currency);
        setText("#tax-market-tax-label", (market.indirectTaxName || "Tax") + " " + formatPercent(market.standardRate || 0));
        setText("#tax-source-label", market.sourceStatus || "seed");
        setText("#tax-customer-total", formatCurrency(totals.customer_total, currency));
        setText("#tax-seller-out", formatCurrency(totals.seller_cash_out, currency));
        setText("#tax-margin", formatCurrency(totals.seller_gross_margin, currency) + " / " + formatPercent(totals.seller_gross_margin_rate));
        setText("#tax-suggested", formatCurrency(totals.suggested_unit_price, currency));

        const lines = qs("#tax-lines");
        if (lines) {
          lines.innerHTML = (simulation.tax_lines || []).map((line) => (
            '<div class="tax-line-card">' +
              '<div><strong>' + escapeHtml(line.label) + '</strong>' +
              '<span>base ' + escapeHtml(formatCurrency(line.base_amount, currency)) + ' / ' + escapeHtml(formatPercent(line.rate)) + ' / pagador ' + escapeHtml(line.payer) + '</span></div>' +
              '<em class="tax-amount">' + escapeHtml(formatCurrency(line.amount, currency)) + '</em>' +
            '</div>'
          )).join("");
        }

        const chain = qs("#tax-value-chain");
        if (chain) {
          chain.innerHTML = (simulation.value_chain || []).map((stage) => {
            const share = Math.min(1, Math.max(0.04, Number(stage.share || 0)));
            return (
              '<div class="tax-chain-card" style="--share: ' + share.toFixed(2) + ';">' +
                '<div><strong>' + escapeHtml(stage.label) + '</strong>' +
                '<span>' + escapeHtml(stage.status) + ' / ' + escapeHtml(formatPercent(stage.share || 0)) + '</span></div>' +
                '<em class="tax-amount">' + escapeHtml(formatCurrency(stage.amount, currency)) + '</em>' +
              '</div>'
            );
          }).join("");
        }

        const docs = qs("#tax-docs");
        if (docs) {
          docs.innerHTML = (simulation.document_checklist || []).map((doc) => (
            '<div class="tax-doc-card"><span class="tax-status-pill">ok</span><div><strong>' + escapeHtml(doc) + '</strong><span>checklist operacional</span></div></div>'
          )).join("");
        }

        const required = qs("#tax-required-data");
        if (required) {
          required.innerHTML = (simulation.next_required_data || []).map((item) => (
            '<div class="tax-warning-card"><strong>' + escapeHtml(item) + '</strong><span>dado requerido para homologacao/precisao</span></div>'
          )).join("");
        }

        const warnings = qs("#tax-warnings");
        if (warnings) {
          warnings.innerHTML = (simulation.warnings || []).map((warning) => (
            '<div class="tax-warning-card"><strong>Alerta fiscal</strong><span>' + escapeHtml(warning) + '</span></div>'
          )).join("");
        }
      }

      function addFeed(kind, label) {
        const list = qs("#feed-list");
        if (!list) {
          return;
        }

        feedCounter += 1;
        const item = document.createElement("div");
        item.className = "feed-item";
        item.innerHTML =
          '<span class="feed-index">#' + String(feedCounter).padStart(3, "0") + '</span>' +
          '<span class="feed-copy"><strong>' + kind + '</strong><span>' + label + '</span></span>' +
          '<span class="feed-time">' + formatTime(new Date()) + '</span>';
        list.prepend(item);

        while (list.children.length > 18) {
          list.removeChild(list.lastElementChild);
        }

        setText("#feed-sequence", "seq " + String(feedCounter).padStart(3, "0"));
      }

      async function refreshStatus() {
        const started = performance.now();
        try {
          const responses = await Promise.all([
            fetch("/health", { cache: "no-store" }).then((response) => response.json()),
            fetch("/v1", { cache: "no-store" }).then((response) => response.json())
          ]);

          const health = responses[0];
          const api = responses[1];
          const latency = Math.max(1, Math.round(performance.now() - started));

          setText("#worker-detail", health.environment + " - " + health.timestamp);
          setText("#worker-status", health.status);
          setText("#supabase-detail", health.checks && health.checks.supabase_configured ? "URL configurada no Worker" : "pendente");
          setText("#supabase-status", health.checks && health.checks.supabase_configured ? "ready" : "hold");
          setText("#runtime-label", api.status === "foundation-ready" ? "Edge" : "Workers");
          setText("#api-label", api.api_version || "v1");
          setText("#request-label", latency + "ms");
          setText("#last-sync", formatTime(new Date()));
          addFeed("system.refresh", "Health e API v1 sincronizados em " + latency + "ms");
        } catch (error) {
          setText("#worker-status", "watch");
          setText("#request-label", "retry");
          addFeed("system.retry", "Aguardando nova leitura da infraestrutura");
        }
      }

      function pulseMetrics() {
        document.querySelectorAll("[data-count]").forEach((node) => {
          const base = Number(node.getAttribute("data-count") || "0");
          node.textContent = String(base);
        });

        document.querySelectorAll(".country-tile").forEach((tile, index) => {
          const value = 0.18 + Math.abs(Math.sin((Date.now() / 1300) + index)) * 0.66;
          tile.style.setProperty("--fill", value.toFixed(2));
        });
      }

      function bootstrapFeed() {
        feedSeeds.forEach((entry, index) => {
          window.setTimeout(() => addFeed(entry[0], entry[1]), 180 * index);
        });
      }

      document.querySelectorAll("[data-action='pulse']").forEach((button) => {
        button.addEventListener("click", () => {
          refreshStatus();
          addFeed("manual.scan", "Varredura solicitada no painel");
        });
      });

      document.querySelectorAll("[data-auth-mode]").forEach((button) => {
        button.addEventListener("click", () => setAuthMode(button.getAttribute("data-auth-mode") || "login"));
      });

      const authForm = qs("#auth-form");
      if (authForm) {
        authForm.addEventListener("submit", submitAuthForm);
      }

      const memberForm = qs("#member-form");
      if (memberForm) {
        memberForm.addEventListener("submit", submitMemberForm);
      }

      const invitationForm = qs("#invitation-form");
      if (invitationForm) {
        invitationForm.addEventListener("submit", submitInvitationForm);
      }

      const taxSimulatorForm = qs("#tax-simulator-form");
      if (taxSimulatorForm) {
        taxSimulatorForm.addEventListener("submit", runTaxSimulation);
      }

      ["#tax-destination", "#tax-origin", "#tax-incoterm", "#tax-operation-type", "#tax-customer-type", "#tax-channel"].forEach((selector) => {
        const node = qs(selector);
        if (node) {
          node.addEventListener("change", () => runTaxSimulation());
        }
      });

      const invitationsList = qs("#invitations-list");
      if (invitationsList) {
        invitationsList.addEventListener("click", handleInvitationListClick);
      }

      const copyInvitationLink = qs("#copy-invitation-link");
      if (copyInvitationLink) {
        copyInvitationLink.addEventListener("click", async () => {
          const input = qs("#invitation-link");
          const link = input ? input.value : "";
          if (!link) {
            return;
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(link);
          } else if (input) {
            input.select();
          }
          setInvitationMessage("Link copiado.", "good");
        });
      }

      const inviteAcceptButton = qs("#invite-accept-button");
      if (inviteAcceptButton) {
        inviteAcceptButton.addEventListener("click", acceptPendingInvitation);
      }

      const authSkip = qs("#auth-skip");
      if (authSkip) {
        authSkip.addEventListener("click", () => {
          showAuthGate(false);
          addFeed("auth.preview", "Cockpit aberto sem sessao");
        });
      }

      const sessionButton = qs("#session-button");
      if (sessionButton) {
        sessionButton.addEventListener("click", () => {
          if (getStoredAccessToken()) {
            clearAuthSession();
          } else {
            showAuthGate(true);
          }
        });
      }

      const confidence = qs("#confidence");
      if (confidence) {
        confidence.addEventListener("input", (event) => {
          setText("#confidence-label", event.target.value + "%");
        });
      }

      window.setInterval(() => {
        setText("#rail-clock", formatTime(new Date()));
        pulseMetrics();
      }, 1000);

      window.setInterval(refreshStatus, 8000);
      bootstrapFeed();
      setAuthMode("login");
      renderInviteAcceptState();
      getAuthConfig().catch(() => setText("#auth-health-label", "offline"));
      loadTaxMarkets();
      loadSession()
        .then(() => {
          if (authState.pendingInviteToken) {
            showAuthGate(true);
            renderInviteAcceptState();
          }
        })
        .catch(() => showAuthGate(true));
      refreshStatus();
    </script>
  </body>
</html>`;
}
