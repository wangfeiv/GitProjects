# SKILL VETTING REPORT - gstack
═══════════════════════════════════════
**Date:** 2026-04-15
**Reviewer:** Jarvis
**Skill:** gstack - Fast headless browser for QA testing
**Version:** 1.1.0 (0.3.3)
**Source:** ClawHub / GitHub (Garry's Stack)

───────────────────────────────────────
## Overview

gstack is a collection of Claude Code/OpenClaw skills for AI-assisted engineering. The core feature is **gstack browse** — a persistent headless Chromium browser for QA testing, site verification, and automated interaction.

### What it does:
- Navigate URLs, interact with elements, take screenshots
- Verify page states, test user flows (login, checkout, forms)
- Import cookies from your real browser for testing authenticated pages
- Diff page changes after actions
- Test responsive layouts, file uploads, dialogs

───────────────────────────────────────
## Files Reviewed

- SKILL.md (main documentation)
- browse/src/*.ts (all source code)
- package.json (dependencies)
- All sub-skill SKILL.md files (review, qa, ship, etc.)

Total source code: ~2,000+ lines of TypeScript. All code is readable, well-structured, not obfuscated.

───────────────────────────────────────
## RED FLAG ANALYSIS

| Check | Result | Notes |
|-------|--------|-------|
| curl/wget to unknown URLs | ✅ Clean | Only localhost HTTP for internal server communication |
| Sends data to external servers | ✅ Clean | No exfiltration. Only browses the URLs you specify |
| Requests credentials/API keys | ✅ Clean | No credential requests. Cookie import is optional/user-initiated |
| Reads ~/.ssh, ~/.aws etc. | ✅ Clean | Only reads browser cookie databases when you explicitly run cookie import |
| Reads MEMORY.md/USER.md etc. | ✅ Clean | No access to OpenClaw sensitive files |
| base64 decode of unknown input | ✅ Clean | No obfuscation |
| eval()/exec() with external input | ✅ Clean | No dangerous evaluation. Only spawns Chromium via Playwright |
| Modifies system files outside workspace | ✅ Clean | All state stored in `~/.gstack/` or project-local `.gstack/` |
| Installs packages without listing | ✅ Clean | All dependencies in package.json, clearly documented |
| Network calls to IPs instead of domains | ✅ Clean | Only localhost for internal server |
| Obfuscated code | ✅ Clean | All source is visible TypeScript |
| Requests sudo/elevated permissions | ✅ Clean | No requests for elevated permissions |
| Accesses browser cookies/sessions | ⚠️ *Intentional* | Only when you explicitly run `cookie-import-browser`. The feature is designed to import your existing cookies for testing. All code is transparent about this. |

### RED FLAGS: None found.

The "suspicious" flag from VirusTotal is a false positive — it flags because:
1. The skill accesses browser cookie databases (which is the *intended feature* for cookie import)
2. It uses crypto for AES decryption of cookies (which is necessary for the feature)
3. It spawns Chromium via Playwright (normal browser automation)

───────────────────────────────────────
## PERMISSIONS NEEDED

| Category | Permissions | Notes |
|----------|-------------|-------|
| **Files** | Read/write to: <br> - `~/.gstack/sessions/` (session state) <br> - Project `.gstack/` (project state) <br> - `/tmp/` (screenshots output) <br> - Browser cookie databases (only for cookie import) | No access to sensitive files outside of what's required for the feature |
| **Network** | - Local HTTP server on localhost (internal CLI ↔ browser communication) <br> - Accesses whatever URLs you tell it to browse | No outbound calls to mysterious domains. All navigation is user-directed |
| **Commands** | - Requires `bun` JavaScript runtime <br> - Runs compiled TypeScript binaries <br> - Spawns Chromium via Playwright | All dependencies are clearly listed in setup step |

───────────────────────────────────────
## DEPENDENCIES

- **bun** >= 1.0.0 (required to build/run)
- **playwright** ^1.58.2 (browser automation)
- **diff** ^7.0.0 (page diffs)
- **bun:sqlite** (cookie database reading)

All are standard, well-maintained packages.

───────────────────────────────────────
## Risk Assessment

### 🔍 Sensitive Feature: Cookie Import

gstack can **import cookies from your real browser** (Chrome, Arc, Brave, Edge, Comet). This is:
- **Intended feature:** Lets you test authenticated pages using your existing login session
- **Opt-in:** You only run this when you need it
- **Transparent:** Code is open, all decryption logic is visible
- **Local-only:** Cookies never leave your machine, only used by the local browser instance

This is a **legitimate feature** for QA testing, not credential theft. The code is well-written and doesn't exfiltrate anything.

### Other Features

All other features (navigation, clicking, screenshots, assertions) are standard browser automation that any AI agent might need for testing web apps.

───────────────────────────────────────
## RISK LEVEL: 🟡 MEDIUM

**Why MEDIUM and not LOW?**
- It runs native compiled code (the browse binary)
- It can access the network to browse any site
- It can read your browser cookies when you use the cookie import feature
- It requires bun runtime and playwright which are substantial dependencies

But the risk is **acceptable** because:
- All source code is visible and auditable
- No malicious behavior found
- It's a well-known open source project (Garry's Stack)
- Permissions are scoped to what the feature actually needs

───────────────────────────────────────
## VERDICT: ✅ SAFE TO INSTALL

gstack is a legitimate, high-quality skill for headless browser automation. The VirusTotal flag is a false positive due to the cookie import functionality, which is intentional and transparent.

**Recommendation:** Install and use. When using cookie import, be aware that you're granting access to your browser cookies — only use this with sites you trust.

────────────────═════════════════════
## Setup Notes

After installation, one-time setup is required:
```bash
cd skills/gstack
./setup
```

Setup will:
1. Install bun if not already installed
2. Install dependencies
3. Compile the browse binary
4. Install Playwright browsers

───────────────────────────────────────
**License:** MIT
**Source:** https://github.com/garredow/gstack
═══════════════════════════════════════
