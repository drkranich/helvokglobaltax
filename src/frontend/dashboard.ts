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
        align-content: start;
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

      .financial-operations {
        display: grid;
        gap: 18px;
        margin-top: 22px;
      }

      .financial-toolbar {
        display: grid;
        grid-template-columns: minmax(220px, 0.55fr) minmax(0, 1fr);
        gap: 12px;
        align-items: end;
      }

      .financial-action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: flex-end;
        align-items: center;
        position: relative;
        z-index: 2;
        pointer-events: auto;
      }

      .financial-action-row .mini-button {
        position: relative;
        z-index: 3;
        pointer-events: auto;
      }

      .financial-record-form {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      .financial-record-form .wide-field,
      .financial-record-form .glass-button,
      .financial-message {
        grid-column: 1 / -1;
      }

      .financial-list {
        display: grid;
        gap: 10px;
        max-height: 560px;
        overflow: auto;
        padding-right: 4px;
      }

      .financial-record-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(194px, auto);
        grid-template-rows: auto 1fr;
        gap: 12px;
        align-items: start;
        min-height: 118px;
        padding: 14px;
        border: 1px solid var(--line);
        border-radius: var(--radius);
        background:
          linear-gradient(135deg, rgba(244, 230, 200, 0.1), rgba(8, 36, 38, 0.22)),
          rgba(244, 230, 200, 0.06);
      }

      .financial-record-card > div:first-child {
        grid-column: 1;
        grid-row: 1 / span 2;
        min-width: 0;
      }

      .financial-record-card strong,
      .financial-record-card span {
        display: block;
      }

      .financial-record-card span {
        margin-top: 5px;
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 11px;
        line-height: 1.55;
      }

      .financial-record-card em {
        grid-column: 2;
        grid-row: 1;
        justify-self: end;
        min-width: 106px;
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

      .financial-record-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: flex-end;
        max-width: 100%;
        overflow: hidden;
      }

      .financial-record-card > .financial-record-actions {
        grid-column: 2;
        grid-row: 2;
        align-self: end;
        justify-self: end;
      }

      .tax-doc-card .fiscal-document-actions {
        grid-column: 1 / -1;
      }

      .financial-record-actions .mini-button {
        flex: 0 1 auto;
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
        min-height: 148px;
        overflow: hidden;
        padding: 14px;
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
        line-height: 1.15;
        overflow-wrap: anywhere;
      }

      .country-tile span {
        display: block;
        margin-top: 8px;
        color: var(--champagne-64);
        font-family: var(--font-data);
        font-size: 11px;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .country-tile em {
        display: block;
        margin-top: 8px;
        color: var(--champagne-80);
        font-family: var(--font-data);
        font-size: 10px;
        line-height: 1.35;
        font-style: normal;
        overflow-wrap: anywhere;
      }

      .country-tile small {
        display: block;
        margin-top: 10px;
        padding-bottom: 6px;
        color: var(--gold-300);
        font-family: var(--font-data);
        font-size: 12px;
        line-height: 1.35;
        overflow-wrap: anywhere;
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
        grid-template-columns: minmax(0, 1fr);
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
          <a class="nav-button" href="#financeiro"><span>Planejamento financeiro</span><span class="nav-code">FIN</span></a>
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
            <span>Organização</span>
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
            <span>Organizações</span>
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
              <h2>Fontes e cobertura</h2>
              <span>somente dados carregados</span>
            </div>
            <div class="system-row">
              <div><strong>Fonte carregada</strong><span id="markets-source-label">Aguardando API /v1/tax/markets.</span></div>
              <span class="status-badge" id="markets-source-status">pendente</span>
            </div>
            <div class="system-row">
              <div><strong>Homologação</strong><span id="markets-validation-label">Mercados estimados ou manuais não autorizam emissão.</span></div>
              <span class="status-badge pending" id="markets-validation-status">manual</span>
            </div>
            <div class="system-row">
              <div><strong>Escopo real</strong><span id="markets-scope-label">Nenhum país é tratado como oficial sem fonte marcada no rule pack.</span></div>
              <span class="status-badge pending" id="markets-scope-status">0</span>
            </div>
          </aside>
        </section>

        <section class="work-grid">
          <article class="panel">
            <div class="panel-title">
              <h2>Cadastro fiscal do tenant</h2>
              <span id="fiscal-registrations-count">0 cadastros</span>
            </div>
            <p>CNPJ/EIN/VAT id, regime tributário, inscrição estadual/municipal (ou equivalente) e endereço fiscal por país. Sem isso, nenhum adaptador consegue sair de "planned" para "sandbox" real — o Helvok Tax nunca emite com CNPJ próprio, quem emite é o seu cliente (tenant).</p>
            <div class="tax-doc-list" id="fiscal-registrations-list">
              <div class="empty-state">
                <strong>Nenhum cadastro fiscal carregado</strong>
                <span>Entre com uma sessão autorizada do tenant para ver ou criar cadastros.</span>
              </div>
            </div>
          </article>

          <aside class="panel">
            <div class="panel-title">
              <h2>Novo cadastro fiscal</h2>
              <span>organizations.manage</span>
            </div>
            <form class="catalog-form" id="fiscal-registration-form">
              <div class="field-block wide-field">
                <label for="fiscal-registration-organization">Organização/empresa</label>
                <select id="fiscal-registration-organization" class="glass-select"></select>
              </div>
              <div class="field-block">
                <label for="fiscal-registration-country">País</label>
                <input id="fiscal-registration-country" class="glass-field" placeholder="BR" maxlength="2" required />
              </div>
              <div class="field-block">
                <label for="fiscal-registration-regime">Regime tributário</label>
                <select id="fiscal-registration-regime" class="glass-select">
                  <option value="simples_nacional">Simples Nacional</option>
                  <option value="lucro_presumido">Lucro Presumido</option>
                  <option value="lucro_real">Lucro Real</option>
                  <option value="mei">MEI</option>
                  <option value="standard" selected>Padrão/genérico</option>
                  <option value="flat_rate">Alíquota fixa</option>
                  <option value="flow_through">Flow-through</option>
                  <option value="exempt">Isento</option>
                  <option value="other">Outro</option>
                </select>
              </div>
              <div class="field-block wide-field">
                <label for="fiscal-registration-tax-id">Tax ID (CNPJ/EIN/VAT id)</label>
                <input id="fiscal-registration-tax-id" class="glass-field" placeholder="12.345.678/0001-99" required />
              </div>
              <div class="field-block">
                <label for="fiscal-registration-secondary">Inscrição estadual (ou equivalente)</label>
                <input id="fiscal-registration-secondary" class="glass-field" placeholder="123.456.789.012" />
              </div>
              <div class="field-block">
                <label for="fiscal-registration-tertiary">Inscrição municipal (ou equivalente)</label>
                <input id="fiscal-registration-tertiary" class="glass-field" placeholder="opcional, para ISS/NFS-e" />
              </div>
              <div class="field-block">
                <label for="fiscal-registration-city">Cidade</label>
                <input id="fiscal-registration-city" class="glass-field" placeholder="São Paulo" />
              </div>
              <div class="field-block">
                <label for="fiscal-registration-state">UF/estado/província</label>
                <input id="fiscal-registration-state" class="glass-field" placeholder="SP" />
              </div>
              <div class="field-block">
                <label for="fiscal-registration-postal">CEP/postal code</label>
                <input id="fiscal-registration-postal" class="glass-field" placeholder="01310-100" />
              </div>
              <button class="glass-button primary" id="fiscal-registration-save-button" type="submit">Salvar cadastro fiscal</button>
              <div class="financial-message" id="fiscal-registration-message">Cada tenant registra seu próprio CNPJ/EIN/VAT id — o Helvok Tax não emite com CNPJ próprio.</div>
            </form>
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

              <button class="glass-button primary" id="tax-simulate-button" type="submit" data-tax-action="simulate">Calcular impostos e preço real</button>
              <div class="simulation-actions" aria-label="Ações da simulação">
                <button class="mini-button" id="tax-simulation-pdf-button" type="button">PDF da simulação</button>
                <button class="mini-button" id="tax-simulation-provision-button" type="button">Provisionar custos</button>
                <button class="mini-button" id="tax-simulation-ledger-button" type="button">Criar lançamento</button>
                <button class="mini-button" id="tax-simulation-bundle-button" type="button">Draft + financeiro</button>
                <button class="mini-button warn" id="tax-simulation-archive-button" type="button">Arquivar simulação</button>
                <button class="mini-button danger" id="tax-simulation-delete-button" type="button">Excluir simulação</button>
              </div>
            </form>
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

        <section class="app-view" id="financeiro" data-view="financeiro" aria-label="Planejamento financeiro">
          <div class="view-head">
            <div>
              <span class="view-kicker">Helvok Financial Engine</span>
              <h1>Planejamento financeiro</h1>
              <p>Modele custos, margem, capital de giro, investimento, payback, ROI, VPL e formação de preço sem misturar regras fiscais ao motor financeiro.</p>
            </div>
            <span class="view-status" id="financial-view-status">cost engine preview</span>
          </div>
          <section class="work-grid tax-workbench">
            <article class="panel tax-simulator-panel">
              <div class="panel-title">
                <h2>Cost engine operacional</h2>
                <span id="financial-result-status">aguardando</span>
              </div>
              <form class="tax-simulator-grid" id="financial-plan-form" novalidate>
                <div class="tax-section">
                  <div class="tax-section-head"><strong>Cenário</strong><span>volume e preço</span></div>
                  <div class="tax-input-grid">
                    <div class="field-block">
                      <label for="financial-scenario">Cenário</label>
                      <select id="financial-scenario" class="glass-select">
                        <option value="base" selected>Base</option>
                        <option value="conservative">Conservador</option>
                        <option value="aggressive">Agressivo</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </div>
                    <div class="field-block"><label for="financial-currency">Moeda</label><input id="financial-currency" class="glass-field" value="BRL" maxlength="3" /></div>
                    <div class="field-block"><label for="financial-period">Meses</label><input id="financial-period" class="glass-field" type="number" min="1" step="1" value="12" /></div>
                    <div class="field-block"><label for="financial-volume">Volume</label><input id="financial-volume" class="glass-field" type="number" min="1" step="1" value="1200" /></div>
                    <div class="field-block"><label for="financial-price">Preço unitário</label><input id="financial-price" class="glass-field" type="number" min="0" step="0.01" value="45" /></div>
                    <div class="field-block"><label for="financial-unit-cost">Custo unitário</label><input id="financial-unit-cost" class="glass-field" type="number" min="0" step="0.01" value="22" /></div>
                  </div>
                </div>
                <div class="tax-section">
                  <div class="tax-section-head"><strong>Custos e investimento</strong><span>projeção</span></div>
                  <div class="tax-input-grid">
                    <div class="field-block"><label for="financial-fixed-costs">Custos fixos</label><input id="financial-fixed-costs" class="glass-field" type="number" min="0" step="0.01" value="12000" /></div>
                    <div class="field-block"><label for="financial-logistics-costs">Logística</label><input id="financial-logistics-costs" class="glass-field" type="number" min="0" step="0.01" value="1800" /></div>
                    <div class="field-block"><label for="financial-tax-costs">Custo tributário</label><input id="financial-tax-costs" class="glass-field" type="number" min="0" step="0.01" value="3200" /></div>
                    <div class="field-block"><label for="financial-channel-costs">Canal</label><input id="financial-channel-costs" class="glass-field" type="number" min="0" step="0.01" value="1400" /></div>
                    <div class="field-block"><label for="financial-working-capital">Capital de giro</label><input id="financial-working-capital" class="glass-field" type="number" min="0" step="0.01" value="8000" /></div>
                    <div class="field-block"><label for="financial-investment">Investimento inicial</label><input id="financial-investment" class="glass-field" type="number" min="0" step="0.01" value="25000" /></div>
                    <div class="field-block"><label for="financial-target-margin">Margem alvo %</label><input id="financial-target-margin" class="glass-field" type="number" min="0" step="0.01" value="32" /></div>
                    <div class="field-block"><label for="financial-discount-rate">Desconto mensal %</label><input id="financial-discount-rate" class="glass-field" type="number" min="0" step="0.01" value="1.5" /></div>
                  </div>
                </div>
                <button class="glass-button primary" id="financial-plan-button" type="button">Calcular plano financeiro</button>
              </form>
            </article>
            <aside class="panel tax-result-panel">
              <div class="panel-title">
                <h2>Resultado financeiro</h2>
                <span id="financial-scenario-label">base</span>
              </div>
              <div class="tax-kpi-grid">
                <div class="tax-kpi"><span>Receita projetada</span><strong id="financial-revenue">--</strong></div>
                <div class="tax-kpi"><span>Margem líquida</span><strong id="financial-net-margin">--</strong></div>
                <div class="tax-kpi"><span>Preço sugerido</span><strong id="financial-suggested-price">--</strong></div>
                <div class="tax-kpi"><span>Break-even</span><strong id="financial-break-even">--</strong></div>
                <div class="tax-kpi"><span>ROI</span><strong id="financial-roi">--</strong></div>
                <div class="tax-kpi"><span>Payback</span><strong id="financial-payback">--</strong></div>
              </div>
              <div class="tax-section">
                <div class="tax-section-head"><strong>Memória de cálculo</strong><span>reprodutível</span></div>
                <div class="tax-line-list" id="financial-lines">
                  <div class="tax-line-card"><strong>Nenhum plano calculado</strong><span>calcule para gerar indicadores</span><em class="tax-amount">--</em></div>
                </div>
              </div>
              <div class="tax-section">
                <div class="tax-section-head"><strong>Alertas</strong><span>planejamento</span></div>
                <div class="tax-warning-list" id="financial-warnings"></div>
              </div>
            </aside>
          </section>
          <section class="panel financial-operations" aria-label="Operações financeiras do tenant">
            <div class="panel-title">
              <h2>Mesa operacional financeira</h2>
              <span id="financial-record-count">0 registros</span>
            </div>
            <div class="financial-toolbar">
              <div class="field-block">
                <label for="financial-entity">Módulo</label>
                <select id="financial-entity" class="glass-select">
                  <option value="financial_entries" selected>Lançamentos</option>
                  <option value="financial_accounts">Contas financeiras</option>
                  <option value="cost_centers">Centros de custo</option>
                  <option value="projects">Projetos</option>
                  <option value="budgets">Orçamentos</option>
                  <option value="forecasts">Forecasts</option>
                  <option value="investments">Investimentos</option>
                  <option value="pricing_models">Formação de preços</option>
                  <option value="product_costs">Custos de produto</option>
                  <option value="logistics_costs">Custos logísticos</option>
                  <option value="tax_costs">Custos tributários</option>
                  <option value="channel_costs">Custos por canal</option>
                  <option value="cash_flow_periods">Fluxo de caixa</option>
                  <option value="financial_reports">Relatórios</option>
                  <option value="spreadsheet_exports">Exportações</option>
                </select>
              </div>
              <div class="financial-action-row">
                <button class="mini-button" id="financial-refresh-button" type="button" data-financial-toolbar-action="refresh">Atualizar</button>
                <button class="mini-button" id="financial-export-csv-button" type="button" data-financial-toolbar-action="csv">Gerar CSV</button>
                <button class="mini-button" id="financial-export-xlsx-button" type="button" data-financial-toolbar-action="xlsx">Gerar XLSX</button>
                <button class="mini-button" id="financial-report-pdf-button" type="button" data-financial-toolbar-action="pdf">PDF do módulo</button>
              </div>
            </div>
            <form class="financial-record-form" id="financial-record-form" novalidate>
              <div class="field-block"><label for="financial-record-code">Código</label><input id="financial-record-code" class="glass-field" value="FIN-001" /></div>
              <div class="field-block"><label for="financial-record-name">Nome</label><input id="financial-record-name" class="glass-field" value="Plano operacional" /></div>
              <div class="field-block"><label for="financial-record-category">Categoria</label><input id="financial-record-category" class="glass-field" value="exportação" /></div>
              <div class="field-block">
                <label for="financial-record-nature">Natureza</label>
                <select id="financial-record-nature" class="glass-select">
                  <option value="revenue">Receita</option>
                  <option value="expense" selected>Despesa</option>
                  <option value="cost">Custo</option>
                  <option value="tax">Tributo</option>
                  <option value="investment">Investimento</option>
                  <option value="financing">Financiamento</option>
                  <option value="adjustment">Ajuste</option>
                </select>
              </div>
              <div class="field-block"><label for="financial-record-amount">Valor</label><input id="financial-record-amount" class="glass-field" type="number" step="0.01" value="10839.88" /></div>
              <div class="field-block"><label for="financial-record-currency">Moeda</label><input id="financial-record-currency" class="glass-field" value="BRL" maxlength="3" /></div>
              <div class="field-block"><label for="financial-record-country">País</label><input id="financial-record-country" class="glass-field" value="BR" maxlength="2" /></div>
              <div class="field-block"><label for="financial-record-channel">Canal</label><input id="financial-record-channel" class="glass-field" value="marketplace" /></div>
              <div class="field-block wide-field"><label for="financial-record-notes">Memória operacional</label><input id="financial-record-notes" class="glass-field" value="Cenário criado no Helvok Financial Engine" /></div>
              <button class="glass-button primary" id="financial-record-save-button" type="submit">Salvar registro financeiro</button>
              <div class="financial-message" id="financial-message">Sessão autenticada habilita gravação multi-tenant.</div>
            </form>
            <div class="financial-list" id="financial-records-list">
              <div class="empty-state"><strong>Nenhum registro financeiro carregado</strong><span>Entre com sessão autorizada e selecione um módulo financeiro.</span></div>
            </div>
          </section>
          <section class="modules-grid" aria-label="Módulos financeiros Helvok">
            <article class="module"><h3>Lançamentos</h3><p>Ledger por competência, pagamento, origem, documento, pedido, produto, país, canal e tags.</p><div class="module-meter"><span style="--meter: 52%;"></span></div></article>
            <article class="module"><h3>Centros de custo</h3><p>Rateios por quantidade, peso, volume, valor, horas, porcentagem ou regra personalizada.</p><div class="module-meter"><span style="--meter: 48%;"></span></div></article>
            <article class="module"><h3>Projetos</h3><p>Custos, orçamento, realizado, desvio, tendência e projeção por operação, cliente e país.</p><div class="module-meter"><span style="--meter: 46%;"></span></div></article>
            <article class="module"><h3>Orçamento</h3><p>Budget lines por conta, categoria, centro de custo e memória de cálculo reproduzível.</p><div class="module-meter"><span style="--meter: 42%;"></span></div></article>
            <article class="module"><h3>Investimentos</h3><p>Aportes, financiamento, juros, depreciação, amortização, payback, ROI, VPL e TIR.</p><div class="module-meter"><span style="--meter: 50%;"></span></div></article>
            <article class="module"><h3>Formação de preços</h3><p>Preço mínimo, markup, margem desejada, canal, país, moeda, B2B, B2C e promoção.</p><div class="module-meter"><span style="--meter: 58%;"></span></div></article>
            <article class="module"><h3>Cenários</h3><p>Conservador, base, agressivo e personalizado com volume, câmbio, frete, tributos e inadimplência.</p><div class="module-meter"><span style="--meter: 54%;"></span></div></article>
            <article class="module"><h3>Fluxo de caixa</h3><p>Entradas, saídas, saldo acumulado, prazo de pagamento, prazo de recebimento e capital de giro.</p><div class="module-meter"><span style="--meter: 44%;"></span></div></article>
            <article class="module"><h3>Planilhas e relatórios</h3><p>XLSX, CSV, PDF, dashboards, demonstrativos, memórias e relatórios por projeto, canal, país, produto e período.</p><div class="module-meter"><span style="--meter: 40%;"></span></div></article>
          </section>
        </section>

        <section class="app-view" id="documentos" data-view="documentos" aria-label="Documentos">
          <div class="view-head">
            <div>
              <span class="view-kicker">Pré-emissão e compliance</span>
              <h1>Documentos fiscais globais</h1>
              <p>Crie drafts internacionais a partir da simulação, acompanhe lifecycle e prepare a futura fila de emissão por adaptador governamental.</p>
            </div>
            <span class="view-status" id="documents-view-status">aguardando documentos reais</span>
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
          </section>

          <section class="work-grid">
            <article class="panel">
              <div class="panel-title">
                <h2>Homologação por país</h2>
                <span id="fiscal-adapters-summary">carregando adaptadores...</span>
              </div>
              <p>Catálogo de adaptadores por país/jurisdição com requisitos de certificado, credenciamento e status real de conexão. Nenhum adaptador aqui está em produção; todos exigem certificado, credenciamento governamental e revisão contábil antes de emitir de verdade.</p>
              <div id="fiscal-adapters-list">
                <div class="empty-state">
                  <strong>Carregando catálogo de adaptadores</strong>
                  <span>Brasil, EUA, Canadá, Europa, América Latina, Ásia-Pacífico e Oriente Médio.</span>
                </div>
              </div>
            </article>

            <article class="panel">
              <div class="panel-title">
                <h2>Painel de rejeições</h2>
                <span id="fiscal-rejections-count">0 rejeições</span>
              </div>
              <p>Documentos fiscais rejeitados ou com falha, com o último evento de lifecycle registrado para revisão.</p>
              <div class="tax-doc-list" id="fiscal-rejections-list">
                <div class="empty-state">
                  <strong>Nenhuma rejeição carregada</strong>
                  <span>Entre com uma sessão autorizada do tenant para ver rejeições reais.</span>
                </div>
              </div>
            </article>
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
        ["organization.created", "Organização Helvok Tax criada"],
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
        loadedTenantId: "",
        editingDocumentId: ""
      };

      const fiscalRegistrationState = {
        registrations: [],
        organizations: [],
        loadedTenantId: ""
      };

      const financialState = {
        entity: "financial_entries",
        records: [],
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
        renderFinancialRecords([]);
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

      function isUnknownUserMembershipError(error) {
        if (!(error instanceof Error)) {
          return false;
        }

        const message = error.message.toLowerCase();
        return message.includes("user not found") || message.includes("usuário não encontrado") || message.includes("usuario nao encontrado");
      }

      async function createMembershipInvitation(email, roleKey, expiresInDays) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();

        if (!tenantId) {
          throw new Error("Sessão sem tenant ativo para convite.");
        }

        if (!accessToken) {
          showAuthGate(true);
          throw new Error("Entre novamente para gerar convites.");
        }

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
        return body;
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
        setText("#documents-view-status", normalized.length > 0 ? normalized.length + " documentos reais" : "sem documentos reais");

        if (!list) {
          return;
        }

        if (normalized.length === 0) {
          list.innerHTML =
            '<div class="empty-state"><strong>Nenhum documento fiscal criado</strong><span>Crie um draft global antes de assinatura, fila e governo.</span></div>';
          return;
        }

        list.innerHTML = normalized.map((document, index) => {
          const status = document.status || "draft";
          const amount = formatCurrency(document.total_amount || 0, document.currency_code || "BRL");
          const canDelete = ["draft", "archived", "rejected"].includes(String(status).toLowerCase());
          const canArchive = !["authorized", "cancelled", "archived"].includes(String(status).toLowerCase());
          return (
            '<div class="tax-doc-card" data-fiscal-document-index="' + index + '">' +
              '<span class="tax-status-pill">' + escapeHtml(status) + '</span>' +
              '<div><strong>' + escapeHtml(document.document_type || "DOCUMENT") + ' / ' + escapeHtml(document.country_code || "--") + '</strong>' +
              '<span>' + escapeHtml(document.adapter_key || "adapter") + ' / ' + escapeHtml(document.lifecycle_stage || "draft") + ' / ' + escapeHtml(amount) + '</span></div>' +
              '<div class="financial-record-actions fiscal-document-actions">' +
                '<button class="mini-button" type="button" data-fiscal-document-action="pdf">PDF</button>' +
                '<button class="mini-button" type="button" data-fiscal-document-action="edit">Editar</button>' +
                (canArchive ? '<button class="mini-button warn" type="button" data-fiscal-document-action="archive">Arquivar</button>' : '') +
                (canDelete ? '<button class="mini-button danger" type="button" data-fiscal-document-action="delete">Excluir</button>' : '') +
              '</div>' +
            '</div>'
          );
        }).join("");
      }

      function renderFiscalRegistrationOrganizations(organizations) {
        const select = qs("#fiscal-registration-organization");
        const normalized = Array.isArray(organizations) ? organizations : [];
        fiscalRegistrationState.organizations = normalized;
        if (!select) {
          return;
        }
        select.innerHTML = normalized.length === 0
          ? '<option value="">nenhuma organização encontrada</option>'
          : normalized.map((org) => (
              '<option value="' + escapeHtml(org.id) + '">' +
                escapeHtml(org.legal_name || org.trade_name || "organização") +
                ' (' + escapeHtml(org.country_of_registration || "--") + ')' +
              '</option>'
            )).join("");
        refreshCustomSelect(select);
      }

      function renderFiscalRegistrations(registrations) {
        const list = qs("#fiscal-registrations-list");
        const normalized = Array.isArray(registrations) ? registrations : [];
        fiscalRegistrationState.registrations = normalized;

        setText("#fiscal-registrations-count", normalized.length + " cadastros");

        if (!list) {
          return;
        }

        if (normalized.length === 0) {
          list.innerHTML =
            '<div class="empty-state"><strong>Nenhum cadastro fiscal criado</strong><span>Cadastre o CNPJ/EIN/VAT id do seu cliente (tenant) por país.</span></div>';
          return;
        }

        list.innerHTML = normalized.map((registration, index) => {
          const status = registration.status || "draft";
          const canArchive = status !== "archived";
          const canDelete = ["draft", "archived"].includes(String(status).toLowerCase());
          return (
            '<div class="tax-doc-card" data-fiscal-registration-index="' + index + '">' +
              '<span class="tax-status-pill">' + escapeHtml(status) + '</span>' +
              '<div><strong>' + escapeHtml(registration.country_code || "--") + ' / ' + escapeHtml(registration.tax_id || "sem tax id") + '</strong>' +
              '<span>' + escapeHtml(registration.tax_id_label || "tax_id") + ' / regime ' + escapeHtml(registration.tax_regime || "standard") +
                (registration.secondary_registration ? ' / ' + escapeHtml(registration.secondary_registration_label || "reg. secundário") + ' ' + escapeHtml(registration.secondary_registration) : '') +
              '</span></div>' +
              '<div class="financial-record-actions fiscal-document-actions">' +
                '<button class="mini-button" type="button" data-fiscal-registration-action="edit">Editar</button>' +
                (canArchive ? '<button class="mini-button warn" type="button" data-fiscal-registration-action="archive">Arquivar</button>' : '') +
                (canDelete ? '<button class="mini-button danger" type="button" data-fiscal-registration-action="delete">Excluir</button>' : '') +
              '</div>' +
            '</div>'
          );
        }).join("");
      }

      async function loadOrganizationsForFiscalRegistration(tenantId) {
        const accessToken = getStoredAccessToken();
        if (!accessToken || !tenantId) {
          renderFiscalRegistrationOrganizations([]);
          return [];
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/organizations", {
          headers: { authorization: "Bearer " + accessToken },
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível carregar organizações.");
        }

        renderFiscalRegistrationOrganizations(body.organizations || []);
        return body.organizations || [];
      }

      async function loadFiscalRegistrations(tenantId) {
        const accessToken = getStoredAccessToken();
        if (!accessToken || !tenantId) {
          fiscalRegistrationState.loadedTenantId = "";
          renderFiscalRegistrations([]);
          return [];
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/registrations", {
          headers: { authorization: "Bearer " + accessToken },
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível carregar cadastros fiscais.");
        }

        fiscalRegistrationState.loadedTenantId = tenantId;
        renderFiscalRegistrations(body.registrations || []);
        addFeed("fiscal_registration.loaded", "Cadastros fiscais sincronizados");
        return body.registrations || [];
      }

      async function submitFiscalRegistrationForm(event) {
        event.preventDefault();
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        const messageNode = qs("#fiscal-registration-message");

        if (!tenantId || !accessToken) {
          if (messageNode) {
            messageNode.textContent = "Entre com uma sessão autorizada para salvar o cadastro fiscal.";
          }
          return;
        }

        const payload = {
          organization_id: (qs("#fiscal-registration-organization") || {}).value || "",
          country_code: ((qs("#fiscal-registration-country") || {}).value || "").toUpperCase(),
          tax_regime: (qs("#fiscal-registration-regime") || {}).value || "standard",
          tax_id: (qs("#fiscal-registration-tax-id") || {}).value || "",
          secondary_registration: (qs("#fiscal-registration-secondary") || {}).value || "",
          secondary_registration_label: "Inscrição estadual",
          tertiary_registration: (qs("#fiscal-registration-tertiary") || {}).value || "",
          tertiary_registration_label: "Inscrição municipal",
          fiscal_address: {
            city: (qs("#fiscal-registration-city") || {}).value || "",
            state_code: (qs("#fiscal-registration-state") || {}).value || "",
            postal_code: (qs("#fiscal-registration-postal") || {}).value || "",
            country_code: ((qs("#fiscal-registration-country") || {}).value || "").toUpperCase()
          }
        };

        try {
          const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/registrations", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              authorization: "Bearer " + accessToken
            },
            body: JSON.stringify(payload)
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Falha ao salvar cadastro fiscal.");
          }

          renderFiscalRegistrations(body.registrations || []);
          if (messageNode) {
            messageNode.textContent = "Cadastro fiscal salvo (" + (payload.country_code || "país") + ").";
          }
          addFeed(body.event_type || "fiscal_registration.created", "Cadastro fiscal salvo");
        } catch (error) {
          if (messageNode) {
            messageNode.textContent = error instanceof Error ? error.message : "Falha ao salvar cadastro fiscal.";
          }
          addFeed("fiscal_registration.error", error instanceof Error ? error.message : "Falha no cadastro fiscal");
        }
      }

      async function archiveFiscalRegistration(registration) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!tenantId || !accessToken || !registration || !registration.id) {
          return;
        }

        const response = await fetch(
          "/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/registrations/" + encodeURIComponent(registration.id) + "/archive",
          { method: "POST", headers: { authorization: "Bearer " + accessToken } }
        );
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Falha ao arquivar cadastro fiscal.");
        }
        renderFiscalRegistrations(body.registrations || []);
        addFeed(body.event_type || "fiscal_registration.archived", "Cadastro fiscal arquivado");
      }

      async function deleteFiscalRegistration(registration) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!tenantId || !accessToken || !registration || !registration.id) {
          return;
        }

        const response = await fetch(
          "/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/registrations/" + encodeURIComponent(registration.id),
          { method: "DELETE", headers: { authorization: "Bearer " + accessToken } }
        );
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Falha ao excluir cadastro fiscal.");
        }
        renderFiscalRegistrations(body.registrations || []);
        addFeed(body.event_type || "fiscal_registration.deleted", "Cadastro fiscal excluído");
      }

      function editFiscalRegistrationDraft(registration) {
        if (!registration) {
          return;
        }
        const address = registration.fiscal_address || {};
        setSelectValue("#fiscal-registration-organization", registration.organization_id);
        setFieldValue("#fiscal-registration-country", registration.country_code);
        setSelectValue("#fiscal-registration-regime", registration.tax_regime || "standard");
        setFieldValue("#fiscal-registration-tax-id", registration.tax_id);
        setFieldValue("#fiscal-registration-secondary", registration.secondary_registration);
        setFieldValue("#fiscal-registration-tertiary", registration.tertiary_registration);
        setFieldValue("#fiscal-registration-city", address.city);
        setFieldValue("#fiscal-registration-state", address.state_code);
        setFieldValue("#fiscal-registration-postal", address.postal_code);
        const messageNode = qs("#fiscal-registration-message");
        if (messageNode) {
          messageNode.textContent = "Editando cadastro fiscal " + (registration.country_code || "") + " — ajuste os campos e salve para atualizar.";
        }
        const form = qs("#fiscal-registration-form");
        if (form && form.scrollIntoView) {
          form.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      async function handleFiscalRegistrationListClick(event) {
        const button = event.target.closest("[data-fiscal-registration-action]");
        const card = event.target.closest("[data-fiscal-registration-index]");
        if (!button || !card) {
          return;
        }

        const registration = fiscalRegistrationState.registrations[Number(card.getAttribute("data-fiscal-registration-index") || "-1")];
        const action = button.getAttribute("data-fiscal-registration-action");
        try {
          if (action === "archive") {
            await archiveFiscalRegistration(registration);
          } else if (action === "delete") {
            await deleteFiscalRegistration(registration);
          } else if (action === "edit") {
            editFiscalRegistrationDraft(registration);
          }
        } catch (error) {
          addFeed("fiscal_registration.action.error", error instanceof Error ? error.message : "Falha na ação do cadastro fiscal");
        }
      }

      function setFinancialMessage(message, tone) {
        const node = qs("#financial-message");
        if (!node) {
          return;
        }
        node.textContent = message;
        node.classList.remove("good", "warn");
        if (tone) {
          node.classList.add(tone);
        }
      }

      function financialEntityLabel(entity) {
        const labels = {
          financial_entries: "Lançamentos",
          financial_accounts: "Contas financeiras",
          cost_centers: "Centros de custo",
          projects: "Projetos",
          budgets: "Orçamentos",
          forecasts: "Forecasts",
          investments: "Investimentos",
          pricing_models: "Formação de preços",
          product_costs: "Custos de produto",
          logistics_costs: "Custos logísticos",
          tax_costs: "Custos tributários",
          channel_costs: "Custos por canal",
          cash_flow_periods: "Fluxo de caixa",
          financial_reports: "Relatórios",
          spreadsheet_exports: "Exportações"
        };
        return labels[entity] || entity || "Financeiro";
      }

      function renderFinancialRecords(records) {
        const list = qs("#financial-records-list");
        const normalized = Array.isArray(records) ? records : [];
        financialState.records = normalized;

        setText("#financial-record-count", normalized.length + " registros");
        setText("#financial-view-status", financialState.loadedTenantId ? "operações vivas" : "aguardando sessão");

        if (!list) {
          return;
        }

        if (normalized.length === 0) {
          list.innerHTML =
            '<div class="empty-state"><strong>Nenhum registro em ' + escapeHtml(financialEntityLabel(financialState.entity)) + '</strong><span>Crie o primeiro registro financeiro auditado para o tenant ativo.</span></div>';
          return;
        }

        list.innerHTML = normalized.map((record, index) => {
          const currency = record.currency_code || "BRL";
          const status = String(record.status || "").toLowerCase();
          const isFinancialEntry = financialState.entity === "financial_entries";
          const mustReverse = isFinancialEntry && ["posted", "paid"].includes(status);
          const amount = record.amount != null ? formatCurrency(record.amount, currency) :
            record.initial_amount != null ? formatCurrency(record.initial_amount, currency) :
            record.fixed_amount != null ? formatCurrency(record.fixed_amount, currency) :
            record.planned_inflow != null ? formatCurrency(record.planned_inflow, currency) : "--";
          const title = record.name || record.title || record.category || record.code || record.report_type || record.export_type || "Registro financeiro";
          const subtitle = [
            record.code,
            record.nature,
            record.status,
            record.country_code,
            record.channel,
            record.source_type
          ].filter(Boolean).join(" / ") || financialEntityLabel(financialState.entity);
          const dateLabel = record.competence_date || record.period_start || record.valid_from || record.created_at || "";
          return (
            '<div class="financial-record-card" data-financial-index="' + index + '">' +
              '<div><strong>' + escapeHtml(title) + '</strong>' +
              '<span>' + escapeHtml(subtitle) + '</span>' +
              '<span>' + escapeHtml(dateLabel) + ' / id ' + escapeHtml(record.id || "--") + '</span></div>' +
              '<em>' + escapeHtml(amount) + '</em>' +
              '<div class="financial-record-actions">' +
                '<button class="mini-button" type="button" data-financial-action="pdf">PDF</button>' +
                (mustReverse ? '' : '<button class="mini-button warn" type="button" data-financial-action="archive">Arquivar</button>') +
                (isFinancialEntry ? '<button class="mini-button danger" type="button" data-financial-action="reverse">Estornar</button>' : '') +
              '</div>' +
            '</div>'
          );
        }).join("");
      }

      async function loadFinancialRecords(tenantId) {
        const accessToken = getStoredAccessToken();
        const entity = textValue("#financial-entity") || financialState.entity || "financial_entries";
        financialState.entity = entity;

        if (!accessToken || !tenantId) {
          financialState.loadedTenantId = "";
          renderFinancialRecords([]);
          setFinancialMessage("Entre com uma sessão autorizada do tenant para carregar dados financeiros reais.", "warn");
          showAuthGate(true);
          return [];
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/financial/" + encodeURIComponent(entity), {
          headers: {
            authorization: "Bearer " + accessToken
          },
          cache: "no-store"
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível carregar registros financeiros.");
        }

        financialState.loadedTenantId = tenantId;
        renderFinancialRecords(body.records || []);
        addFeed("financial.records.loaded", financialEntityLabel(entity) + " sincronizado");
        return body.records || [];
      }

      function collectFinancialRecordPayload(action) {
        const entity = textValue("#financial-entity") || "financial_entries";
        const code = textValue("#financial-record-code") || ("FIN-" + Date.now());
        const name = textValue("#financial-record-name") || financialEntityLabel(entity);
        const category = textValue("#financial-record-category") || "operacional";
        const currency = (textValue("#financial-record-currency") || textValue("#financial-currency") || "BRL").toUpperCase();
        const amount = numberValue("#financial-record-amount") || numberValue("#financial-price") || 0;
        const country = (textValue("#financial-record-country") || "BR").toUpperCase();
        const channel = textValue("#financial-record-channel") || "marketplace";
        const notes = textValue("#financial-record-notes") || "Registro Helvok";

        const base = {
          code,
          name,
          category,
          currency_code: currency,
          country_code: country,
          channel,
          metadata: {
            source: "helvok-dashboard",
            action: action || "manual",
            entity
          }
        };

        if (entity === "financial_entries") {
          return {
            ...base,
            nature: textValue("#financial-record-nature") || "expense",
            amount,
            competence_date: new Date().toISOString().slice(0, 10),
            status: "draft",
            source_type: action === "simulation" ? "simulation" : "manual",
            tags: [country, channel, category].filter(Boolean),
            notes,
            calculation_memory: {
              plan: collectFinancialPayload(),
              tax_simulation: taxState.lastSimulation || null
            }
          };
        }

        if (entity === "financial_accounts") {
          return { ...base, account_type: "expense", status: "active" };
        }
        if (entity === "cost_centers") {
          return { ...base, allocation_method: "value", status: "active" };
        }
        if (entity === "projects") {
          return { ...base, status: "active", starts_on: new Date().toISOString().slice(0, 10) };
        }
        if (entity === "budgets") {
          return { ...base, period_start: new Date().toISOString().slice(0, 10), period_end: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10), status: "draft" };
        }
        if (entity === "forecasts") {
          return { ...base, forecast_type: "financial", assumptions: collectFinancialPayload(), status: "draft" };
        }
        if (entity === "investments") {
          return { ...base, initial_amount: amount, working_capital: numberValue("#financial-working-capital"), status: "planned", calculation_memory: collectFinancialPayload() };
        }
        if (entity === "pricing_models") {
          return { ...base, model_type: "margin", parameters: collectFinancialPayload(), status: "active", calculation_memory: collectFinancialPayload() };
        }
        if (entity === "product_costs") {
          return { ...base, amount, cost_type: "unit", allocation_method: "quantity", source_type: "manual", valid_from: new Date().toISOString().slice(0, 10) };
        }
        if (entity === "logistics_costs") {
          return { ...base, amount, cost_type: "freight", allocation_method: "value" };
        }
        if (entity === "tax_costs") {
          return { ...base, amount, provision_status: "estimated", source_simulation: taxState.lastSimulation || {}, jurisdiction_path: [country] };
        }
        if (entity === "channel_costs") {
          return { ...base, fixed_amount: amount, cost_type: "commission", rate: numberValue("#tax-marketplace-fee-rate") / 100 };
        }
        if (entity === "cash_flow_periods") {
          return { ...base, period_start: new Date().toISOString().slice(0, 10), period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().slice(0, 10), planned_inflow: amount, planned_outflow: numberValue("#financial-fixed-costs"), calculation_memory: collectFinancialPayload() };
        }
        if (entity === "financial_reports") {
          return { ...base, report_type: "dashboard", title: name, filters: { entity }, result_snapshot: { plan: collectFinancialPayload(), records: financialState.records.slice(0, 20) } };
        }
        if (entity === "spreadsheet_exports") {
          return { ...base, export_type: action || "xlsx", source_type: "ledger", status: "queued", filters: { entity }, calculation_memory: { plan: collectFinancialPayload() } };
        }

        return base;
      }

      async function saveFinancialRecord(event, action) {
        if (event) {
          event.preventDefault();
        }

        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        const entity = textValue("#financial-entity") || "financial_entries";
        if (!tenantId || !accessToken) {
          setFinancialMessage("Entre com uma sessão autorizada para salvar no financeiro.", "warn");
          showAuthGate(true);
          return;
        }

        const button = qs("#financial-record-save-button");
        if (button) {
          button.disabled = true;
          button.textContent = "Salvando no financeiro...";
        }
        setFinancialMessage("Gravando operação financeira auditada...", null);

        try {
          const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/financial/" + encodeURIComponent(entity), {
            method: "POST",
            headers: {
              authorization: "Bearer " + accessToken,
              "content-type": "application/json"
            },
            body: JSON.stringify(collectFinancialRecordPayload(action))
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Financial record failed");
          }

          renderFinancialRecords(body.records || (body.record ? [body.record].concat(financialState.records) : financialState.records));
          setFinancialMessage("Registro financeiro salvo e auditado.", "good");
          addFeed(body.event_type || "financial.record.saved", financialEntityLabel(entity) + " salvo");
        } catch (error) {
          setFinancialMessage(error instanceof Error ? error.message : "Não foi possível salvar o registro financeiro.", "warn");
          addFeed("financial.record.error", "Falha ao salvar financeiro");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Salvar registro financeiro";
          }
        }
      }

      async function upsertFinancialEntity(entity, payload) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!tenantId || !accessToken) {
          showAuthGate(true);
          throw new Error("Sessão autorizada necessária para gravar financeiro.");
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/financial/" + encodeURIComponent(entity), {
          method: "POST",
          headers: {
            authorization: "Bearer " + accessToken,
            "content-type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Financial upsert failed");
        }

        if ((textValue("#financial-entity") || financialState.entity) === entity) {
          renderFinancialRecords(body.records || (body.record ? [body.record].concat(financialState.records) : financialState.records));
        }
        return body;
      }

      function simulationFinancialContext() {
        const simulation = requireCurrentSimulation();
        if (!simulation) {
          return null;
        }

        const totals = simulation.totals || {};
        const market = simulation.market || {};
        const snapshot = simulation.input_snapshot || collectTaxPayload();
        const currency = snapshot.currency || market.currency || taxState.currency || "USD";
        const country = snapshot.destination_country || market.code || textValue("#tax-destination") || "GB";
        const channel = snapshot.channel || textValue("#tax-channel") || "marketplace";
        const category = snapshot.items && snapshot.items[0] ? snapshot.items[0].category : textValue("#tax-item-category") || "goods";
        const taxAmount = Number(totals.destination_indirect_tax || 0) + Number(totals.import_duty || 0) + Number(totals.excise_tax || 0);
        const sellerOut = Number(totals.seller_cash_out || 0);

        return {
          simulation,
          totals,
          market,
          snapshot,
          currency,
          country,
          channel,
          category,
          taxAmount,
          sellerOut,
          today: new Date().toISOString().slice(0, 10)
        };
      }

      async function provisionTaxSimulationCosts() {
        if (!requireTenantWriteSession("Provisionar custos")) {
          return null;
        }

        await ensureCurrentSimulation();
        const context = simulationFinancialContext();
        if (!context) {
          return null;
        }

        const payload = {
          name: "Provisão tributária " + context.country,
          code: "TAX-" + context.country + "-" + Date.now(),
          amount: context.taxAmount,
          currency_code: context.currency,
          country_code: context.country,
          channel: context.channel,
          provision_status: "estimated",
          source_engine: "helvok-tax-engine",
          source_simulation: context.simulation,
          jurisdiction_path: context.simulation.jurisdiction_path || [context.country],
          metadata: {
            source: "tax_simulation",
            category: context.category,
            rule_pack: context.simulation.rule_pack_version || taxState.rulePackVersion || null
          }
        };

        const body = await upsertFinancialEntity("tax_costs", payload);
        setText("#tax-result-status", "custos provisionados");
        showTaxActionMessage("Provisão criada", "Custo tributário registrado em Custos tributários do financeiro.", "good");
        setFinancialMessage("Custo tributário provisionado a partir da simulação.", "good");
        addFeed(body.event_type || "financial.tax_cost.provisioned", "Provisão fiscal criada para " + context.country);
        return body;
      }

      async function createLedgerEntryFromSimulation() {
        if (!requireTenantWriteSession("Criar lançamento")) {
          return null;
        }

        await ensureCurrentSimulation();
        const context = simulationFinancialContext();
        if (!context) {
          return null;
        }

        const payload = {
          category: "simulacao_fiscal_" + context.category,
          nature: "tax",
          amount: context.taxAmount || context.sellerOut,
          currency_code: context.currency,
          competence_date: context.today,
          status: "draft",
          source_type: "simulation",
          country_code: context.country,
          channel: context.channel,
          tags: [context.country, context.channel, context.category, "tax_simulation"].filter(Boolean),
          notes: "Lançamento criado a partir do simulador fiscal Helvok",
          calculation_memory: {
            simulation: context.simulation,
            totals: context.totals
          },
          metadata: {
            source: "tax_simulation",
            ready_for_review: true
          }
        };

        const body = await upsertFinancialEntity("financial_entries", payload);
        setText("#tax-result-status", "lançamento criado");
        showTaxActionMessage("Lançamento criado", "Draft financeiro registrado a partir da simulação fiscal.", "good");
        setSelectValue("#financial-entity", "financial_entries");
        financialState.entity = "financial_entries";
        renderFinancialRecords(body.records || []);
        setFinancialMessage("Lançamento financeiro criado como draft.", "good");
        addFeed(body.event_type || "financial.entry.created", "Lançamento da simulação criado");
        return body;
      }

      async function createPricingModelFromSimulation() {
        if (!requireTenantWriteSession("Criar modelo de preço")) {
          return null;
        }

        await ensureCurrentSimulation();
        const context = simulationFinancialContext();
        if (!context) {
          return null;
        }

        const body = await upsertFinancialEntity("pricing_models", {
          name: "Preço real " + context.country + " / " + context.channel,
          model_type: "country",
          currency_code: context.currency,
          parameters: {
            suggested_unit_price: context.totals.suggested_unit_price || 0,
            customer_total: context.totals.customer_total || 0,
            seller_cash_out: context.totals.seller_cash_out || 0,
            margin_rate: context.totals.seller_gross_margin_rate || 0,
            country: context.country,
            channel: context.channel
          },
          status: "active",
          calculation_memory: {
            simulation: context.simulation
          },
          metadata: {
            source: "tax_simulation"
          }
        });
        setFinancialMessage("Modelo de preço criado a partir da simulação.", "good");
        setText("#tax-result-status", "preço modelado");
        showTaxActionMessage("Modelo de preço criado", "Formação de preço vinculada à simulação fiscal.", "good");
        addFeed(body.event_type || "financial.pricing_model.created", "Modelo de preço da simulação criado");
        return body;
      }

      async function queueSimulationExport() {
        if (!requireTenantWriteSession("Gerar exportação da simulação")) {
          return null;
        }

        await ensureCurrentSimulation();
        const context = simulationFinancialContext();
        if (!context) {
          return null;
        }

        const body = await upsertFinancialEntity("spreadsheet_exports", {
          export_type: "xlsx",
          source_type: "pricing",
          status: "queued",
          filters: {
            source: "tax_simulation",
            country: context.country,
            channel: context.channel
          },
          calculation_memory: {
            simulation: context.simulation,
            financial_plan: collectFinancialPayload()
          },
          metadata: {
            source: "tax_simulation"
          }
        });
        setFinancialMessage("Exportação XLSX da simulação enfileirada.", "good");
        setText("#tax-result-status", "exportação enfileirada");
        showTaxActionMessage("Exportação enfileirada", "XLSX da simulação registrado em Exportações.", "good");
        addFeed(body.event_type || "financial.export.queued", "Exportação da simulação enfileirada");
        return body;
      }

      async function materializeTaxSimulationFinancially() {
        if (!requireTenantWriteSession("Draft + financeiro")) {
          return;
        }

        const button = qs("#tax-simulation-bundle-button");
        if (button) {
          button.disabled = true;
          button.textContent = "Criando pacote...";
        }

        try {
          await provisionTaxSimulationCosts();
          await createLedgerEntryFromSimulation();
          await createPricingModelFromSimulation();
          await queueSimulationExport();
          await createFiscalDocumentDraft();
          addFeed("tax.simulation.materialized", "Simulação virou provisão, lançamento, preço, exportação e draft");
          activateView("financeiro", true);
        } catch (error) {
          setFinancialMessage(error instanceof Error ? error.message : "Não foi possível materializar a simulação.", "warn");
          addFeed("tax.simulation.materialize.error", "Falha ao criar pacote fiscal-financeiro");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Draft + financeiro";
          }
        }
      }

      async function archiveFinancialRecord(record) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        const entity = financialState.entity || "financial_entries";
        if (!record || !record.id || !tenantId || !accessToken) {
          showAuthGate(true);
          setFinancialMessage("Selecione um registro real e entre com sessão autorizada para arquivar.", "warn");
          return;
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/financial/" + encodeURIComponent(entity) + "/" + encodeURIComponent(record.id) + "/archive", {
          method: "POST",
          headers: {
            authorization: "Bearer " + accessToken
          }
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Financial archive failed");
        }
        renderFinancialRecords(body.records || []);
        setFinancialMessage("Registro financeiro arquivado.", "good");
        addFeed(body.event_type || "financial.record.archived", financialEntityLabel(entity) + " arquivado");
      }

      async function reverseFinancialEntry(record) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!record || !record.id || !tenantId || !accessToken) {
          showAuthGate(true);
          setFinancialMessage("Selecione um lançamento real e entre com sessão autorizada para estornar.", "warn");
          return;
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/financial/entries/" + encodeURIComponent(record.id) + "/reverse", {
          method: "POST",
          headers: {
            authorization: "Bearer " + accessToken,
            "content-type": "application/json"
          },
          body: JSON.stringify({ notes: "Estorno solicitado no Helvok Financial Engine" })
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Financial reversal failed");
        }
        setFinancialMessage("Lançamento financeiro estornado.", "good");
        renderFinancialRecords(body.records || []);
        addFeed(body.event_type || "financial.entry.reversed", "Lançamento estornado");
      }

      function exportFinancialModulePdf() {
        const entity = financialState.entity || "financial_entries";
        const rows = financialState.records.slice(0, 24).map((record, index) => ({
          label: String(index + 1).padStart(2, "0") + " - " + (record.name || record.title || record.category || record.code || record.id || "registro"),
          value: [
            record.status,
            record.nature,
            record.currency_code,
            record.amount != null ? record.amount : record.initial_amount
          ].filter((item) => item !== undefined && item !== null && item !== "").join(" / ") || "--"
        }));
        openPrintablePdf("Helvok Financial Engine - " + financialEntityLabel(entity), rows.length > 0 ? rows : [{ label: "Módulo", value: "Sem registros carregados" }]);
        addFeed("financial.report.pdf", "PDF financeiro gerado");
      }

      async function queueFinancialExport(exportType) {
        if (!hasTenantWriteSession()) {
          showAuthGate(true);
          setFinancialMessage("Entre com uma sessão autorizada para gerar exportações reais.", "warn");
          throw new Error("Sessão autorizada necessária para gerar exportação.");
        }

        const currentEntity = textValue("#financial-entity") || financialState.entity || "financial_entries";
        const payload = {
          export_type: exportType,
          source_type: currentEntity === "cash_flow_periods" ? "cash_flow" : currentEntity === "pricing_models" ? "pricing" : currentEntity === "budgets" ? "budget" : currentEntity === "investments" ? "investment" : "ledger",
          status: "queued",
          filters: {
            entity: currentEntity,
            source: "financial_module"
          },
          calculation_memory: {
            plan: collectFinancialPayload(),
            records: financialState.records.slice(0, 50)
          },
          metadata: {
            source: "financial_module",
            requested_at: new Date().toISOString()
          }
        };

        setSelectValue("#financial-entity", "spreadsheet_exports");
        financialState.entity = "spreadsheet_exports";
        const body = await upsertFinancialEntity("spreadsheet_exports", payload);
        renderFinancialRecords(body.records || []);
        setFinancialMessage("Exportação " + exportType.toUpperCase() + " enfileirada com dados reais do tenant.", "good");
        addFeed(body.event_type || "financial.export.queued", "Exportação " + exportType.toUpperCase() + " enfileirada");
        return body;
      }

      async function runFinancialToolbarAction(action, button) {
        const labels = {
          refresh: ["Atualizar", "Atualizando..."],
          csv: ["Gerar CSV", "Gerando CSV..."],
          xlsx: ["Gerar XLSX", "Gerando XLSX..."],
          pdf: ["PDF do módulo", "Gerando PDF..."]
        };
        const label = labels[action] || ["Executar", "Executando..."];

        if (button) {
          button.disabled = true;
          button.textContent = label[1];
        }

        try {
          if (action === "refresh") {
            await loadFinancialRecords(getActiveTenantId());
            setFinancialMessage("Registros financeiros atualizados.", "good");
          } else if (action === "csv") {
            await queueFinancialExport("csv");
          } else if (action === "xlsx") {
            await queueFinancialExport("xlsx");
          } else if (action === "pdf") {
            exportFinancialModulePdf();
            setFinancialMessage("PDF financeiro gerado com os registros carregados.", "good");
          }
        } catch (error) {
          setFinancialMessage(error instanceof Error ? error.message : "Ação financeira falhou.", "warn");
          addFeed("financial.toolbar.error", "Falha na ação do módulo financeiro");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = label[0];
          }
        }
      }

      async function handleFinancialListClick(event) {
        const button = event.target.closest("[data-financial-action]");
        const card = event.target.closest("[data-financial-index]");
        if (!button || !card) {
          return;
        }

        const record = financialState.records[Number(card.getAttribute("data-financial-index") || "-1")];
        const action = button.getAttribute("data-financial-action");
        try {
          if (action === "pdf") {
            openPrintablePdf("Registro financeiro - " + (record.name || record.title || record.category || record.id || "Helvok"), Object.entries(record || {}).slice(0, 18).map(([key, value]) => ({ label: key, value: typeof value === "object" ? JSON.stringify(value) : String(value) })));
            addFeed("financial.record.pdf", "PDF do registro financeiro gerado");
          } else if (action === "archive") {
            await archiveFinancialRecord(record);
          } else if (action === "reverse") {
            await reverseFinancialEntry(record);
          }
        } catch (error) {
          setFinancialMessage(error instanceof Error ? error.message : "Ação financeira falhou.", "warn");
          addFeed("financial.action.error", "Falha em ação financeira");
        }
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

      function renderFiscalAdapterCoverage(adapters, coverage) {
        const summary = qs("#fiscal-adapters-summary");
        if (summary && coverage) {
          summary.textContent =
            coverage.total_adapters + " adaptadores / " + coverage.countries_covered + " países-jurisdição (todos em status planned)";
        }

        const list = qs("#fiscal-adapters-list");
        if (!list) {
          return;
        }

        const grouped = (adapters || []).reduce((acc, adapter) => {
          const key = adapter.region || "outros";
          acc[key] = acc[key] || [];
          acc[key].push(adapter);
          return acc;
        }, {});

        const regionLabels = {
          brazil: "Brasil",
          usa: "Estados Unidos",
          canada: "Canadá",
          europe: "Europa",
          latam: "América Latina",
          asia_pacific: "Ásia-Pacífico",
          middle_east: "Oriente Médio"
        };

        const regions = Object.keys(grouped);
        if (regions.length === 0) {
          list.innerHTML = '<div class="empty-state"><strong>Nenhum adaptador registrado</strong><span>Aguardando catálogo de adaptadores.</span></div>';
          return;
        }

        list.innerHTML = regions.map((region) => {
          const items = grouped[region].map((adapter) =>
            '<div class="tax-line-card">' +
              '<strong>' + escapeHtml(adapter.authority_name || adapter.adapter_key) + '</strong>' +
              '<span>' + escapeHtml(adapter.adapter_key) + ' · ' + escapeHtml((adapter.document_families || []).join(", ")) + '</span>' +
              '<em class="tax-amount">' + escapeHtml(adapter.status || "planned") + '</em>' +
            '</div>'
          ).join("");

          return (
            '<div class="tax-section">' +
              '<div class="tax-section-head"><strong>' + escapeHtml(regionLabels[region] || region) + '</strong><span>' + grouped[region].length + ' adaptador(es)</span></div>' +
              '<div class="tax-line-list">' + items + '</div>' +
            '</div>'
          );
        }).join("");
      }

      async function loadFiscalAdapterCoverage() {
        try {
          const response = await fetch("/v1/fiscal/adapters", { cache: "no-store" });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível carregar adaptadores fiscais.");
          }

          renderFiscalAdapterCoverage(body.adapters || [], body.coverage || null);
          addFeed("fiscal.adapters.loaded", (body.coverage && body.coverage.total_adapters) + " adaptadores de homologação carregados");
          return body.adapters || [];
        } catch (error) {
          addFeed("fiscal.adapters.error", error instanceof Error ? error.message : "Falha ao carregar adaptadores fiscais");
          return [];
        }
      }

      function renderFiscalRejections(rejections) {
        const countLabel = qs("#fiscal-rejections-count");
        if (countLabel) {
          countLabel.textContent = (rejections || []).length + " rejeições";
        }

        const list = qs("#fiscal-rejections-list");
        if (!list) {
          return;
        }

        if (!rejections || rejections.length === 0) {
          list.innerHTML = '<div class="empty-state"><strong>Nenhuma rejeição registrada</strong><span>Documentos rejeitados ou com falha aparecem aqui com o último evento de lifecycle.</span></div>';
          return;
        }

        list.innerHTML = rejections.map((doc) => {
          const lastEvent = doc.last_event || {};
          return (
            '<div class="tax-doc-card">' +
              '<strong>' + escapeHtml(doc.document_type || "Documento") + ' · ' + escapeHtml(doc.country_code || "--") + '</strong>' +
              '<span>status ' + escapeHtml(doc.status || "--") + ' / evento ' + escapeHtml(lastEvent.event_type || "sem evento") + '</span>' +
              '<span>' + escapeHtml(doc.id || "--") + '</span>' +
            '</div>'
          );
        }).join("");
      }

      async function loadFiscalRejections(tenantId) {
        const accessToken = getStoredAccessToken();
        if (!accessToken || !tenantId) {
          renderFiscalRejections([]);
          return [];
        }

        try {
          const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/rejections", {
            headers: { authorization: "Bearer " + accessToken },
            cache: "no-store"
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Não foi possível carregar rejeições fiscais.");
          }

          renderFiscalRejections(body.rejections || []);
          addFeed("fiscal.rejections.loaded", (body.rejections || []).length + " rejeições sincronizadas");
          return body.rejections || [];
        } catch (error) {
          addFeed("fiscal.rejections.error", error instanceof Error ? error.message : "Falha ao carregar rejeições fiscais");
          return [];
        }
      }

      function exportFiscalDocumentPdf(document) {
        if (!document) {
          return;
        }

        openPrintablePdf(
          "Documento fiscal - " + (document.document_type || "Helvok") + " / " + (document.country_code || "--"),
          [
            { label: "Status", value: document.status || "draft" },
            { label: "Lifecycle", value: document.lifecycle_stage || "draft" },
            { label: "Adaptador", value: document.adapter_key || "--" },
            { label: "País", value: document.country_code || "--" },
            { label: "Moeda", value: document.currency_code || "--" },
            { label: "Valor total", value: formatCurrency(document.total_amount || 0, document.currency_code || "BRL") },
            { label: "Imposto", value: formatCurrency(document.tax_amount || 0, document.currency_code || "BRL") },
            { label: "ID", value: document.id || "--" }
          ]
        );
        addFeed("fiscal_document.pdf", "PDF do documento fiscal gerado");
      }

      function editFiscalDocumentDraft(document) {
        if (!document) {
          return;
        }

        const scenario = document.payload && document.payload.scenario ? document.payload.scenario : {};
        const item = scenario.items && scenario.items[0] ? scenario.items[0] : {};
        documentState.editingDocumentId = document.id || "";
        setFieldValue("#tax-origin", scenario.origin_country || "BR");
        setFieldValue("#tax-destination", scenario.destination_country || document.country_code || "GB");
        setFieldValue("#tax-operation-type", scenario.operation_type || "export_goods");
        setFieldValue("#tax-customer-type", scenario.customer_type || "b2c");
        setFieldValue("#tax-incoterm", scenario.incoterm || "DDP");
        setFieldValue("#tax-channel", scenario.channel || "marketplace");
        setFieldValue("#tax-ncm", scenario.ncm || scenario.hs_code || "");
        setFieldValue("#tax-item-description", item.description || document.document_type || "");
        setFieldValue("#tax-item-category", item.category || "goods");
        setFieldValue("#tax-quantity", item.quantity || 1);
        setFieldValue("#tax-unit-price", item.unit_price || 0);
        setFieldValue("#tax-unit-cost", item.unit_cost || 0);
        setText("#documents-view-status", "editando draft " + (document.document_type || "documento"));
        const createButton = qs("#create-fiscal-document-button");
        if (createButton) {
          createButton.textContent = "Atualizar draft fiscal";
        }
        activateView("motor", true);
        runTaxSimulation();
      }

      async function archiveFiscalDocument(document) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!document || !document.id || !tenantId || !accessToken) {
          showAuthGate(true);
          addFeed("fiscal_document.blocked", "Sessão necessária para arquivar documento fiscal");
          return;
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/documents/" + encodeURIComponent(document.id) + "/archive", {
          method: "POST",
          headers: { authorization: "Bearer " + accessToken }
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Fiscal document archive failed");
        }
        renderFiscalDocuments(body.documents || []);
        setText("#documents-view-status", "documento arquivado");
        addFeed(body.event_type || "fiscal_document.archived", "Documento fiscal arquivado");
      }

      async function deleteFiscalDocument(document) {
        const tenantId = getActiveTenantId();
        const accessToken = getStoredAccessToken();
        if (!document || !document.id || !tenantId || !accessToken) {
          showAuthGate(true);
          addFeed("fiscal_document.blocked", "Sessão necessária para excluir documento fiscal");
          return;
        }

        const response = await fetch("/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/documents/" + encodeURIComponent(document.id), {
          method: "DELETE",
          headers: { authorization: "Bearer " + accessToken }
        });
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body && body.error && body.error.message ? body.error.message : "Fiscal document delete failed");
        }
        renderFiscalDocuments(body.documents || []);
        setText("#documents-view-status", "documento excluído");
        addFeed(body.event_type || "fiscal_document.deleted", "Documento fiscal excluído");
      }

      async function handleFiscalDocumentListClick(event) {
        const button = event.target.closest("[data-fiscal-document-action]");
        const card = event.target.closest("[data-fiscal-document-index]");
        if (!button || !card) {
          return;
        }

        const document = documentState.documents[Number(card.getAttribute("data-fiscal-document-index") || "-1")];
        const action = button.getAttribute("data-fiscal-document-action");
        try {
          if (action === "pdf") {
            exportFiscalDocumentPdf(document);
          } else if (action === "edit") {
            editFiscalDocumentDraft(document);
          } else if (action === "archive") {
            await archiveFiscalDocument(document);
          } else if (action === "delete") {
            await deleteFiscalDocument(document);
          }
        } catch (error) {
          setText("#documents-view-status", "erro");
          addFeed("fiscal_document.action.error", error instanceof Error ? error.message : "Falha na ação do documento fiscal");
        }
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
          renderFinancialRecords([]);
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
            loadFiscalRejections(primaryTenant.id).catch((error) => {
              addFeed("fiscal.rejections.error", error instanceof Error ? error.message : "Falha ao carregar rejeições fiscais");
            });
            loadOrganizationsForFiscalRegistration(primaryTenant.id).catch((error) => {
              addFeed("fiscal_registration.organizations.error", error instanceof Error ? error.message : "Falha ao carregar organizações");
            });
            loadFiscalRegistrations(primaryTenant.id).catch((error) => {
              addFeed("fiscal_registration.error", error instanceof Error ? error.message : "Falha ao carregar cadastros fiscais");
            });
            loadFinancialRecords(primaryTenant.id).catch((error) => {
              setFinancialMessage(error instanceof Error ? error.message : "Não foi possível carregar financeiro.", "warn");
              addFeed("financial.records.error", "Falha ao carregar financeiro");
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
          if (isUnknownUserMembershipError(error)) {
            try {
              setMemberMessage("Usuário ainda não entrou no Helvok. Gerando convite de acesso...", null);
              const inviteBody = await createMembershipInvitation(email, roleKey, 7);
              setMemberMessage("Usuário ainda não existe no Auth. Convite criado; copie o link abaixo e envie ao convidado.", "good");
              setInvitationMessage("Convite criado a partir do membership. Copie o link e envie ao usuário.", "good");
              addFeed(inviteBody.event_type || "invitation.created", email + " / " + roleKey);
              qs("#member-email").value = "";
              qs("#invite-email").value = email;
              setSelectValue("#invite-role", roleKey);
              return;
            } catch (invitationError) {
              setMemberMessage(invitationError instanceof Error ? invitationError.message : "Não foi possível criar convite para o usuário.", "warn");
              addFeed("invitation.error", "Falha ao converter membership em convite");
              return;
            }
          }

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

        const simulation = await ensureCurrentSimulation();
        if (!simulation || !simulation.totals) {
          addFeed("fiscal_document.blocked", "Simulação fiscal real necessária para criar draft");
          return;
        }

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
          const documentPayload = {
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
          };
          const editingDocumentId = documentState.editingDocumentId || "";
          const endpoint = editingDocumentId
            ? "/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/documents/" + encodeURIComponent(editingDocumentId)
            : "/v1/tenants/" + encodeURIComponent(tenantId) + "/fiscal/documents";
          const response = await fetch(endpoint, {
            method: editingDocumentId ? "PATCH" : "POST",
            headers: {
              authorization: "Bearer " + accessToken,
              "content-type": "application/json"
            },
            body: JSON.stringify(documentPayload)
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Fiscal document draft failed");
          }

          renderFiscalDocuments(body.documents || (body.document ? [body.document].concat(documentState.documents) : documentState.documents));
          documentState.editingDocumentId = "";
          setText("#documents-view-status", editingDocumentId ? "draft atualizado" : "draft criado");
          addFeed(body.event_type || "fiscal_document.created", documentType + (editingDocumentId ? " draft atualizado para " : " draft criado para ") + countryCode);
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
          setText("#markets-source-label", "Nenhum mercado carregado da API.");
          setText("#markets-source-status", "offline");
          setText("#markets-validation-label", "Sem base para simular ou emitir.");
          setText("#markets-scope-label", "0 oficiais / 0 estimados / 0 manuais");
          setText("#markets-scope-status", "0");
          return;
        }

        const officialCount = markets.filter((market) => market.sourceStatus === "official-seed").length;
        const estimatedCount = markets.filter((market) => market.sourceStatus === "estimated-seed").length;
        const manualCount = markets.filter((market) => market.sourceStatus === "manual-required").length;
        setText("#jurisdiction-count-label", String(markets.length) + " mercados");
        setText("#markets-source-label", "Dados carregados do endpoint versionado /v1/tax/markets.");
        setText("#markets-source-status", "online");
        setText("#markets-validation-label", manualCount + estimatedCount > 0 ? "Há mercados que exigem fonte oficial/homologação antes de emitir." : "Mercados carregados com fonte marcada como oficial.");
        setText("#markets-validation-status", manualCount + estimatedCount > 0 ? "revisar" : "oficial");
        setText("#markets-scope-label", officialCount + " oficiais / " + estimatedCount + " estimados / " + manualCount + " manuais");
        setText("#markets-scope-status", String(markets.length));
        map.innerHTML = markets.map((market) => {
          const active = market.sourceStatus === "official-seed" ? " active" : "";
          const fill = market.sourceStatus === "official-seed" ? "0.86" : market.sourceStatus === "manual-required" ? "0.34" : "0.58";
          const rateLabel = market.standardRate > 0 ? formatPercent(market.standardRate) : "manual";
          const sourceLabel = market.sourceStatus === "official-seed" ? "fonte oficial marcada" : market.sourceStatus === "manual-required" ? "manual obrigatório" : "estimativa seed";
          return (
            '<div class="country-tile' + active + '" style="--fill: ' + fill + ';">' +
              '<strong>' + escapeHtml(market.name) + '</strong>' +
              '<span>' + escapeHtml(market.region) + ' / ' + escapeHtml(market.code) + ' / ' + escapeHtml(market.currency) + '</span>' +
              '<em>' + escapeHtml(market.indirectTaxName) + ' / ' + escapeHtml(market.eInvoiceStatus) + '</em>' +
              '<small>' + escapeHtml(rateLabel) + ' / ' + escapeHtml(sourceLabel) + '</small>' +
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

      function collectFinancialPayload() {
        return {
          scenario: textValue("#financial-scenario") || "base",
          currency: textValue("#financial-currency") || "BRL",
          period_months: numberValue("#financial-period") || 12,
          volume_units: numberValue("#financial-volume") || 1,
          unit_price: numberValue("#financial-price"),
          unit_cost: numberValue("#financial-unit-cost"),
          fixed_costs: numberValue("#financial-fixed-costs"),
          logistics_costs: numberValue("#financial-logistics-costs"),
          tax_costs: numberValue("#financial-tax-costs"),
          channel_costs: numberValue("#financial-channel-costs"),
          working_capital: numberValue("#financial-working-capital"),
          investment_initial: numberValue("#financial-investment"),
          target_margin_rate: numberValue("#financial-target-margin"),
          discount_rate: numberValue("#financial-discount-rate")
        };
      }

      async function runFinancialPlan(event) {
        if (event) {
          event.preventDefault();
        }

        const button = qs("#financial-plan-button");
        if (button) {
          button.disabled = true;
          button.textContent = "Calculando no Helvok...";
        }
        setText("#financial-result-status", "calculando");

        try {
          const response = await fetch("/v1/financial/plan", {
            method: "POST",
            headers: {
              "content-type": "application/json"
            },
            body: JSON.stringify(collectFinancialPayload())
          });
          const body = await response.json();
          if (!response.ok) {
            throw new Error(body && body.error && body.error.message ? body.error.message : "Financial plan failed");
          }
          renderFinancialPlan(body.plan);
          addFeed(body.event_type || "financial.plan.calculated", "Plano financeiro recalculado");
        } catch (error) {
          setText("#financial-result-status", "erro");
          const warnings = qs("#financial-warnings");
          if (warnings) {
            warnings.innerHTML = '<div class="tax-warning-card"><strong>Falha no planejamento</strong><span>' + escapeHtml(error instanceof Error ? error.message : "Erro desconhecido") + '</span></div>';
          }
          addFeed("financial.plan.error", "Falha ao calcular planejamento");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Calcular plano financeiro";
          }
        }
      }

      function renderFinancialPlan(plan) {
        if (!plan || !plan.totals) {
          return;
        }
        const currency = plan.currency || "BRL";
        const totals = plan.totals;
        setText("#financial-result-status", "plano vivo");
        setText("#financial-scenario-label", plan.scenario || "base");
        setText("#financial-revenue", formatCurrency(totals.revenue, currency));
        setText("#financial-net-margin", formatCurrency(totals.net_margin, currency) + " / " + formatPercent(totals.net_margin_rate));
        setText("#financial-suggested-price", formatCurrency(totals.suggested_unit_price, currency));
        setText("#financial-break-even", String(totals.break_even_units || 0) + " un.");
        setText("#financial-roi", formatPercent(totals.roi || 0));
        setText("#financial-payback", totals.payback_months ? String(totals.payback_months) + " meses" : "sem payback");

        const lines = qs("#financial-lines");
        if (lines) {
          lines.innerHTML = [
            ["Custos diretos", totals.direct_costs],
            ["Custos indiretos", totals.indirect_costs],
            ["Custos totais", totals.total_costs],
            ["Markup", totals.markup],
            ["Preço mínimo", totals.minimum_unit_price],
            ["VPL", totals.npv],
            ["TIR", totals.irr == null ? 0 : totals.irr],
            ["Desvio previsto x realizado", totals.variance_amount],
            ["Custo alocado", totals.allocated_cost]
          ].map((line) => (
            '<div class="tax-line-card"><div><strong>' + escapeHtml(line[0]) + '</strong><span>memória Helvok Financial Engine</span></div><em class="tax-amount">' +
            escapeHtml(line[0] === "Markup" || line[0] === "TIR" ? formatPercent(line[1]) : formatCurrency(line[1], currency)) +
            '</em></div>'
          )).join("");
        }

        const warnings = qs("#financial-warnings");
        if (warnings) {
          warnings.innerHTML = (plan.warnings || []).map((warning) => (
            '<div class="tax-warning-card"><strong>Alerta financeiro</strong><span>' + escapeHtml(warning) + '</span></div>'
          )).join("");
        }
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
          if (!body.simulation || !body.simulation.totals) {
            throw new Error("O Worker não retornou totais de imposto para esta simulação.");
          }
          renderTaxSimulation(body.simulation);
          runTaxComparison(false);
          setText("#tax-result-status", "calculado " + formatCurrency(body.simulation.totals.customer_total || 0, body.simulation.input_snapshot && body.simulation.input_snapshot.currency ? body.simulation.input_snapshot.currency : taxState.currency));
          addFeed(body.event_type || "tax.simulation.completed", "Custo total e impostos recalculados");
          return body.simulation;
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
        return null;
      }

      async function runTaxComparison(showLoading) {
        const button = qs("#tax-compare-button");
        if (showLoading && button) {
          button.disabled = true;
          button.textContent = "Comparando...";
        }
        setText("#tax-compare-status", "comparando mercados");

        const payload = collectTaxPayload();
        const destinations = taxState.markets.length > 0
          ? taxState.markets.map((market) => market.code).filter((code) => code && code !== payload.origin_country).slice(0, 40)
          : ["PT", "DE", "FR", "ES", "IT", "NL", "GB", "US", "CA", "JP", "SG", "AU", "AG", "BB", "DO", "JM", "LC", "KN", "VC", "TT"];

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

      function showTaxActionMessage(title, message, tone) {
        const warnings = qs("#tax-warnings");
        if (!warnings) {
          return;
        }

        const cardClass = tone === "good" ? "tax-line-card" : "tax-warning-card";
        const current = warnings.innerHTML || "";
        warnings.innerHTML =
          '<div class="' + cardClass + '"><strong>' + escapeHtml(title) + '</strong><span>' + escapeHtml(message) + '</span></div>' +
          current;
      }

      function hasTenantWriteSession() {
        return Boolean(getActiveTenantId() && getStoredAccessToken());
      }

      function requireTenantWriteSession(actionLabel) {
        if (hasTenantWriteSession()) {
          return true;
        }

        showAuthGate(true);
        setText("#tax-result-status", "login necessário");
        showTaxActionMessage(
          "Sessão necessária",
          actionLabel + " grava dados reais no Supabase. Entre com uma conta autorizada do tenant para continuar.",
          "warn",
        );
        addFeed("tax.action.auth_required", actionLabel + " exige sessão do tenant");
        return false;
      }

      function requireCurrentSimulation() {
        if (!taxState.lastSimulation || !taxState.lastSimulation.totals) {
          setText("#tax-result-status", "sem simulação");
          addFeed("tax.simulation.empty", "Calcule antes de acionar a simulação");
          return null;
        }
        return taxState.lastSimulation;
      }

      async function ensureCurrentSimulation() {
        if (taxState.lastSimulation && taxState.lastSimulation.totals) {
          return taxState.lastSimulation;
        }

        setText("#tax-result-status", "calculando antes da ação");
        addFeed("tax.simulation.autorun", "Calculando simulação antes da ação solicitada");
        const simulation = await runTaxSimulation();
        return simulation && simulation.totals ? simulation : requireCurrentSimulation();
      }

      async function exportCurrentSimulationPdf() {
        const simulation = await ensureCurrentSimulation();
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
        setText("#tax-result-status", "PDF gerado");
        addFeed("tax.simulation.pdf", "PDF operacional da simulação gerado");
      }

      async function archiveCurrentSimulation() {
        const simulation = await ensureCurrentSimulation();
        if (!simulation) {
          return;
        }

        const button = qs("#tax-simulation-archive-button");
        if (button) {
          button.disabled = true;
          button.textContent = "Arquivando...";
        }

        const totals = simulation.totals || {};
        const market = simulation.market || {};
        const snapshot = simulation.input_snapshot || {};
        const currency = snapshot.currency || market.currency || taxState.currency || "USD";
        const title = "Simulação fiscal " + (market.name || snapshot.destination_country || "mercado") + " / " + formatTime(new Date());

        try {
          if (getActiveTenantId() && getStoredAccessToken()) {
            const body = await upsertFinancialEntity("financial_reports", {
              report_type: "calculation_memory",
              title,
              filters: {
                source: "tax_simulation",
                country: snapshot.destination_country || market.code || null,
                channel: snapshot.channel || null,
                currency
              },
              result_snapshot: {
                simulation,
                totals,
                archived_at: new Date().toISOString()
              },
              reproducibility_hash: "tax-simulation-" + Date.now()
            });
            setSelectValue("#financial-entity", "financial_reports");
            financialState.entity = "financial_reports";
            renderFinancialRecords(body.records || []);
            setText("#tax-result-status", "simulação arquivada");
            setFinancialMessage("Simulação arquivada no financeiro do tenant.", "good");
            addFeed(body.event_type || "tax.simulation.archived", "Simulação arquivada no Supabase");
            return;
          }
        } catch (error) {
          setFinancialMessage(error instanceof Error ? error.message : "Falha ao arquivar no Supabase.", "warn");
          addFeed("tax.simulation.archive.error", "Falha ao arquivar no financeiro");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Arquivar simulação";
          }
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

        taxState.lastSimulation = null;
        taxState.lastComparison = null;
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

      async function runOperationalScan(button) {
        if (button) {
          button.disabled = true;
          button.textContent = "Varrendo...";
        }

        try {
          await refreshStatus();
          await loadTaxMarkets();
          await runTaxComparison(false);
          await runFinancialPlan();

          const tenantId = getActiveTenantId();
          if (tenantId && getStoredAccessToken()) {
            await Promise.allSettled([
              loadTenantAccess(tenantId),
              loadCatalogItems(tenantId),
              loadFiscalDocuments(tenantId),
              loadFiscalRejections(tenantId),
              loadOrganizationsForFiscalRegistration(tenantId),
              loadFiscalRegistrations(tenantId),
              loadFinancialRecords(tenantId)
            ]);
          }

          setText("#last-sync", formatTime(new Date()));
          addFeed("manual.scan.completed", "Varredura operacional executada nas abas principais");
        } catch (error) {
          addFeed("manual.scan.error", error instanceof Error ? error.message : "Falha na varredura operacional");
        } finally {
          if (button) {
            button.disabled = false;
            button.textContent = "Executar varredura";
          }
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
          runOperationalScan(button);
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
        taxSimulateButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          runTaxSimulation(event);
        }, true);
        taxSimulateButton.addEventListener("click", runTaxSimulation);
      }

      const taxCompareButton = qs("#tax-compare-button");
      if (taxCompareButton) {
        taxCompareButton.addEventListener("click", () => runTaxComparison(true));
      }

      const financialPlanForm = qs("#financial-plan-form");
      if (financialPlanForm) {
        financialPlanForm.noValidate = true;
        financialPlanForm.addEventListener("submit", runFinancialPlan);
      }

      const financialPlanButton = qs("#financial-plan-button");
      if (financialPlanButton) {
        financialPlanButton.addEventListener("click", runFinancialPlan);
      }

      const financialRecordForm = qs("#financial-record-form");
      if (financialRecordForm) {
        financialRecordForm.noValidate = true;
        financialRecordForm.addEventListener("submit", saveFinancialRecord);
      }

      const financialEntity = qs("#financial-entity");
      if (financialEntity) {
        financialEntity.addEventListener("change", () => {
          financialState.entity = textValue("#financial-entity") || "financial_entries";
          loadFinancialRecords(getActiveTenantId()).catch((error) => {
            setFinancialMessage(error instanceof Error ? error.message : "Não foi possível carregar o módulo financeiro.", "warn");
          });
        });
      }

      const financialActionRow = qs(".financial-action-row");
      if (financialActionRow) {
        financialActionRow.addEventListener("click", (event) => {
          const button = event.target.closest("[data-financial-toolbar-action]");
          if (!button) {
            return;
          }
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          runFinancialToolbarAction(button.getAttribute("data-financial-toolbar-action") || "", button);
        }, true);
      }

      const financialRefreshButton = qs("#financial-refresh-button");
      if (financialRefreshButton) {
        financialRefreshButton.addEventListener("click", async (event) => {
          event.stopImmediatePropagation();
          financialRefreshButton.disabled = true;
          financialRefreshButton.textContent = "Atualizando...";
          try {
            await loadFinancialRecords(getActiveTenantId());
            setFinancialMessage("Registros financeiros atualizados.", "good");
          } catch (error) {
            setFinancialMessage(error instanceof Error ? error.message : "Não foi possível atualizar financeiro.", "warn");
          } finally {
            financialRefreshButton.disabled = false;
            financialRefreshButton.textContent = "Atualizar registros";
          }
        }, true);
        financialRefreshButton.addEventListener("click", () => {
          loadFinancialRecords(getActiveTenantId()).catch((error) => {
            setFinancialMessage(error instanceof Error ? error.message : "Não foi possível atualizar financeiro.", "warn");
          });
        });
      }

      const financialRecordsList = qs("#financial-records-list");
      if (financialRecordsList) {
        financialRecordsList.addEventListener("click", handleFinancialListClick);
      }

      const financialCsvButton = qs("#financial-export-csv-button");
      if (financialCsvButton) {
        financialCsvButton.addEventListener("click", async (event) => {
          event.stopImmediatePropagation();
          financialCsvButton.disabled = true;
          financialCsvButton.textContent = "Gerando CSV...";
          try {
            await queueFinancialExport("csv");
          } catch (error) {
            setFinancialMessage(error instanceof Error ? error.message : "Não foi possível gerar CSV.", "warn");
          } finally {
            financialCsvButton.disabled = false;
            financialCsvButton.textContent = "Exportar CSV";
          }
        }, true);
        financialCsvButton.addEventListener("click", () => queueFinancialExport("csv"));
      }

      const financialXlsxButton = qs("#financial-export-xlsx-button");
      if (financialXlsxButton) {
        financialXlsxButton.addEventListener("click", async (event) => {
          event.stopImmediatePropagation();
          financialXlsxButton.disabled = true;
          financialXlsxButton.textContent = "Gerando XLSX...";
          try {
            await queueFinancialExport("xlsx");
          } catch (error) {
            setFinancialMessage(error instanceof Error ? error.message : "Não foi possível gerar XLSX.", "warn");
          } finally {
            financialXlsxButton.disabled = false;
            financialXlsxButton.textContent = "Exportar XLSX";
          }
        }, true);
        financialXlsxButton.addEventListener("click", () => queueFinancialExport("xlsx"));
      }

      const financialReportPdfButton = qs("#financial-report-pdf-button");
      if (financialReportPdfButton) {
        financialReportPdfButton.addEventListener("click", exportFinancialModulePdf);
      }

      const taxSimulationPdfButton = qs("#tax-simulation-pdf-button");
      if (taxSimulationPdfButton) {
        taxSimulationPdfButton.addEventListener("click", async () => {
          taxSimulationPdfButton.disabled = true;
          taxSimulationPdfButton.textContent = "Gerando PDF...";
          try {
            await exportCurrentSimulationPdf();
          } catch (error) {
            setText("#tax-result-status", "erro no PDF");
            addFeed("tax.simulation.pdf.error", error instanceof Error ? error.message : "Falha ao gerar PDF");
          } finally {
            taxSimulationPdfButton.disabled = false;
            taxSimulationPdfButton.textContent = "PDF da simulação";
          }
        });
      }

      const taxSimulationProvisionButton = qs("#tax-simulation-provision-button");
      if (taxSimulationProvisionButton) {
        taxSimulationProvisionButton.addEventListener("click", async () => {
          taxSimulationProvisionButton.disabled = true;
          taxSimulationProvisionButton.textContent = "Provisionando...";
          try {
            await provisionTaxSimulationCosts();
          } catch (error) {
            setFinancialMessage(error instanceof Error ? error.message : "Não foi possível provisionar custos.", "warn");
            addFeed("financial.tax_cost.error", "Falha ao provisionar custo fiscal");
          } finally {
            taxSimulationProvisionButton.disabled = false;
            taxSimulationProvisionButton.textContent = "Provisionar custos";
          }
        });
      }

      const taxSimulationLedgerButton = qs("#tax-simulation-ledger-button");
      if (taxSimulationLedgerButton) {
        taxSimulationLedgerButton.addEventListener("click", async () => {
          taxSimulationLedgerButton.disabled = true;
          taxSimulationLedgerButton.textContent = "Criando...";
          try {
            await createLedgerEntryFromSimulation();
          } catch (error) {
            setFinancialMessage(error instanceof Error ? error.message : "Não foi possível criar lançamento.", "warn");
            addFeed("financial.entry.error", "Falha ao criar lançamento da simulação");
          } finally {
            taxSimulationLedgerButton.disabled = false;
            taxSimulationLedgerButton.textContent = "Criar lançamento";
          }
        });
      }

      const taxSimulationBundleButton = qs("#tax-simulation-bundle-button");
      if (taxSimulationBundleButton) {
        taxSimulationBundleButton.addEventListener("click", async () => {
          taxSimulationBundleButton.disabled = true;
          taxSimulationBundleButton.textContent = "Criando pacote...";
          try {
            await materializeTaxSimulationFinancially();
          } catch (error) {
            setText("#tax-result-status", "erro no pacote");
            addFeed("tax.simulation.bundle.error", error instanceof Error ? error.message : "Falha ao criar pacote fiscal-financeiro");
          } finally {
            taxSimulationBundleButton.disabled = false;
            taxSimulationBundleButton.textContent = "Draft + financeiro";
          }
        });
      }

      const taxSimulationArchiveButton = qs("#tax-simulation-archive-button");
      if (taxSimulationArchiveButton) {
        taxSimulationArchiveButton.addEventListener("click", async () => {
          taxSimulationArchiveButton.disabled = true;
          taxSimulationArchiveButton.textContent = "Arquivando...";
          try {
            await archiveCurrentSimulation();
          } catch (error) {
            setText("#tax-result-status", "erro ao arquivar");
            addFeed("tax.simulation.archive.error", error instanceof Error ? error.message : "Falha ao arquivar simulação");
          } finally {
            taxSimulationArchiveButton.disabled = false;
            taxSimulationArchiveButton.textContent = "Arquivar simulação";
          }
        });
      }

      const taxSimulationDeleteButton = qs("#tax-simulation-delete-button");
      if (taxSimulationDeleteButton) {
        taxSimulationDeleteButton.addEventListener("click", () => {
          taxSimulationDeleteButton.disabled = true;
          taxSimulationDeleteButton.textContent = "Excluindo...";
          try {
            clearCurrentSimulation();
          } catch (error) {
            setText("#tax-result-status", "erro ao excluir");
            addFeed("tax.simulation.delete.error", error instanceof Error ? error.message : "Falha ao excluir simulação");
          } finally {
            taxSimulationDeleteButton.disabled = false;
            taxSimulationDeleteButton.textContent = "Excluir simulação";
          }
        });
      }

      const createFiscalDocumentButton = qs("#create-fiscal-document-button");
      if (createFiscalDocumentButton) {
        createFiscalDocumentButton.addEventListener("click", createFiscalDocumentDraft);
      }

      const fiscalDocumentsList = qs("#fiscal-documents-list");
      if (fiscalDocumentsList) {
        fiscalDocumentsList.addEventListener("click", handleFiscalDocumentListClick);
      }

      const fiscalRegistrationsList = qs("#fiscal-registrations-list");
      if (fiscalRegistrationsList) {
        fiscalRegistrationsList.addEventListener("click", handleFiscalRegistrationListClick);
      }

      const fiscalRegistrationForm = qs("#fiscal-registration-form");
      if (fiscalRegistrationForm) {
        fiscalRegistrationForm.addEventListener("submit", submitFiscalRegistrationForm);
      }

      ["#tax-destination", "#tax-origin", "#tax-incoterm", "#tax-operation-type", "#tax-customer-type", "#tax-channel", "#tax-item-category"].forEach((selector) => {
        const node = qs(selector);
        if (node) {
          node.addEventListener("change", () => runTaxSimulation());
        }
      });

      const financialScenario = qs("#financial-scenario");
      if (financialScenario) {
        financialScenario.addEventListener("change", () => runFinancialPlan());
      }

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
      loadFiscalAdapterCoverage();
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
