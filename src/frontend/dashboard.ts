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
        --petroleum: #0e3f42;
        --petroleum-950: #082426;
        --petroleum-900: #0b3033;
        --petroleum-800: #0e3f42;
        --petroleum-700: #14565a;
        --petroleum-500: #1e7374;
        --petroleum-300: #73b8b2;
        --midnight: #050713;
        --midnight-900: #080d1b;
        --midnight-800: #10182a;
        --gold: #c89a3d;
        --gold-600: #a97824;
        --gold-500: #c89a3d;
        --gold-300: #f0c875;
        --champagne: #f4e6c8;
        --champagne-80: rgba(244, 230, 200, 0.8);
        --champagne-64: rgba(244, 230, 200, 0.64);
        --champagne-18: rgba(244, 230, 200, 0.18);
        --champagne-10: rgba(244, 230, 200, 0.1);
        --ink: var(--midnight);
        --ink-soft: var(--midnight-800);
        --glass-petroleum: rgba(14, 63, 66, 0.48);
        --glass-midnight: rgba(5, 7, 19, 0.68);
        --line: rgba(244, 230, 200, 0.16);
        --line-strong: rgba(244, 230, 200, 0.28);
        --good: var(--petroleum-300);
        --warn: var(--gold-300);
        --danger: var(--gold-600);
        --shadow: 0 24px 80px rgba(2, 4, 12, 0.56);
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
        color: var(--champagne);
        letter-spacing: 0;
        background:
          linear-gradient(115deg, rgba(14, 63, 66, 0.86), rgba(5, 7, 19, 0.96) 54%, rgba(200, 154, 61, 0.3)),
          radial-gradient(circle at 18% 16%, rgba(30, 115, 116, 0.38), transparent 30%),
          linear-gradient(180deg, var(--petroleum-950) 0%, var(--midnight) 100%);
      }

      body::before {
        position: fixed;
        inset: 0;
        z-index: -2;
        pointer-events: none;
        content: "";
        background-image:
          linear-gradient(rgba(244, 230, 200, 0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(244, 230, 200, 0.045) 1px, transparent 1px);
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
          linear-gradient(100deg, transparent 0%, rgba(115, 184, 178, 0.08) 42%, transparent 62%),
          repeating-linear-gradient(135deg, rgba(240, 200, 117, 0.05) 0 1px, transparent 1px 18px);
        animation: sweep 13s linear infinite;
      }

      ::selection {
        color: var(--ink);
        background: var(--gold-300);
      }

      ::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(5, 7, 19, 0.28);
      }

      ::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, rgba(115, 184, 178, 0.52), rgba(200, 154, 61, 0.72));
        border: 3px solid rgba(5, 7, 19, 0.2);
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
        background: linear-gradient(180deg, rgba(5, 7, 19, 0.76), rgba(14, 63, 66, 0.38));
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
        border: 1px solid rgba(240, 200, 117, 0.42);
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(30, 115, 116, 0.62), rgba(200, 154, 61, 0.36)),
          rgba(244, 230, 200, 0.08);
        box-shadow: 0 18px 34px rgba(2, 4, 12, 0.34);
      }

      .brand-sigil::before,
      .brand-sigil::after {
        position: absolute;
        inset: 8px;
        content: "";
        border: 1px solid rgba(244, 230, 200, 0.44);
        transform: rotate(45deg);
      }

      .brand-sigil::after {
        inset: 15px;
        border-color: rgba(240, 200, 117, 0.72);
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
        color: var(--champagne-64);
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
        background: rgba(244, 230, 200, 0.08);
        color: var(--champagne-80);
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
        box-shadow: 0 0 0 0 rgba(115, 184, 178, 0.6);
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
        color: var(--champagne-64);
        text-decoration: none;
        transition: transform 180ms ease, border-color 180ms ease, background 180ms ease, color 180ms ease;
      }

      .nav-button:hover,
      .nav-button.active {
        border-color: var(--line);
        background: rgba(244, 230, 200, 0.1);
        color: var(--champagne);
        transform: translateX(3px);
      }

      .nav-code {
        color: var(--gold-300);
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
        background: rgba(244, 230, 200, 0.09);
        color: var(--champagne-64);
        font-size: 12px;
        line-height: 1.55;
      }

      .content {
        display: grid;
        gap: 22px;
        padding: 22px;
        align-content: start;
      }

      .app-view {
        display: none;
        gap: 22px;
        min-height: calc(100vh - 118px);
      }

      .app-view.active {
        display: grid;
      }

      .view-head {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 16px;
        align-items: end;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: linear-gradient(135deg, rgba(244, 230, 200, 0.12), rgba(14, 63, 66, 0.3));
        backdrop-filter: blur(24px) saturate(150%);
        box-shadow: var(--shadow);
      }

      .view-head h1 {
        margin: 0;
        font-family: var(--font-display);
        font-size: clamp(28px, 4vw, 52px);
        line-height: 0.95;
      }

      .view-head p {
        max-width: 780px;
        margin: 10px 0 0;
        color: var(--champagne-64);
        line-height: 1.55;
      }

      .view-kicker {
        color: var(--gold-300);
        font-family: var(--font-data);
        font-size: 11px;
        text-transform: uppercase;
      }

      .view-status {
        display: inline-flex;
        min-height: 38px;
        align-items: center;
        justify-content: center;
        padding: 0 12px;
        border: 1px solid rgba(240, 200, 117, 0.42);
        border-radius: var(--radius);
        background: rgba(200, 154, 61, 0.12);
        color: var(--gold-300);
        font-family: var(--font-data);
        font-size: 11px;
        white-space: nowrap;
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
        background: rgba(8, 36, 38, 0.62);
        backdrop-filter: blur(24px) saturate(150%);
        box-shadow: var(--shadow);
      }

      .breadcrumb {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        min-width: 0;
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 12px;
      }

      .breadcrumb strong {
        color: var(--champagne);
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
        background: rgba(244, 230, 200, 0.1);
        color: var(--champagne);
        outline: none;
        backdrop-filter: blur(18px) saturate(150%);
      }

      .glass-field {
        width: min(260px, 100%);
        padding: 0 12px;
      }

      .glass-field::placeholder {
        color: rgba(244, 230, 200, 0.48);
      }

      .glass-select {
        padding: 0 36px 0 12px;
        color: var(--champagne);
        appearance: none;
        background-image:
          linear-gradient(45deg, transparent 50%, var(--gold-300) 50%),
          linear-gradient(135deg, var(--gold-300) 50%, transparent 50%),
          linear-gradient(90deg, rgba(244, 230, 200, 0.16), rgba(244, 230, 200, 0.16));
        background-position:
          calc(100% - 18px) 17px,
          calc(100% - 13px) 17px,
          calc(100% - 34px) 9px;
        background-size: 5px 5px, 5px 5px, 1px 22px;
        background-repeat: no-repeat;
      }

      .glass-select option {
        color: var(--champagne);
        background: var(--petroleum-950);
      }

      .glass-select.select-native-hidden {
        position: absolute;
        width: 1px !important;
        height: 1px;
        min-height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .select-shell {
        position: relative;
        width: 100%;
      }

      .select-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        width: 100%;
        min-height: 40px;
        padding: 0 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(244, 230, 200, 0.16), rgba(14, 63, 66, 0.36)),
          rgba(8, 36, 38, 0.88);
        color: var(--champagne);
        cursor: pointer;
        text-align: left;
        backdrop-filter: blur(18px) saturate(150%);
      }

      .select-trigger::after {
        width: 0;
        height: 0;
        content: "";
        border-left: 5px solid transparent;
        border-right: 5px solid transparent;
        border-top: 6px solid var(--gold-300);
      }

      .select-shell.open .select-trigger {
        border-color: rgba(240, 200, 117, 0.58);
        box-shadow: 0 0 0 3px rgba(200, 154, 61, 0.12);
      }

      .select-panel {
        position: absolute;
        top: calc(100% + 7px);
        right: 0;
        left: 0;
        z-index: 90;
        display: none;
        max-height: 330px;
        overflow-y: auto;
        padding: 6px;
        border: 1px solid rgba(240, 200, 117, 0.36);
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(14, 63, 66, 0.92), rgba(5, 7, 19, 0.96)),
          rgba(8, 36, 38, 0.98);
        color: var(--champagne);
        box-shadow: 0 24px 70px rgba(2, 4, 12, 0.72);
        backdrop-filter: blur(22px) saturate(150%);
      }

      .select-shell.open .select-panel {
        display: grid;
        gap: 3px;
      }

      .select-option {
        display: flex;
        align-items: center;
        min-height: 34px;
        padding: 8px 10px;
        border: 1px solid transparent;
        border-radius: var(--radius);
        background: rgba(244, 230, 200, 0.04);
        color: var(--champagne);
        cursor: pointer;
        font-size: 14px;
        text-align: left;
      }

      .select-option:hover,
      .select-option.active {
        border-color: rgba(240, 200, 117, 0.42);
        background: rgba(200, 154, 61, 0.24);
        color: #fff7df;
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
        border-color: rgba(240, 200, 117, 0.52);
        background: rgba(200, 154, 61, 0.18);
        transform: translateY(-1px);
      }

      .glass-button.primary {
        border-color: rgba(240, 200, 117, 0.58);
        background: linear-gradient(135deg, rgba(200, 154, 61, 0.92), rgba(30, 115, 116, 0.54));
        color: white;
        box-shadow: 0 14px 34px rgba(200, 154, 61, 0.18);
      }

      .panel > .glass-button,
      .member-form > .glass-button,
      .invitation-form > .glass-button,
      .catalog-form > .glass-button,
      .tax-simulator-grid > .glass-button,
      .tax-section > .glass-button {
        margin-top: 10px;
      }

      .tax-section > .glass-button {
        justify-self: start;
        margin-bottom: 8px;
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
        background: linear-gradient(145deg, rgba(244, 230, 200, 0.13), rgba(14, 63, 66, 0.28));
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
          linear-gradient(90deg, rgba(240, 200, 117, 0.24), transparent 18%, transparent 82%, rgba(115, 184, 178, 0.18)),
          repeating-linear-gradient(90deg, transparent 0 64px, rgba(244, 230, 200, 0.08) 65px, transparent 66px);
      }

      .hero-panel::after {
        position: absolute;
        left: -20%;
        right: -20%;
        top: 26%;
        height: 2px;
        content: "";
        background: linear-gradient(90deg, transparent, rgba(240, 200, 117, 0.86), rgba(115, 184, 178, 0.86), transparent);
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
        border: 1px solid rgba(240, 200, 117, 0.34);
        border-radius: var(--radius);
        background: rgba(200, 154, 61, 0.11);
        color: var(--gold-300);
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
        background: linear-gradient(92deg, var(--champagne), var(--petroleum-300), var(--gold-300));
        -webkit-background-clip: text;
        background-clip: text;
      }

      .hero-subtitle {
        max-width: 690px;
        margin: 0;
        color: var(--champagne-80);
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
        background: rgba(244, 230, 200, 0.08);
      }

      .strip-cell span {
        display: block;
        color: var(--champagne-64);
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
        color: var(--champagne-64);
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
        background: rgba(244, 230, 200, 0.08);
      }

      .system-row strong {
        display: block;
        font-size: 14px;
      }

      .system-row span {
        display: block;
        margin-top: 4px;
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 72px;
        padding: 7px 9px;
        border: 1px solid rgba(115, 184, 178, 0.36);
        border-radius: var(--radius);
        background: rgba(115, 184, 178, 0.1);
        color: var(--good);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .status-badge.pending {
        border-color: rgba(240, 200, 117, 0.42);
        background: rgba(240, 200, 117, 0.1);
        color: var(--gold-300);
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
        color: var(--champagne-64);
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
        color: var(--champagne-64);
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
        background: rgba(244, 230, 200, 0.08);
      }

      .access-cell span {
        display: block;
        color: var(--champagne-64);
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
          linear-gradient(145deg, rgba(30, 115, 116, 0.18), rgba(200, 154, 61, 0.14)),
          rgba(244, 230, 200, 0.07);
      }

      .access-pulse::before {
        position: absolute;
        inset: 18px;
        content: "";
        border: 1px solid rgba(240, 200, 117, 0.36);
        transform: skewX(-12deg);
      }

      .access-pulse::after {
        position: absolute;
        left: 12%;
        right: 12%;
        top: 50%;
        height: 2px;
        content: "";
        background: linear-gradient(90deg, transparent, var(--gold-300), var(--petroleum-300), transparent);
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
        color: var(--champagne-64);
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
        background: rgba(244, 230, 200, 0.08);
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
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .member-role-badge {
        display: inline-flex;
        justify-content: center;
        min-width: 92px;
        padding: 8px 10px;
        border: 1px solid rgba(240, 200, 117, 0.42);
        border-radius: var(--radius);
        color: var(--gold-300);
        background: rgba(200, 154, 61, 0.12);
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
        border-color: rgba(240, 200, 117, 0.38);
        background:
          linear-gradient(135deg, rgba(200, 154, 61, 0.16), rgba(244, 230, 200, 0.08));
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
        background: rgba(244, 230, 200, 0.08);
        color: var(--champagne-80);
        font-family: var(--font-data);
        font-size: 10px;
        cursor: pointer;
      }

      .mini-button.warn {
        border-color: rgba(169, 120, 36, 0.38);
        color: var(--gold-300);
      }

      .mini-button.danger {
        border-color: rgba(216, 92, 92, 0.5);
        color: #ffb7a8;
        background: rgba(216, 92, 92, 0.12);
      }

      .invitation-link-card {
        display: grid;
        gap: 10px;
        padding: 12px;
        background:
          linear-gradient(135deg, rgba(30, 115, 116, 0.2), rgba(200, 154, 61, 0.14)),
          rgba(244, 230, 200, 0.08);
      }

      .catalog-workbench {
        display: grid;
        grid-template-columns: minmax(0, 1.15fr) minmax(320px, 0.85fr);
        align-items: start;
        gap: 26px;
        margin-top: 22px;
      }

      .catalog-form {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      .catalog-form .wide-field,
      .catalog-form .glass-button,
      .catalog-message {
        grid-column: 1 / -1;
      }

      .catalog-list {
        display: grid;
        gap: 10px;
        margin-top: 12px;
        max-height: 680px;
        overflow: auto;
        padding-right: 4px;
      }

      .catalog-item-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: start;
        min-height: 108px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(244, 230, 200, 0.1), rgba(8, 36, 38, 0.18)),
          rgba(244, 230, 200, 0.06);
      }

      .catalog-item-card strong {
        display: block;
        color: var(--champagne);
        font-size: 15px;
      }

      .catalog-item-card span {
        display: block;
        margin-top: 4px;
        color: var(--champagne-64);
        font-size: 12px;
        line-height: 1.5;
      }

      .catalog-item-card em {
        justify-self: end;
        min-width: 96px;
        padding: 8px 10px;
        border: 1px solid rgba(240, 200, 117, 0.42);
        border-radius: var(--radius);
        background: rgba(200, 154, 61, 0.12);
        color: var(--gold-300);
        font-family: var(--font-data);
        font-size: 11px;
        font-style: normal;
        text-align: center;
      }

      .catalog-actions {
        grid-column: 1 / -1;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
      }

      .catalog-meta-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-bottom: 12px;
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
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .empty-state {
        min-height: 86px;
        padding: 14px;
        color: var(--champagne-80);
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
          linear-gradient(145deg, rgba(30, 115, 116, 0.16), rgba(244, 230, 200, 0.06)),
          rgba(244, 230, 200, 0.07);
      }

      .country-tile::after {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        content: "";
        background: linear-gradient(90deg, var(--petroleum-500), var(--gold-500));
        transform-origin: left;
        transform: scaleX(var(--fill, 0.24));
        transition: transform 400ms ease;
      }

      .country-tile.active {
        border-color: rgba(240, 200, 117, 0.48);
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
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .country-tile em {
        display: block;
        margin-top: 8px;
        color: var(--champagne-80);
        font-family: var(--font-data);
        font-size: 10px;
        font-style: normal;
      }

      .country-tile small {
        position: absolute;
        right: 12px;
        bottom: 12px;
        color: var(--gold-300);
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
        color: var(--champagne-64);
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
        background: rgba(244, 230, 200, 0.08);
      }

      input[type="range"] {
        width: 100%;
        accent-color: var(--gold-500);
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

      .simulation-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
      }

      .tax-section {
        display: grid;
        gap: 12px;
        padding: 13px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(30, 115, 116, 0.12), rgba(200, 154, 61, 0.08)),
          rgba(244, 230, 200, 0.07);
      }

      .tax-section-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        color: var(--champagne-64);
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
        background: rgba(244, 230, 200, 0.08);
      }

      .tax-kpi span {
        display: block;
        color: var(--champagne-64);
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

      .tax-mini-grid + .glass-button {
        justify-self: start;
        margin-top: 4px;
        margin-bottom: 8px;
      }

      .fiscal-pipeline-action {
        justify-self: start;
        margin-top: 12px;
        margin-bottom: 18px;
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
        background: rgba(244, 230, 200, 0.075);
      }

      .tax-warning-card {
        align-items: start;
        border-color: rgba(240, 200, 117, 0.32);
        color: var(--gold-300);
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
        background: linear-gradient(90deg, var(--petroleum-500), var(--gold-500));
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
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .tax-amount {
        color: var(--gold-300);
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
        border: 1px solid rgba(115, 184, 178, 0.34);
        border-radius: var(--radius);
        color: var(--good);
        background: rgba(115, 184, 178, 0.09);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .market-comparison {
        display: grid;
        gap: 14px;
      }

      .comparison-toolbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 12px;
        align-items: center;
      }

      .comparison-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .comparison-table {
        display: grid;
        gap: 9px;
      }

      .comparison-row {
        display: grid;
        grid-template-columns: minmax(150px, 0.8fr) repeat(5, minmax(92px, 1fr));
        gap: 10px;
        align-items: center;
        min-height: 72px;
        padding: 11px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background:
          linear-gradient(90deg, rgba(30, 115, 116, 0.1), transparent 45%, rgba(200, 154, 61, 0.08)),
          rgba(244, 230, 200, 0.07);
      }

      .comparison-row.header {
        min-height: 42px;
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 10px;
        text-transform: uppercase;
        background: rgba(244, 230, 200, 0.05);
      }

      .comparison-row strong {
        display: block;
        overflow-wrap: anywhere;
      }

      .comparison-row span {
        display: block;
        margin-top: 4px;
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 10px;
      }

      .comparison-value {
        font-family: var(--font-data);
        font-size: 12px;
      }

      .risk-meter {
        position: relative;
        height: 8px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(244, 230, 200, 0.1);
      }

      .risk-meter span {
        display: block;
        width: var(--risk, 30%);
        height: 100%;
        margin: 0;
        background: linear-gradient(90deg, var(--good), var(--gold-500), var(--danger));
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
        background: rgba(244, 230, 200, 0.06);
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
        background: rgba(244, 230, 200, 0.07);
      }

      .feed-index {
        color: var(--gold-300);
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
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 11px;
      }

      .feed-time {
        color: var(--champagne-64);
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
        color: var(--champagne-64);
        line-height: 1.55;
      }

      .module-meter {
        height: 8px;
        margin-top: 20px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(244, 230, 200, 0.1);
      }

      .module-meter span {
        display: block;
        width: var(--meter, 40%);
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--petroleum-500), var(--gold-500));
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
        background: rgba(244, 230, 200, 0.1);
        color: var(--champagne-80);
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
          linear-gradient(115deg, rgba(5, 7, 19, 0.72), rgba(8, 36, 38, 0.82)),
          repeating-linear-gradient(90deg, rgba(244, 230, 200, 0.05) 0 1px, transparent 1px 70px);
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
        background: linear-gradient(145deg, rgba(244, 230, 200, 0.16), rgba(14, 63, 66, 0.42));
        box-shadow: 0 34px 120px rgba(2, 4, 12, 0.62);
      }

      .auth-story,
      .auth-form-panel {
        min-height: 430px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(244, 230, 200, 0.08);
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
          linear-gradient(100deg, rgba(240, 200, 117, 0.22), transparent 34%),
          repeating-linear-gradient(135deg, rgba(115, 184, 178, 0.09) 0 1px, transparent 1px 18px);
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
        color: var(--champagne-80);
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
        background: rgba(244, 230, 200, 0.08);
        color: var(--champagne-64);
        cursor: pointer;
      }

      .auth-tab.active {
        border-color: rgba(240, 200, 117, 0.52);
        background: rgba(200, 154, 61, 0.18);
        color: var(--champagne);
      }

      .auth-message {
        min-height: 44px;
        padding: 11px 12px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background: rgba(244, 230, 200, 0.08);
        color: var(--champagne-64);
        font-size: 13px;
        line-height: 1.45;
      }

      .auth-message.good {
        border-color: rgba(115, 184, 178, 0.35);
        color: var(--good);
      }

      .auth-message.warn {
        border-color: rgba(240, 200, 117, 0.42);
        color: var(--gold-300);
      }

      .mobile-brand {
        display: none;
      }

      @keyframes livePulse {
        0% {
          box-shadow: 0 0 0 0 rgba(115, 184, 178, 0.55);
        }
        70% {
          box-shadow: 0 0 0 12px rgba(115, 184, 178, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(115, 184, 178, 0);
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

        .comparison-table {
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .comparison-row {
          min-width: 920px;
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
          background: rgba(8, 36, 38, 0.68);
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

        .view-head {
          grid-template-columns: 1fr;
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
        .comparison-toolbar,
        .comparison-summary,
        .member-form,
        .invitation-form,
        .catalog-workbench,
        .catalog-form,
        .catalog-meta-grid,
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
            <div class="strip-cell"><span>Core user</span><strong id="auth-core-label">sincronizando</strong></div>
            <div class="strip-cell"><span>Tenant</span><strong id="auth-tenant-label">protegido</strong></div>
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
          <button class="glass-button" id="auth-skip" type="button">Ver cockpit sem sessão</button>
          <div class="auth-message" id="auth-message">Use seu email e senha do Supabase Auth. Se criar acesso e o projeto exigir confirmação, confirme no email antes de entrar.</div>
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
              <span>malha fiscal global</span>
            </div>
          </div>
          <div class="env-pill"><span><i class="pulse-dot"></i>Cloudflare ao vivo</span><span id="rail-clock">--:--</span></div>
        </div>

        <nav class="nav-stack">
          <a class="nav-button active" href="#dashboard"><span>Dashboard</span><span class="nav-code">D01</span></a>
          <a class="nav-button" href="#usuarios"><span>Usuários</span><span class="nav-code">USR</span></a>
          <a class="nav-button" href="#empresas"><span>Empresas</span><span class="nav-code">TEN</span></a>
          <a class="nav-button" href="#produtos"><span>Produtos</span><span class="nav-code">CAT</span></a>
          <a class="nav-button" href="#motor"><span>Motor tributário</span><span class="nav-code">RUL</span></a>
          <a class="nav-button" href="#mercados"><span>Mercados</span><span class="nav-code">EXP</span></a>
          <a class="nav-button" href="#documentos"><span>Documentos</span><span class="nav-code">DOC</span></a>
          <a class="nav-button" href="#auditoria"><span>Auditoria</span><span class="nav-code">LOG</span></a>
          <a class="nav-button" href="#integracoes"><span>Integrações</span><span class="nav-code">SDK</span></a>
        </nav>

        <div class="rail-footer">
          <div class="glass-note">
            Painel conectado ao Worker público. O token admin continua protegido em secret e não vai para o navegador.
          </div>
          <button class="glass-button" type="button" data-action="pulse">Sincronizar painel</button>
        </div>
      </aside>

      <main class="content" id="app-content">
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
            <span class="session-chip" id="session-chip">sessão anônima</span>
            <input class="glass-field" type="search" placeholder="Buscar regra, documento, país..." />
            <select class="glass-select" aria-label="Ambiente">
              <option>Sandbox</option>
              <option>Produção</option>
            </select>
            <button class="glass-button" id="session-button" type="button">Entrar</button>
            <button class="glass-button primary" type="button" data-action="pulse">Executar varredura</button>
          </div>
        </header>

        <section class="app-view active" id="dashboard" data-view="dashboard" aria-label="Dashboard">
        <section class="hero-grid">
          <article class="hero-panel">
            <div class="hero-content">
              <span class="eyebrow"><i class="pulse-dot"></i>Central de comando viva</span>
              <h1 class="hero-title">Helvok <span>Tax</span></h1>
              <p class="hero-subtitle">
                Infraestrutura global de compliance fiscal, preparada para tenants, países, regras versionadas,
                documentos fiscais, auditoria imutável e adaptadores por jurisdição.
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
                  <span>Atualização</span>
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
              <div><strong>Supabase</strong><span id="supabase-detail">configuração protegida</span></div>
              <span class="status-badge pending" id="supabase-status">sincronizando</span>
            </div>
            <div class="system-row">
              <div><strong>Admin API</strong><span>token em secret, sem exposição no frontend</span></div>
              <span class="status-badge">protegido</span>
            </div>
            <div class="system-row">
              <div><strong>Outbox</strong><span>eventos prontos para filas e workflows</span></div>
              <span class="status-badge">pronto</span>
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
              <span id="access-state-label">protegido</span>
            </div>
            <div class="access-matrix">
              <div class="access-cell">
                <span>Usuário core</span>
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
                <span>Permissões</span>
                <strong id="access-permission-label">0 permissões</strong>
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
        </section>

        <section class="app-view" id="usuarios" data-view="usuarios" aria-label="Usuários">
          <div class="view-head">
            <div>
              <span class="view-kicker">Acesso multiempresa</span>
              <h1>Usuários, roles e convites</h1>
              <p>Gerencie memberships, convites e auditoria de acesso sem misturar operação fiscal com administração de identidade.</p>
            </div>
            <span class="view-status" id="users-view-status">RBAC ativo</span>
          </div>
        <section class="members-workbench" aria-label="Usuários, roles e memberships">
          <article class="panel members-panel">
            <div class="panel-title">
              <h2>Usuários e memberships</h2>
              <span id="members-count-label">aguardando sessão</span>
            </div>
            <div class="member-list" id="members-list">
              <div class="empty-state">
                <strong>Nenhum membership carregado</strong>
                <span>Entre como owner para carregar usuários, roles e permissões do tenant.</span>
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
                <label for="member-email">Email do usuário</label>
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
            <div class="auth-message" id="member-message">O usuário precisa entrar uma vez antes de receber membership.</div>
            <div class="panel-title">
              <h3>Roles disponíveis</h3>
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
            <div class="auth-message" id="invitation-message">Convites geram um link único. Envio automático por email entra na próxima camada transacional.</div>
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
        </section>

        <section class="app-view" id="empresas" data-view="empresas" aria-label="Empresas">
          <div class="view-head">
            <div>
              <span class="view-kicker">Cobertura fiscal</span>
              <h1>Malha fiscal por jurisdição</h1>
              <p>Visualize países, regiões, moedas, impostos indiretos e status dos adaptadores antes de simular ou emitir.</p>
            </div>
            <span class="view-status" id="jurisdiction-count-label">carregando mercados</span>
          </div>
        <section class="work-grid">
          <article class="panel">
            <div class="panel-title">
              <h2>Malha fiscal por jurisdição</h2>
              <span>adaptadores</span>
            </div>
            <div class="jurisdiction-map" id="jurisdiction-map">
              <div class="country-tile active"><strong>Carregando</strong><span>pacote de regras global</span><small>...</small></div>
            </div>
          </article>

          <aside class="panel">
            <div class="panel-title">
              <h2>Mapa de cobertura</h2>
              <span>rule pack</span>
            </div>
            <div class="system-row">
              <div><strong>Américas</strong><span>Brasil, América do Norte e América Latina.</span></div>
              <span class="status-badge">ativo</span>
            </div>
            <div class="system-row">
              <div><strong>Europa</strong><span>VAT, OSS/IOSS, eInvoice e regimes locais por país.</span></div>
              <span class="status-badge pending">seed</span>
            </div>
            <div class="system-row">
              <div><strong>Ásia, Oceania e Oriente Médio</strong><span>Mercados preparados para classificação, duty e imposto indireto.</span></div>
              <span class="status-badge pending">seed</span>
            </div>
          </aside>
        </section>
        </section>

        <section class="app-view" id="produtos" data-view="produtos" aria-label="Produtos e serviços">
          <div class="view-head">
            <div>
              <span class="view-kicker">Catálogo fiscal</span>
              <h1>Produtos e serviços</h1>
              <p>Cadastre SKUs, serviços, SaaS, kits, mercadorias e classificações fiscais para alimentar simulações, pedidos e documentos.</p>
            </div>
            <span class="view-status" id="catalog-view-status">aguardando sessão</span>
          </div>
          <section class="catalog-workbench">
            <article class="panel">
              <div class="panel-title">
                <h2>Catálogo do tenant</h2>
                <span id="catalog-count-label">0 itens</span>
              </div>
              <div class="catalog-meta-grid" aria-label="Indicadores do catálogo">
                <div class="tax-mini-card"><strong id="catalog-active-count">0</strong><span>Ativos</span></div>
                <div class="tax-mini-card"><strong id="catalog-service-count">0</strong><span>Serviços e SaaS</span></div>
                <div class="tax-mini-card"><strong id="catalog-goods-count">0</strong><span>Mercadorias</span></div>
              </div>
              <div class="catalog-list" id="catalog-items-list">
                <div class="empty-state">
                  <strong>Nenhum produto carregado</strong>
                  <span>Entre com uma sessão autorizada para carregar o catálogo protegido por tenant.</span>
                </div>
              </div>
            </article>

            <aside class="panel">
              <div class="panel-title">
                <h2>Novo item fiscal</h2>
                <span>products.manage</span>
              </div>
              <form class="catalog-form" id="catalog-item-form">
                <div class="field-block">
                  <label for="catalog-sku">SKU</label>
                  <input id="catalog-sku" class="glass-field" placeholder="CACHAÇA-700ML" required />
                </div>
                <div class="field-block">
                  <label for="catalog-status">Status</label>
                  <select id="catalog-status" class="glass-select">
                    <option value="draft">Rascunho</option>
                    <option value="active" selected>Ativo</option>
                    <option value="inactive">Inativo</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
                <div class="field-block wide-field">
                  <label for="catalog-name">Nome</label>
                  <input id="catalog-name" class="glass-field" placeholder="Cachaça premium 700ml" required />
                </div>
                <div class="field-block">
                  <label for="catalog-kind">Tipo</label>
                  <select id="catalog-kind" class="glass-select">
                    <option value="goods" selected>Mercadoria</option>
                    <option value="service">Serviço</option>
                    <option value="digital_product">Produto digital</option>
                    <option value="saas">SaaS</option>
                    <option value="subscription">Assinatura</option>
                    <option value="license">Licença</option>
                    <option value="kit">Kit</option>
                    <option value="bundle">Combo</option>
                    <option value="rental">Aluguel ou locação</option>
                    <option value="event">Evento ou ingresso</option>
                    <option value="tourism">Turismo e experiência</option>
                    <option value="asset">Ativo</option>
                  </select>
                </div>
                <div class="field-block">
                  <label for="catalog-category">Categoria</label>
                  <select id="catalog-category" class="glass-select">
                    <option value="beverage_alcohol" selected>Bebida alcoólica</option>
                    <option value="beverage_non_alcohol">Bebida não alcoólica</option>
                    <option value="goods">Mercadoria geral</option>
                    <option value="food">Alimentos</option>
                    <option value="cosmetics">Cosméticos</option>
                    <option value="health_product">Saúde, higiene e bem-estar</option>
                    <option value="electronics">Eletrônicos</option>
                    <option value="apparel">Vestuário e acessórios</option>
                    <option value="industrial_product">Produto industrial</option>
                    <option value="raw_material">Matéria-prima</option>
                    <option value="agricultural">Produto agropecuário</option>
                    <option value="handcrafted">Artesanato</option>
                    <option value="kit">Kit, combo ou cesta</option>
                    <option value="marketplace_bundle">Bundle de marketplace</option>
                    <option value="digital_product">Produto digital</option>
                    <option value="saas">SaaS</option>
                    <option value="subscription">Assinatura recorrente</option>
                    <option value="license">Licença</option>
                    <option value="service">Serviço geral</option>
                    <option value="professional_service">Serviço profissional</option>
                    <option value="tourism">Turismo e experiência</option>
                    <option value="accommodation">Hospedagem</option>
                    <option value="event">Evento ou ingresso</option>
                    <option value="rental">Aluguel ou locação</option>
                  </select>
                </div>
                <div class="field-block">
                  <label for="catalog-origin">País de origem</label>
                  <input id="catalog-origin" class="glass-field" maxlength="2" value="BR" />
                </div>
                <div class="field-block">
                  <label for="catalog-ncm">Classificação fiscal HS/NCM</label>
                  <input id="catalog-ncm" class="glass-field" placeholder="2208.40" />
                </div>
                <div class="field-block">
                  <label for="catalog-unit">Unidade</label>
                  <input id="catalog-unit" class="glass-field" value="UN" />
                </div>
                <div class="field-block">
                  <label for="catalog-currency">Moeda</label>
                  <input id="catalog-currency" class="glass-field" value="BRL" />
                </div>
                <div class="field-block">
                  <label for="catalog-price">Preço unitário</label>
                  <input id="catalog-price" class="glass-field" type="number" min="0" step="0.01" value="45" />
                </div>
                <div class="field-block">
                  <label for="catalog-cost">Custo unitário</label>
                  <input id="catalog-cost" class="glass-field" type="number" min="0" step="0.01" value="22" />
                </div>
                <button class="glass-button primary" id="catalog-save-button" type="submit">Salvar produto ou serviço</button>
                <div class="auth-message catalog-message" id="catalog-message">O catálogo usa products.manage e fica isolado por tenant.</div>
              </form>
            </aside>
          </section>
        </section>

        <section class="app-view" id="auditoria" data-view="auditoria" aria-label="Auditoria">
          <div class="view-head">
            <div>
              <span class="view-kicker">Eventos e rastreabilidade</span>
              <h1>Auditoria viva</h1>
              <p>Acompanhe eventos do Worker, sessões, simulações e alterações de acesso em uma tela própria de operação.</p>
            </div>
            <span class="view-status" id="audit-view-status">stream local</span>
          </div>
          <aside class="feed">
            <div class="feed-head">
              <div class="panel-title">
                <h3>Auditoria viva</h3>
                <span id="feed-sequence">seq 000</span>
              </div>
            </div>
            <div class="feed-list" id="feed-list" aria-live="polite"></div>
          </aside>
        </section>

        <section class="app-view" id="motor" data-view="motor" aria-label="Motor tributário">
          <div class="view-head">
            <div>
              <span class="view-kicker">Cálculo e precificação</span>
              <h1>Motor tributário</h1>
              <p>Simule impostos, tarifas, fees, margem e preço real por país sem emitir documento fiscal diretamente pelo frontend.</p>
            </div>
            <span class="view-status" id="motor-view-status">estimativa edge</span>
          </div>
        <section class="work-grid tax-workbench">
          <article class="panel tax-simulator-panel">
            <div class="panel-title">
              <h2>Simulador fiscal operacional</h2>
              <span id="tax-result-status">api edge</span>
            </div>
            <form class="tax-simulator-grid" id="tax-simulator-form" novalidate>
              <div class="tax-section">
                <div class="tax-section-head"><strong>Operação</strong><span id="tax-rule-pack">pacote de regras</span></div>
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
                      <option value="export_goods" selected>Exportação de mercadorias</option>
                      <option value="import_goods">Importação de mercadorias</option>
                      <option value="domestic_goods">Venda doméstica</option>
                      <option value="wholesale_distribution">Distribuição atacadista</option>
                      <option value="cross_border_ecommerce">E-commerce internacional</option>
                      <option value="marketplace_sale">Venda em marketplace</option>
                      <option value="digital_service">Serviço digital</option>
                      <option value="professional_service">Serviço profissional</option>
                      <option value="saas_subscription">Assinatura SaaS</option>
                      <option value="software_license">Licença de software</option>
                      <option value="rental_leasing">Locação ou leasing</option>
                      <option value="event_ticketing">Ingressos e eventos</option>
                      <option value="tourism_experience">Turismo e experiências</option>
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
                      <option value="ecommerce">E-commerce próprio</option>
                      <option value="distributor">Distribuidor</option>
                      <option value="erp">ERP/SaaS</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="tax-section">
                <div class="tax-section-head"><strong>Produto e classificação</strong><span>HS/NCM</span></div>
                <div class="tax-input-grid">
                  <div class="field-block">
                    <label for="tax-item-description">Produto</label>
                    <input id="tax-item-description" class="glass-field" value="Cachaca premium 700ml" />
                  </div>
                  <div class="field-block">
                    <label for="tax-item-category">Categoria</label>
                    <select id="tax-item-category" class="glass-select">
                      <option value="beverage_alcohol" selected>Bebida alcoólica</option>
                      <option value="beverage_non_alcohol">Bebida não alcoólica</option>
                      <option value="goods">Mercadoria geral</option>
                      <option value="food">Alimentos</option>
                      <option value="cosmetics">Cosméticos</option>
                      <option value="health_product">Saúde, higiene e bem-estar</option>
                      <option value="electronics">Eletrônicos</option>
                      <option value="apparel">Vestuário e acessórios</option>
                      <option value="industrial_product">Produto industrial</option>
                      <option value="raw_material">Matéria-prima</option>
                      <option value="agricultural">Produto agropecuário</option>
                      <option value="handcrafted">Artesanato</option>
                      <option value="kit">Kit, combo ou cesta</option>
                      <option value="marketplace_bundle">Bundle de marketplace</option>
                      <option value="digital_product">Produto digital</option>
                      <option value="saas">SaaS</option>
                      <option value="subscription">Assinatura recorrente</option>
                      <option value="license">Licença</option>
                      <option value="service">Serviço geral</option>
                      <option value="professional_service">Serviço profissional</option>
                      <option value="tourism">Turismo e experiência</option>
                      <option value="accommodation">Hospedagem</option>
                      <option value="event">Evento ou ingresso</option>
                      <option value="rental">Aluguel ou locação</option>
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
                    <label for="tax-unit-price">Preço unitário</label>
                    <input id="tax-unit-price" class="glass-field" type="number" step="0.01" min="0" value="45" />
                  </div>
                  <div class="field-block">
                    <label for="tax-unit-cost">Custo unitário</label>
                    <input id="tax-unit-cost" class="glass-field" type="number" step="0.01" min="0" value="22" />
                  </div>
                </div>
              </div>

              <div class="tax-section">
                <div class="tax-section-head"><strong>Logística, burocracia e canal</strong><span>custo real</span></div>
                <div class="tax-input-grid">
                  <div class="field-block">
                    <label for="tax-packaging-cost">Embalagem</label>
                    <input id="tax-packaging-cost" class="glass-field" type="number" step="0.01" min="0" value="240" />
                  </div>
                  <div class="field-block">
                    <label for="tax-preparation-cost">Preparação</label>
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

              <button class="glass-button primary" id="tax-simulate-button" type="button">Calcular impostos e preço real</button>
              <div class="simulation-actions" aria-label="Ações da simulação">
                <button class="mini-button" id="tax-simulation-pdf-button" type="button">PDF da simulação</button>
                <button class="mini-button warn" id="tax-simulation-archive-button" type="button">Arquivar simulação</button>
                <button class="mini-button danger" id="tax-simulation-delete-button" type="button">Excluir simulação</button>
              </div>
            </form>
          </article>
        </section>
        </section>

        <section class="app-view" id="documentos" data-view="documentos" aria-label="Documentos">
          <div class="view-head">
            <div>
              <span class="view-kicker">Pré-emissão e compliance</span>
              <h1>Documentos fiscais globais</h1>
              <p>Crie drafts internacionais a partir da simulação, acompanhe lifecycle e prepare a futura fila de emissão por adaptador governamental.</p>
            </div>
            <span class="view-status" id="documents-view-status">lifecycle global</span>
          </div>
          <section class="work-grid">
            <article class="panel">
              <div class="panel-title">
                <h2>Pipeline fiscal</h2>
                <span id="fiscal-documents-count">0 documentos</span>
              </div>
              <div class="comparison-summary">
                <div class="tax-mini-card"><strong id="fiscal-documents-draft">0</strong><span>Drafts</span></div>
                <div class="tax-mini-card"><strong id="fiscal-documents-queued">0</strong><span>Fila</span></div>
                <div class="tax-mini-card"><strong id="fiscal-documents-authorized">0</strong><span>Autorizados</span></div>
              </div>
              <button class="glass-button primary fiscal-pipeline-action" id="create-fiscal-document-button" type="button">Criar draft fiscal global</button>
              <div class="tax-doc-list" id="fiscal-documents-list">
                <div class="empty-state">
                  <strong>Nenhum documento fiscal criado</strong>
                  <span>Rode uma simulação e crie um draft para iniciar o lifecycle internacional.</span>
                </div>
              </div>
            </article>

          <aside class="panel tax-result-panel">
            <div class="panel-title">
              <h2>Resultado da simulação</h2>
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
              <div class="tax-kpi"><span>Preço unitário alvo</span><strong id="tax-suggested">--</strong></div>
            </div>
            <div class="tax-section">
              <div class="tax-section-head"><strong>Linhas tributárias e fees</strong><span>base x alíquota</span></div>
              <div class="tax-line-list" id="tax-lines">
                <div class="tax-line-card"><strong>Nenhuma simulação</strong><span>calcule para gerar linhas</span><em class="tax-amount">--</em></div>
              </div>
            </div>
            <div class="tax-section">
              <div class="tax-section-head"><strong>Cadeia de valor</strong><span>origem ao mercado</span></div>
              <div class="tax-chain-list" id="tax-value-chain"></div>
            </div>
            <div class="tax-section">
              <div class="tax-section-head"><strong>Documentos e pendências</strong><span>pre-emissão</span></div>
              <div class="tax-doc-list" id="tax-docs"></div>
              <div class="tax-warning-list" id="tax-required-data"></div>
            </div>
            <div class="tax-section">
              <div class="tax-section-head"><strong>Alertas</strong><span>compliance</span></div>
              <div class="tax-warning-list" id="tax-warnings"></div>
            </div>
          </aside>
          </section>
        </section>

        <section class="app-view" id="mercados" data-view="mercados" aria-label="Mercados">
        <section class="panel market-comparison">
          <div class="view-head">
            <div>
              <span class="view-kicker">Exportação e entrada</span>
              <h1>Mercados internacionais</h1>
              <p>Compare destinos, carga operacional, margem estimada e preço unitário alvo a partir do mesmo cenário fiscal.</p>
            </div>
            <span class="view-status" id="markets-view-status">comparador</span>
          </div>
          <div class="comparison-toolbar">
            <div class="panel-title">
              <h2>Mesa de comparação de mercados</h2>
              <span id="tax-compare-status">aguardando simulação</span>
            </div>
            <button class="glass-button primary" id="tax-compare-button" type="button">Comparar mercados</button>
          </div>
          <div class="comparison-summary">
            <div class="tax-mini-card"><strong id="compare-cheapest">--</strong><span>Menor total ao cliente</span></div>
            <div class="tax-mini-card"><strong id="compare-margin">--</strong><span>Melhor margem</span></div>
            <div class="tax-mini-card"><strong id="compare-lowest-load">--</strong><span>Menor carga operacional</span></div>
          </div>
          <div class="comparison-table" id="tax-comparison-table">
            <div class="comparison-row header">
              <span>Mercado</span>
              <span>Total cliente</span>
              <span>Imposto destino</span>
              <span>Margem</span>
              <span>Preço unitário alvo</span>
              <span>Carga operacional</span>
            </div>
            <div class="comparison-row">
              <div><strong>Nenhum comparativo</strong><span>Rode o simulador para comparar destinos</span></div>
              <span class="comparison-value">--</span>
              <span class="comparison-value">--</span>
              <span class="comparison-value">--</span>
              <span class="comparison-value">--</span>
              <div class="risk-meter"><span style="--risk: 0%;"></span></div>
            </div>
          </div>
        </section>
        </section>

        <section class="app-view" id="integracoes" data-view="integracoes" aria-label="Integrações">
          <div class="view-head">
            <div>
              <span class="view-kicker">Conectores e SDK</span>
              <h1>Integrações</h1>
              <p>Organize conectores para e-commerce, ERP, marketplace, pagamentos e SDK público sem parecer uma seção estática de site.</p>
            </div>
            <span class="view-status" id="integrations-view-status">roadmap ativo</span>
          </div>
        <section class="modules-grid">
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
            <h3>SDK público</h3>
            <p>TypeScript, REST, webhooks e CLI vao nascer sobre o mesmo core versionado.</p>
            <div class="module-meter"><span style="--meter: 14%;"></span></div>
          </article>
        </section>
        </section>
      </main>
    </div>

    <script>
      const feedSeeds = [
        ["tenant.created", "Tenant foundation confirmado"],
        ["organization.created", "Organizacao Helvok Tax criada"],
        ["worker.health", "Cloudflare Worker respondeu"],
        ["api.version", "Contrato público v1 sincronizado"],
        ["outbox.pronto", "Outbox aguardando filas"],
        ["rule.engine", "Motor tributário em modo preview"],
        ["adapter.br", "Adaptador Brasil priorizado"],
        ["audit.scan", "Auditoria imutável verificada"]
      ];

      const authStorage = {
        access: "helvok_access_token",
        refresh: "helvok_refresh_token",
        email: "helvok_session_email",
        simulations: "helvok_tax_simulation_archive"
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
        currency: "GBP",
        lastSimulation: null,
        lastComparison: null
      };

      const catalogState = {
        items: [],
        loadedTenantId: ""
      };

      const documentState = {
        documents: [],
        loadedTenantId: ""
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
        setText("#session-chip", "sessão anônima");
        setText("#session-button", "Entrar");
        renderTenantAccess(null);
        renderCatalogItems([]);
        renderFiscalDocuments([]);
        showAuthGate(true);
        addFeed("auth.logout", "Sessão local encerrada");
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
          throw new Error(body && body.error && body.error.message ? body.error.message : "Falha ao sincronizar sessão");
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

      function setCatalogMessage(message, tone) {
        const node = qs("#catalog-message");
        if (!node) {
          return;
        }
        node.textContent = message;
        node.classList.remove("good", "warn");
        if (tone) {
          node.classList.add(tone);
        }
      }

      function renderCatalogItems(items) {
        const list = qs("#catalog-items-list");
        const normalized = Array.isArray(items) ? items : [];
        catalogState.items = normalized;

        const activeCount = normalized.filter((item) => item && item.status === "active").length;
        const serviceCount = normalized.filter((item) => item && ["service", "digital_product", "saas", "subscription", "license"].includes(item.item_kind)).length;
        const goodsCount = normalized.filter((item) => item && ["goods", "kit", "bundle", "asset"].includes(item.item_kind)).length;

        setText("#catalog-count-label", normalized.length + " itens");
        setText("#catalog-active-count", String(activeCount));
        setText("#catalog-service-count", String(serviceCount));
        setText("#catalog-goods-count", String(goodsCount));
        setText("#catalog-view-status", catalogState.loadedTenantId ? "catálogo ativo" : "aguardando sessão");

        if (!list) {
          return;
        }

        if (normalized.length === 0) {
          list.innerHTML =
            '<div class="empty-state"><strong>Nenhum produto cadastrado</strong><span>Crie o primeiro SKU fiscal para alimentar simulações, pedidos e documentos.</span></div>';
          return;
        }

        list.innerHTML = normalized.map((item, index) => {
          const currency = item.currency_code || "BRL";
          const price = formatCurrency(item.unit_price || 0, currency);
          const cost = formatCurrency(item.unit_cost || 0, currency);
          const classification = item.ncm_code || item.hs_code || "HS/NCM pendente";
          const origin = item.country_of_origin || "origem pendente";
          return (
            '<div class="catalog-item-card" data-catalog-index="' + index + '">' +
              '<div><strong>' + escapeHtml(item.name || item.sku || "Item fiscal") + '</strong>' +
              '<span>' + escapeHtml(item.sku || "SKU") + ' / ' + escapeHtml(item.item_kind || "tipo") + ' / ' + escapeHtml(item.category || "categoria") + '</span>' +
              '<span>' + escapeHtml(classification) + ' / origem ' + escapeHtml(origin) + ' / custo ' + escapeHtml(cost) + '</span></div>' +
              '<em>' + escapeHtml(price) + '</em>' +
              '<div class="catalog-actions">' +
                '<button class="mini-button" type="button" data-catalog-action="simulate">Usar no simulador</button>' +
                '<button class="mini-button" type="button" data-catalog-action="pdf">PDF</button>' +
                '<button class="mini-button warn" type="button" data-catalog-action="archive">Arquivar</button>' +
                '<button class="mini-button warn" type="button" data-catalog-action="edit">Editar cadastro</button>' +
                '<button class="mini-button danger" type="button" data-catalog-action="delete">Excluir</button>' +
              '</div>' +
            '</div>'
          );
        }).join("");
      }

      function renderFiscalDocuments(documents) {
        const list = qs("#fiscal-documents-list");
        const normalized = Array.isArray(documents) ? documents : [];
        documentState.documents = normalized;

        const draftCount = normalized.filter((document) => document && document.status === "draft").length;
        const queuedCount = normalized.filter((document) => document && ["queued", "signing", "signed", "sending"].includes(document.status)).length;
        const authorizedCount = normalized.filter((document) => document && document.status === "authorized").length;

        setText("#fiscal-documents-count", normalized.length + " documentos");
        setText("#fiscal-documents-draft", String(draftCount));
        setText("#fiscal-documents-queued", String(queuedCount));
        setText("#fiscal-documents-authorized", String(authorizedCount));

        if (!list) {
          return;
        }

        if (normalized.length === 0) {
          list.innerHTML =
            '<div class="empty-state"><strong>Nenhum documento fiscal criado</strong><span>Crie um draft global antes de assinatura, fila e governo.</span></div>';
          return;
        }

        list.innerHTML = normalized.map((document) => {
          const status = document.status || "draft";
          const amount = formatCurrency(document.total_amount || 0, document.currency_code || "BRL");
          return (
            '<div class="tax-doc-card">' +
              '<span class="tax-status-pill">' + escapeHtml(status) + '</span>' +
              '<div><strong>' + escapeHtml(document.document_type || "DOCUMENT") + ' / ' + escapeHtml(document.country_code || "--") + '</strong>' +
              '<span>' + escapeHtml(document.adapter_key || "adapter") + ' / ' + escapeHtml(document.lifecycle_stage || "draft") + ' / ' + escapeHtml(amount) + '</span></div>' +
            '</div>'
          );
        }).join("");
      }

      async function loadFiscalDocuments(tenantId) {
        const accessToken = getStoredAccessToken();
        if (!accessToken || !tenantId) {
          documentState.loadedTenantId = "";
          renderFiscalDocuments([]);
          return [];
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/documents", {
          headers: {
            authorization: "Bearer " + accessToken
          },
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível carregar documentos fiscais.");
        }

        documentState.loadedTenantId = tenantId;
        renderFiscalDocuments(body.documents || []);
        addFeed("fiscal_documents.loaded", "Documentos fiscais sincronizados");
        return body.documents || [];
      }

      function setFieldValue(selector, value) {
        const node = qs(selector);
        if (node) {
          node.value = value == null ? "" : String(value);
        }
      }

      function setSelectValue(selector, value) {
        const node = qs(selector);
        if (!node) {
          return;
        }
        const stringValue = value == null ? "" : String(value);
        const hasOption = Array.from(node.options || []).some((option) => option.value === stringValue);
        if (hasOption) {
          node.value = stringValue;
          refreshCustomSelect(node);
        }
      }

      function closeCustomSelects(exceptShell) {
        document.querySelectorAll(".select-shell.open").forEach((shell) => {
          if (shell !== exceptShell) {
            shell.classList.remove("open");
            const trigger = shell.querySelector(".select-trigger");
            if (trigger) {
              trigger.setAttribute("aria-expanded", "false");
            }
          }
        });
      }

      function optionLabel(option) {
        return option ? String(option.textContent || option.value || "").trim() : "";
      }

      function refreshCustomSelect(select) {
        if (!select || !select.dataset || !select.dataset.customSelectReady) {
          return;
        }

        const shell = select.nextElementSibling;
        if (!shell || !shell.classList.contains("select-shell")) {
          return;
        }

        const trigger = shell.querySelector(".select-trigger");
        const panel = shell.querySelector(".select-panel");
        const selected = select.options[select.selectedIndex] || select.options[0];

        if (trigger) {
          trigger.querySelector("span").textContent = optionLabel(selected) || "Selecionar";
        }

        if (panel) {
          panel.innerHTML = Array.from(select.options || []).map((option) => (
            '<button class="select-option' + (option.selected ? ' active' : '') + '" type="button" data-value="' +
            escapeHtml(option.value) +
            '">' +
            escapeHtml(optionLabel(option)) +
            '</button>'
          )).join("");
        }
      }

      function initializeCustomSelects() {
        document.querySelectorAll("select.glass-select").forEach((select) => {
          if (select.dataset.customSelectReady) {
            refreshCustomSelect(select);
            return;
          }

          const shell = document.createElement("div");
          shell.className = "select-shell";
          const trigger = document.createElement("button");
          trigger.className = "select-trigger";
          trigger.type = "button";
          trigger.setAttribute("aria-haspopup", "listbox");
          trigger.setAttribute("aria-expanded", "false");
          trigger.innerHTML = '<span></span>';
          const panel = document.createElement("div");
          panel.className = "select-panel";
          panel.setAttribute("role", "listbox");
          shell.appendChild(trigger);
          shell.appendChild(panel);
          select.classList.add("select-native-hidden");
          select.dataset.customSelectReady = "true";
          select.insertAdjacentElement("afterend", shell);

          trigger.addEventListener("click", () => {
            const willOpen = !shell.classList.contains("open");
            closeCustomSelects(shell);
            shell.classList.toggle("open", willOpen);
            trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
          });

          panel.addEventListener("click", (event) => {
            const optionButton = event.target && event.target.closest ? event.target.closest(".select-option") : null;
            if (!optionButton) {
              return;
            }
            select.value = optionButton.getAttribute("data-value") || "";
            select.dispatchEvent(new Event("change", { bubbles: true }));
            refreshCustomSelect(select);
            closeCustomSelects();
          });

          refreshCustomSelect(select);
        });

        if (!window.__helvokCustomSelectListeners) {
          window.__helvokCustomSelectListeners = true;
          document.addEventListener("click", (event) => {
            if (!event.target.closest(".select-shell")) {
              closeCustomSelects();
            }
          });

          document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
              closeCustomSelects();
            }
          });
        }
      }

      function populateCatalogForm(item) {
        if (!item) {
          return;
        }

        setFieldValue("#catalog-sku", item.sku || "");
        setFieldValue("#catalog-name", item.name || "");
        setSelectValue("#catalog-kind", item.item_kind || "goods");
        setSelectValue("#catalog-category", item.category || "goods");
        setFieldValue("#catalog-origin", item.country_of_origin || "BR");
        setFieldValue("#catalog-ncm", item.ncm_code || item.hs_code || "");
        setFieldValue("#catalog-unit", item.unit_code || "UN");
        setFieldValue("#catalog-currency", item.currency_code || "BRL");
        setFieldValue("#catalog-price", item.unit_price || 0);
        setFieldValue("#catalog-cost", item.unit_cost || 0);
        setSelectValue("#catalog-status", item.status || "active");
        setCatalogMessage("Cadastro carregado para edição. Salvar atualiza pelo SKU.", "good");
      }

      function populateTaxSimulatorFromCatalog(item) {
        if (!item) {
          return;
        }

        setFieldValue("#tax-item-description", item.name || item.sku || "Produto exportado");
        setSelectValue("#tax-item-category", item.category || "goods");
        setFieldValue("#tax-ncm", item.ncm_code || item.hs_code || "");
        setFieldValue("#tax-unit-price", item.unit_price || 0);
        setFieldValue("#tax-unit-cost", item.unit_cost || 0);
        setText("#motor-view-status", "catálogo aplicado");
        setCatalogMessage("Produto aplicado ao simulador fiscal.", "good");
        addFeed("catalog.to_simulator", (item.sku || "SKU") + " aplicado ao motor tributário");
        activateView("motor", true);
        runTaxSimulation();
      }

      function catalogPayloadFromItem(item, overrides) {
        const next = Object.assign({}, item || {}, overrides || {});
        return {
          id: next.id,
          sku: next.sku,
          name: next.name,
          item_kind: next.item_kind || "goods",
          category: next.category || "goods",
          country_of_origin: next.country_of_origin || "BR",
          ncm_code: next.ncm_code || next.hs_code || "",
          hs_code: next.hs_code || next.ncm_code || "",
          unit_code: next.unit_code || "UN",
          currency_code: next.currency_code || "BRL",
          unit_price: Number(next.unit_price || 0),
          unit_cost: Number(next.unit_cost || 0),
          status: next.status || "active",
          metadata: Object.assign({}, next.metadata || {}, { source: "helvok-dashboard" })
        };
      }

      function openPrintablePdf(title, rows) {
        const safeTitle = escapeHtml(title || "Helvok Tax");
        const htmlRows = (rows || []).map((row) => (
          "<tr><th>" + escapeHtml(row.label || "") + "</th><td>" + escapeHtml(row.value || "") + "</td></tr>"
        )).join("");
        const html =
          "<!doctype html><html><head><title>" + safeTitle + "</title>" +
          "<style>body{font-family:Arial,sans-serif;margin:32px;color:#132024}h1{font-size:24px;margin:0 0 18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #c9b37a;padding:10px;text-align:left;vertical-align:top}th{width:34%;background:#f4e6c8}small{display:block;margin-top:22px;color:#667}</style>" +
          "</head><body><h1>" + safeTitle + "</h1><table>" + htmlRows + "</table><small>Helvok Tax - documento operacional gerado a partir do painel.</small></body></html>";
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          addFeed("pdf.blocked", "Navegador bloqueou a janela de PDF");
          return;
        }
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }

      function exportCatalogItemPdf(item) {
        if (!item) {
          setCatalogMessage("Selecione um item do catálogo para gerar PDF.", "warn");
          return;
        }

        openPrintablePdf("Ficha fiscal - " + (item.name || item.sku || "Item"), [
          { label: "SKU", value: item.sku || "--" },
          { label: "Nome", value: item.name || "--" },
          { label: "Tipo", value: item.item_kind || "--" },
          { label: "Categoria", value: item.category || "--" },
          { label: "País de origem", value: item.country_of_origin || "--" },
          { label: "Classificação HS/NCM", value: item.ncm_code || item.hs_code || "--" },
          { label: "Preço unitário", value: formatCurrency(item.unit_price || 0, item.currency_code || "BRL") },
          { label: "Custo unitário", value: formatCurrency(item.unit_cost || 0, item.currency_code || "BRL") },
          { label: "Status", value: item.status || "--" }
        ]);
        addFeed("catalog.pdf", (item.sku || "SKU") + " exportado em PDF");
      }

      async function archiveCatalogItem(item) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!item || !tenantId || !accessToken) {
          setCatalogMessage("Entre com uma sessão autorizada para arquivar produtos.", "warn");
          return;
        }

        setCatalogMessage("Arquivando item fiscal...", null);
        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/catalog/items", {
          method: "POST",
          headers: {
            authorization: "Bearer " + accessToken,
            "content-type": "application/json"
          },
          body: JSON.stringify(catalogPayloadFromItem(item, { status: "archived" }))
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível arquivar o item.");
        }

        renderCatalogItems(body.items || catalogState.items.map((current) => current.id === item.id ? Object.assign({}, current, { status: "archived" }) : current));
        setCatalogMessage("Item arquivado e auditado.", "good");
        addFeed(body.event_type || "product.archived", (item.sku || "SKU") + " arquivado");
      }

      async function deleteCatalogItem(item) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!item || !item.id || !tenantId || !accessToken) {
          setCatalogMessage("Este item ainda não possui ID para exclusão.", "warn");
          return;
        }

        if (!window.confirm("Excluir este item do catálogo? Essa ação remove o cadastro do tenant.")) {
          return;
        }

        setCatalogMessage("Excluindo item fiscal...", null);
        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/catalog/items/" + encodeURIComponent(item.id), {
          method: "DELETE",
          headers: {
            authorization: "Bearer " + accessToken
          }
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível excluir o item.");
        }

        renderCatalogItems(body.items || catalogState.items.filter((current) => current.id !== item.id));
        setCatalogMessage("Item excluído e auditado.", "good");
        addFeed(body.event_type || "product.deleted", (item.sku || "SKU") + " excluído");
      }

      function handleCatalogListClick(event) {
        const button = event.target && event.target.closest ? event.target.closest("[data-catalog-action]") : null;
        if (!button) {
          return;
        }

        const card = button.closest("[data-catalog-index]");
        const index = card ? Number(card.getAttribute("data-catalog-index")) : -1;
        const item = Number.isInteger(index) ? catalogState.items[index] : null;

        if (button.getAttribute("data-catalog-action") === "simulate") {
          populateTaxSimulatorFromCatalog(item);
        }

        if (button.getAttribute("data-catalog-action") === "edit") {
          populateCatalogForm(item);
        }

        if (button.getAttribute("data-catalog-action") === "pdf") {
          exportCatalogItemPdf(item);
        }

        if (button.getAttribute("data-catalog-action") === "archive") {
          archiveCatalogItem(item).catch((error) => {
            setCatalogMessage(error instanceof Error ? error.message : "Não foi possível arquivar o item.", "warn");
            addFeed("catalog.archive.error", "Falha ao arquivar item");
          });
        }

        if (button.getAttribute("data-catalog-action") === "delete") {
          deleteCatalogItem(item).catch((error) => {
            setCatalogMessage(error instanceof Error ? error.message : "Não foi possível excluir o item.", "warn");
            addFeed("catalog.delete.error", "Falha ao excluir item");
          });
        }
      }

      async function loadCatalogItems(tenantId) {
        const accessToken = getStoredAccessToken();
        if (!accessToken || !tenantId) {
          catalogState.loadedTenantId = "";
          renderCatalogItems([]);
          return [];
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/catalog/items", {
          headers: {
            authorization: "Bearer " + accessToken
          },
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível carregar o catálogo.");
        }

        catalogState.loadedTenantId = tenantId;
        renderCatalogItems(body.items || []);
        setCatalogMessage("Catálogo sincronizado com o tenant ativo.", "good");
        addFeed("catalog.loaded", "Produtos e serviços sincronizados");
        return body.items || [];
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
              '<div class="empty-state"><strong>Nenhum usuário vinculado</strong><span>Conceda uma role para um usuário sincronizado pelo Auth.</span></div>';
          } else {
            membersList.innerHTML = memberships.map((membership) => {
              const user = membership.user || {};
              const role = membership.role || {};
              return (
                '<div class="member-card">' +
                  '<div><strong>' + escapeHtml(user.full_name || user.email || "usuário") + '</strong>' +
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
            ? '<div class="empty-state"><strong>Roles indisponíveis</strong><span>A sessão precisa de members.manage para carregar roles.</span></div>'
            : roles.map((role) => (
                '<div class="role-card">' +
                  '<strong>' + escapeHtml(role.name || role.role_key) + '</strong>' +
                  '<span>' + escapeHtml(role.role_key) + ' / ' + Number(role.permission_count || 0) + ' permissões</span>' +
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
              '<div class="empty-state"><strong>Nenhum convite emitido</strong><span>Gere um link único para convidar usuários antes do primeiro login.</span></div>';
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
        addFeed("members.access", "Usuários e roles sincronizados");
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
          ? (primaryOrganization.trade_name || primaryOrganization.legal_name || "organização ativa")
          : "Helvok Tax";

        setText("#session-chip", email ? email + " / tenants " + tenantCount : "perfil sincronizado");
        setText("#session-button", "Sair");
        setText("#auth-core-label", user ? "pronto" : "created");
        setText("#auth-tenant-label", tenantCount > 0 ? "linked" : "invite");
        setText("#access-user-label", email || "perfil sincronizado");
        setText("#access-role-label", roleLabels || "sem membership");
        setText("#access-tenant-label", tenantLabel);
        setText("#access-permission-label", permissions.length + " permissões");
        setText("#access-state-label", tenantCount > 0 ? "linked" : "protegido");
        setText("#access-pulse-title", tenantCount > 0 ? "Owner ligado ao core" : "Aguardando primeiro owner");
        setText(
          "#access-pulse-caption",
          tenantCount > 0
            ? "Sessão autorizada por membership ativo. O painel agora enxerga tenants, organizações e permissões via RLS."
            : "Entre com Supabase Auth uma vez; depois a Admin API concede membership no tenant foundation.",
        );
        setText("#breadcrumb-tenant", primaryTenant && primaryTenant.slug ? primaryTenant.slug : "helvok-tax-foundation");
        setText("#breadcrumb-organization", organizationLabel);
        showAuthGate(false);

        if (tenantCount === 0) {
          addFeed("auth.provisioned", "Usuário autenticado; aguardando membership no tenant");
          renderTenantAccess(null);
          renderCatalogItems([]);
          renderFiscalDocuments([]);
        } else {
          addFeed("auth.session", "Sessão ligada ao core multi-tenant");
          if (primaryTenant && primaryTenant.id) {
            loadTenantAccess(primaryTenant.id).catch((error) => {
              setMemberMessage(error instanceof Error ? error.message : "Não foi possível carregar usuários.", "warn");
              addFeed("members.error", "Falha ao carregar memberships");
            });
            loadCatalogItems(primaryTenant.id).catch((error) => {
              setCatalogMessage(error instanceof Error ? error.message : "Não foi possível carregar o catálogo.", "warn");
              addFeed("catalog.error", "Falha ao carregar produtos e serviços");
            });
            loadFiscalDocuments(primaryTenant.id).catch((error) => {
              addFeed("fiscal_documents.error", error instanceof Error ? error.message : "Falha ao carregar documentos fiscais");
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
          setMemberMessage("Sessão sem tenant ativo.", "warn");
          return;
        }

        if (!email) {
          setMemberMessage("Informe o email do usuário.", "warn");
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
          setMemberMessage(error instanceof Error ? error.message : "Não foi possível salvar membership.", "warn");
          addFeed("members.error", "Falha ao salvar membership");
        }
      }

      async function submitCatalogItemForm(event) {
        event.preventDefault();
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();

        if (!tenantId || !accessToken) {
          setCatalogMessage("Entre com uma sessão autorizada para salvar produtos.", "warn");
          showAuthGate(true);
          return;
        }

        const sku = textValue("#catalog-sku");
        const name = textValue("#catalog-name");

        if (!sku || !name) {
          setCatalogMessage("Informe SKU e nome para cadastrar o item fiscal.", "warn");
          return;
        }

        const button = qs("#catalog-save-button");
        if (button) {
          button.disabled = true;
          button.textContent = "Salvando no core...";
        }
        setCatalogMessage("Salvando produto ou serviço no catálogo multi-tenant...", null);

        try {
          const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/catalog/items", {
            method: "POST",
            headers: {
              authorization: "Bearer " + accessToken,
              "content-type": "application/json"
            },
            body: JSON.stringify({
              sku: sku,
              name: name,
              item_kind: textValue("#catalog-kind") || "goods",
              category: textValue("#catalog-category") || "goods",
              country_of_origin: textValue("#catalog-origin") || "BR",
              ncm_code: textValue("#catalog-ncm"),
              hs_code: textValue("#catalog-ncm"),
              unit_code: textValue("#catalog-unit") || "UN",
              currency_code: textValue("#catalog-currency") || "BRL",
              unit_price: numberValue("#catalog-price"),
              unit_cost: numberValue("#catalog-cost"),
              status: textValue("#catalog-status") || "active",
              metadata: {
                source: "helvok-dashboard",
                ready_for_tax_simulation: true
              }
            })
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Catalog item upsert failed");
          }

          renderCatalogItems(body.items || (body.item ? [body.item].concat(catalogState.items) : catalogState.items));
          setCatalogMessage("Produto ou serviço salvo e auditado.", "good");
          addFeed(body.event_type || "product.saved", sku + " salvo no catálogo");
          const form = qs("#catalog-item-form");
          if (form) {
            form.reset();
            qs("#catalog-status").value = "active";
            qs("#catalog-kind").value = "goods";
            qs("#catalog-category").value = "beverage_alcohol";
            qs("#catalog-origin").value = "BR";
            qs("#catalog-unit").value = "UN";
            qs("#catalog-currency").value = "BRL";
            qs("#catalog-price").value = "45";
            qs("#catalog-cost").value = "22";
          }
        } catch (error) {
          setCatalogMessage(error instanceof Error ? error.message : "Não foi possível salvar o item fiscal.", "warn");
          addFeed("catalog.error", "Falha ao salvar produto ou serviço");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Salvar produto ou serviço";
          }
        }
      }

      async function createFiscalDocumentDraft() {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();

        if (!tenantId || !accessToken) {
          showAuthGate(true);
          addFeed("fiscal_document.blocked", "Sessão necessária para criar documento fiscal");
          return;
        }

        const simulation = taxState.lastSimulation;
        const market = simulation && simulation.market ? simulation.market : findTaxMarket(textValue("#tax-destination") || "BR");
        const totals = simulation && simulation.totals ? simulation.totals : {};
        const payload = collectTaxPayload();
        const countryCode = payload.destination_country || "BR";
        const documentType = countryCode === "BR" ? "NFE" : "EINVOICE";
        const adapterKey = countryCode === "BR" ? "adapters/brazil/nfe" : "adapters/global/einvoice";
        const button = qs("#create-fiscal-document-button");

        if (button) {
          button.disabled = true;
          button.textContent = "Criando draft...";
        }

        try {
          const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/documents", {
            method: "POST",
            headers: {
              authorization: "Bearer " + accessToken,
              "content-type": "application/json"
            },
            body: JSON.stringify({
              country_code: countryCode,
              jurisdiction_path: [countryCode],
              document_type: documentType,
              adapter_key: adapterKey,
              operation_type: payload.operation_type || "sale",
              currency_code: payload.currency || (market && market.currency) || "BRL",
              total_amount: totals.customer_total || 0,
              tax_amount: totals.destination_indirect_tax || 0,
              payload: {
                source: "tax_simulator",
                scenario: payload
              },
              calculation_snapshot: simulation || {},
              metadata: {
                source: "helvok-dashboard",
                lifecycle: "global-draft-before-country-adapter",
                market: market ? market.name : countryCode
              }
            })
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Fiscal document draft failed");
          }

          renderFiscalDocuments(body.documents || (body.document ? [body.document].concat(documentState.documents) : documentState.documents));
          setText("#documents-view-status", "draft criado");
          addFeed(body.event_type || "fiscal_document.created", documentType + " draft criado para " + countryCode);
        } catch (error) {
          addFeed("fiscal_document.error", error instanceof Error ? error.message : "Falha ao criar draft fiscal");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Criar draft fiscal global";
          }
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
          setInvitationMessage("Sessão sem tenant ativo para convite.", "warn");
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
          setInvitationMessage("Convite gerado. Copie o link e envie ao usuário convidado.", "good");
          addFeed(body.event_type || "invitation.created", email + " / " + roleKey);
          qs("#invite-email").value = "";
        } catch (error) {
          setInvitationMessage(error instanceof Error ? error.message : "Não foi possível gerar convite.", "warn");
          addFeed("invitation.error", "Falha ao gerar convite");
        }
      }

      async function resendInvitation(invitationId) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        const expiresInDays = Number(qs("#invite-expiry").value || "7");
        if (!tenantId || !accessToken) {
          setInvitationMessage("Sessão sem acesso para reenviar convite.", "warn");
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
          setInvitationMessage(error instanceof Error ? error.message : "Não foi possível reenviar convite.", "warn");
          addFeed("invitation.error", "Falha ao reenviar convite");
        }
      }

      async function revokeInvitation(invitationId) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!tenantId || !accessToken) {
          setInvitationMessage("Sessão sem acesso para revogar convite.", "warn");
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
          setInvitationMessage(error instanceof Error ? error.message : "Não foi possível revogar convite.", "warn");
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
          setAuthMessage(error instanceof Error ? error.message : "Não foi possível aceitar o convite.", "warn");
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
            setAuthMessage("Acesso criado. Se o Supabase exigir confirmação, confirme no email e depois entre.", "warn");
            addFeed("auth.pending", "Acesso criado aguardando confirmação");
            return;
          }

          storeAuthSession(payload);
          await syncSession();
          if (authState.pendingInviteToken) {
            await acceptPendingInvitation();
          } else {
            setAuthMessage("Sessão sincronizada com o core Helvok Tax.", "good");
          }
        } catch (error) {
          setAuthMessage(error instanceof Error ? error.message : "Não foi possível autenticar.", "warn");
          addFeed("auth.error", "Falha na autenticacao ou sincronizacao");
        }
      }

      function renderJurisdictionMap(markets) {
        const map = qs("#jurisdiction-map");
        if (!map) {
          return;
        }
        if (!markets || markets.length === 0) {
          map.innerHTML = '<div class="country-tile active"><strong>Sem mercados</strong><span>API indisponível</span><small>pendente</small></div>';
          setText("#jurisdiction-count-label", "0 mercados");
          return;
        }

        setText("#jurisdiction-count-label", String(markets.length) + " mercados");
        map.innerHTML = markets.map((market) => {
          const active = ["BR", "GB", "US", "CA", "SG", "JP"].includes(market.code) ? " active" : "";
          const fill = market.sourceStatus === "official-seed" ? "0.86" : market.sourceStatus === "manual-required" ? "0.34" : "0.58";
          const rateLabel = market.standardRate > 0 ? formatPercent(market.standardRate) : "manual";
          return (
            '<div class="country-tile' + active + '" style="--fill: ' + fill + ';">' +
              '<strong>' + escapeHtml(market.name) + '</strong>' +
              '<span>' + escapeHtml(market.region) + ' / ' + escapeHtml(market.code) + ' / ' + escapeHtml(market.currency) + '</span>' +
              '<em>' + escapeHtml(market.indirectTaxName) + ' / ' + escapeHtml(market.eInvoiceStatus) + '</em>' +
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
        refreshCustomSelect(origin);
        refreshCustomSelect(destination);
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
          setText("#tax-rule-pack", taxState.rulePackVersion || "pacote de regras");
          addFeed("tax.markets", String(taxState.markets.length) + " mercados de exportação carregados");
          await runTaxSimulation();
        } catch (error) {
          setText("#tax-result-status", "offline");
          addFeed("tax.markets.error", "Não foi possível carregar mercados fiscais");
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
          runTaxComparison(false);
          addFeed(body.event_type || "tax.simulation.completed", "Custo total e impostos recalculados");
        } catch (error) {
          setText("#tax-result-status", "erro");
          const warnings = qs("#tax-warnings");
          if (warnings) {
            warnings.innerHTML = '<div class="tax-warning-card"><strong>Falha na simulação</strong><span>' + escapeHtml(error instanceof Error ? error.message : "Erro desconhecido") + '</span></div>';
          }
          addFeed("tax.simulation.error", "Falha ao calcular impostos");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Calcular impostos e preço real";
          }
        }
      }

      async function runTaxComparison(showLoading) {
        const button = qs("#tax-compare-button");
        if (showLoading && button) {
          button.disabled = true;
          button.textContent = "Comparando...";
        }
        setText("#tax-compare-status", "comparando mercados");

        const payload = collectTaxPayload();
        const destinations = ["PT", "DE", "FR", "ES", "IT", "NL", "GB", "US", "CA", "JP", "SG", "AU", "AG", "BB", "DO", "JM", "LC", "KN", "VC", "TT"];

        try {
          const response = await fetch("/v1/tax/compare", {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify({
              scenario: payload,
              destinations: destinations,
              limit: 20
            })
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Tax comparison failed");
          }
          taxState.lastComparison = body;
          renderTaxComparison(body);
          addFeed(body.event_type || "tax.market_comparison.completed", String(body.count || 0) + " mercados comparados");
        } catch (error) {
          setText("#tax-compare-status", "erro");
          const table = qs("#tax-comparison-table");
          if (table) {
            table.innerHTML =
              '<div class="comparison-row"><div><strong>Comparação indisponível</strong><span>' +
              escapeHtml(error instanceof Error ? error.message : "Erro desconhecido") +
              '</span></div><span class="comparison-value">--</span><span class="comparison-value">--</span><span class="comparison-value">--</span><span class="comparison-value">--</span><div class="risk-meter"><span style="--risk: 0%;"></span></div></div>';
          }
          addFeed("tax.compare.error", "Falha ao comparar mercados");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Comparar mercados";
          }
        }
      }

      function renderTaxComparison(comparison) {
        const comparisons = comparison && Array.isArray(comparison.comparisons) ? comparison.comparisons : [];
        const summary = comparison && comparison.summary ? comparison.summary : {};
        const cheapest = summary.cheapest_market;
        const bestMargin = summary.best_margin_market;
        const lowestLoad = summary.lowest_operational_load_market;

        setText("#tax-compare-status", String(comparisons.length) + " mercados / indice sem FX");
        setText("#compare-cheapest", cheapest && cheapest.market ? cheapest.market.name + " / " + Number(cheapest.totals.cost_index || 0).toFixed(2) + "x" : "--");
        setText("#compare-margin", bestMargin && bestMargin.market ? bestMargin.market.name + " / " + formatPercent(bestMargin.totals.seller_gross_margin_rate || 0) : "--");
        setText("#compare-lowest-load", lowestLoad && lowestLoad.market ? lowestLoad.market.name + " / risco " + Number(lowestLoad.operational_load.risk_score || 0) : "--");

        const table = qs("#tax-comparison-table");
        if (!table) {
          return;
        }

        const header =
          '<div class="comparison-row header">' +
            '<span>Mercado</span>' +
            '<span>Total/indice</span>' +
            '<span>Imposto destino</span>' +
            '<span>Margem</span>' +
            '<span>Preço unitário alvo</span>' +
            '<span>Carga operacional</span>' +
          '</div>';

        table.innerHTML = header + comparisons.map((item) => {
          const currency = item.market && item.market.currency ? item.market.currency : "USD";
          const risk = Math.min(100, Math.max(8, Number(item.operational_load.risk_score || 0) * 7));
          return (
            '<div class="comparison-row">' +
              '<div><strong>' + escapeHtml(item.market.name) + '</strong><span>' + escapeHtml(item.market.code) + ' / ' + escapeHtml(item.market.indirect_tax_name) + '</span></div>' +
              '<div class="comparison-value">' + escapeHtml(formatCurrency(item.totals.customer_total, currency)) + '<span>' + Number(item.totals.cost_index || 0).toFixed(2) + 'x do subtotal</span></div>' +
              '<div class="comparison-value">' + escapeHtml(formatCurrency(item.totals.destination_indirect_tax, currency)) + '<span>duty ' + escapeHtml(formatCurrency(item.totals.import_duty, currency)) + '</span></div>' +
              '<div class="comparison-value">' + escapeHtml(formatCurrency(item.totals.seller_gross_margin, currency)) + '<span>' + escapeHtml(formatPercent(item.totals.seller_gross_margin_rate)) + '</span></div>' +
              '<div class="comparison-value">' + escapeHtml(formatCurrency(item.totals.suggested_unit_price, currency)) + '<span>moeda nativa</span></div>' +
              '<div><div class="risk-meter"><span style="--risk: ' + risk.toFixed(0) + '%;"></span></div><span>' + Number(item.operational_load.risk_score || 0) + ' risco / ' + Number(item.operational_load.documents || 0) + ' docs</span></div>' +
            '</div>'
          );
        }).join("");
      }

      function renderTaxSimulation(simulation) {
        if (!simulation || !simulation.totals) {
          return;
        }
        taxState.lastSimulation = simulation;
        const totals = simulation.totals;
        const market = simulation.market || {};
        const snapshot = simulation.input_snapshot || {};
        const currency = snapshot.currency || market.currency || taxState.currency || "USD";
        taxState.currency = currency;

        setText("#tax-result-status", "estimativa viva");
        setText("#tax-rule-pack", simulation.rule_pack_version || taxState.rulePackVersion || "pacote de regras");
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

      function requireCurrentSimulation() {
        if (!taxState.lastSimulation || !taxState.lastSimulation.totals) {
          setText("#tax-result-status", "sem simulação");
          addFeed("tax.simulation.empty", "Calcule antes de acionar a simulação");
          return null;
        }
        return taxState.lastSimulation;
      }

      function exportCurrentSimulationPdf() {
        const simulation = requireCurrentSimulation();
        if (!simulation) {
          return;
        }

        const totals = simulation.totals || {};
        const market = simulation.market || {};
        const snapshot = simulation.input_snapshot || {};
        const currency = snapshot.currency || market.currency || taxState.currency || "USD";
        const lines = (simulation.tax_lines || []).map((line) => line.label + ": " + formatCurrency(line.amount || 0, currency)).join(" | ");

        openPrintablePdf("Simulação fiscal - " + (market.name || snapshot.destination_country || "mercado"), [
          { label: "Origem", value: snapshot.origin_country || "--" },
          { label: "Destino", value: (market.name || "--") + " / " + (snapshot.destination_country || market.code || "--") },
          { label: "Incoterm", value: snapshot.incoterm || "--" },
          { label: "Canal", value: snapshot.channel || "--" },
          { label: "Total do cliente", value: formatCurrency(totals.customer_total || 0, currency) },
          { label: "Desembolso vendedor", value: formatCurrency(totals.seller_cash_out || 0, currency) },
          { label: "Margem estimada", value: formatCurrency(totals.seller_gross_margin || 0, currency) + " / " + formatPercent(totals.seller_gross_margin_rate || 0) },
          { label: "Preço unitário alvo", value: formatCurrency(totals.suggested_unit_price || 0, currency) },
          { label: "Linhas tributárias e fees", value: lines || "--" },
          { label: "Pacote de regras", value: simulation.rule_pack_version || taxState.rulePackVersion || "--" }
        ]);
        addFeed("tax.simulation.pdf", "PDF operacional da simulação gerado");
      }

      function archiveCurrentSimulation() {
        const simulation = requireCurrentSimulation();
        if (!simulation) {
          return;
        }

        let archive = [];
        try {
          archive = JSON.parse(window.localStorage.getItem(authStorage.simulations) || "[]");
          if (!Array.isArray(archive)) {
            archive = [];
          }
        } catch (_error) {
          archive = [];
        }
        archive.unshift({
          id: "sim-" + Date.now(),
          archived_at: new Date().toISOString(),
          simulation: simulation
        });
        window.localStorage.setItem(authStorage.simulations, JSON.stringify(archive.slice(0, 25)));
        setText("#tax-result-status", "simulação arquivada");
        addFeed("tax.simulation.archived", "Simulação arquivada localmente");
      }

      function clearCurrentSimulation() {
        const simulation = requireCurrentSimulation();
        if (!simulation) {
          return;
        }

        if (!window.confirm("Excluir a simulação atual da tela?")) {
          return;
        }

        taxState.lastSimulation = null;
        setText("#tax-result-status", "simulação excluída");
        setText("#tax-market-name", "aguardando");
        setText("#tax-currency-label", "--");
        setText("#tax-market-tax-label", "--");
        setText("#tax-source-label", "--");
        setText("#tax-customer-total", "--");
        setText("#tax-seller-out", "--");
        setText("#tax-margin", "--");
        setText("#tax-suggested", "--");
        const lines = qs("#tax-lines");
        if (lines) {
          lines.innerHTML = '<div class="tax-line-card"><strong>Nenhuma simulação</strong><span>calcule para gerar linhas</span><em class="tax-amount">--</em></div>';
        }
        ["#tax-value-chain", "#tax-docs", "#tax-required-data", "#tax-warnings"].forEach((selector) => {
          const node = qs(selector);
          if (node) {
            node.innerHTML = "";
          }
        });
        addFeed("tax.simulation.deleted", "Simulação removida da tela");
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
          setText("#supabase-status", health.checks && health.checks.supabase_configured ? "pronto" : "pendente");
          setText("#runtime-label", api.status === "foundation-pronto" ? "Edge" : "Workers");
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

      function activateView(viewId, updateHash) {
        const targetId = viewId || "dashboard";
        const target = document.getElementById(targetId) || document.getElementById("dashboard");
        if (!target) {
          return;
        }

        document.querySelectorAll(".app-view").forEach((view) => {
          view.classList.toggle("active", view === target);
        });

        document.querySelectorAll(".nav-button").forEach((link) => {
          const linkTarget = String(link.getAttribute("href") || "").replace("#", "");
          link.classList.toggle("active", linkTarget === target.id);
        });

        const label = target.getAttribute("aria-label") || "Dashboard";
        setText("#breadcrumb-organization", label);
        if (updateHash) {
          window.history.replaceState(null, "", "#" + target.id);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      document.querySelectorAll(".nav-button").forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          activateView(String(link.getAttribute("href") || "#dashboard").replace("#", ""), true);
        });
      });

      initializeCustomSelects();

      window.addEventListener("hashchange", () => {
        activateView(String(window.location.hash || "#dashboard").replace("#", ""), false);
      });

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

      const catalogItemForm = qs("#catalog-item-form");
      if (catalogItemForm) {
        catalogItemForm.addEventListener("submit", submitCatalogItemForm);
      }

      const catalogItemsList = qs("#catalog-items-list");
      if (catalogItemsList) {
        catalogItemsList.addEventListener("click", handleCatalogListClick);
      }

      const invitationForm = qs("#invitation-form");
      if (invitationForm) {
        invitationForm.addEventListener("submit", submitInvitationForm);
      }

      const taxSimulatorForm = qs("#tax-simulator-form");
      if (taxSimulatorForm) {
        taxSimulatorForm.noValidate = true;
        taxSimulatorForm.addEventListener("submit", runTaxSimulation);
      }

      const taxSimulateButton = qs("#tax-simulate-button");
      if (taxSimulateButton) {
        taxSimulateButton.addEventListener("click", runTaxSimulation);
      }

      const taxCompareButton = qs("#tax-compare-button");
      if (taxCompareButton) {
        taxCompareButton.addEventListener("click", () => runTaxComparison(true));
      }

      const taxSimulationPdfButton = qs("#tax-simulation-pdf-button");
      if (taxSimulationPdfButton) {
        taxSimulationPdfButton.addEventListener("click", exportCurrentSimulationPdf);
      }

      const taxSimulationArchiveButton = qs("#tax-simulation-archive-button");
      if (taxSimulationArchiveButton) {
        taxSimulationArchiveButton.addEventListener("click", archiveCurrentSimulation);
      }

      const taxSimulationDeleteButton = qs("#tax-simulation-delete-button");
      if (taxSimulationDeleteButton) {
        taxSimulationDeleteButton.addEventListener("click", clearCurrentSimulation);
      }

      const createFiscalDocumentButton = qs("#create-fiscal-document-button");
      if (createFiscalDocumentButton) {
        createFiscalDocumentButton.addEventListener("click", createFiscalDocumentDraft);
      }

      ["#tax-destination", "#tax-origin", "#tax-incoterm", "#tax-operation-type", "#tax-customer-type", "#tax-channel", "#tax-item-category"].forEach((selector) => {
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
          addFeed("auth.preview", "Cockpit aberto sem sessão");
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
      activateView(String(window.location.hash || "#dashboard").replace("#", ""), false);
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
