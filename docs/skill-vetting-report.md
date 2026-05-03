# SKILL VETTING REPORT
═══════════════════════════════════════
**Date:** 2026-04-15
**Reviewer:** Jarvis
**Collection:** Minimalist Entrepreneur 10 Skills by Sahil Lavingia

───────────────────────────────────────
## 1. find-community
**Version:** 1.0.3
**Source:** ClawHub / github.com/slavingia/skills
**Author:** Sahil Lavingia (well-known founder of Gumroad)

### Files Reviewed: 4 (SKILL.md, README.md, _meta.json, origin.json)
### RED FLAGS: None
- No external network calls
- No filesystem access outside skill directory
- No credential requests
- No obfuscated code
- No eval/exec of external input

### PERMISSIONS NEEDED:
- **Files:** Read-only, just guidance text
- **Network:** None required
- **Commands:** None required

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

### NOTES:
Pure guidance skill based on "The Minimalist Entrepreneur" book. No code execution, just AI-guided conversation framework.

───────────────────────────────────────
## 2. validate-idea
**Version:** 1.0.0
**Source:** ClawHub / github.com/slavingia/skills

### Files Reviewed: 4
### RED FLAGS: None

### PERMISSIONS NEEDED:
- Files: Guidance text only
- Network: None
- Commands: None

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

### NOTES:
Pure guidance framework for validating business ideas. No executable code.

───────────────────────────────────────
## 3. mvp
**Version:** 1.0.0
**Source:** ClawHub

### Files Reviewed: 11 (SKILL.md + 8 markdown content files + metadata)
### RED FLAGS: None

### PERMISSIONS NEEDED:
- Files: Reads markdown guidance files
- Network: None
- Commands: None

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

### NOTES:
Contains detailed MVP frameworks, scope management, validation techniques. All plain text guidance. No executable code.

───────────────────────────────────────
## 4. processize
**Version:** 1.0.0
**Source:** ClawHub / github.com/slavingia/skills

### Files Reviewed: 4
### RED FLAGS: None

### PERMISSIONS NEEDED:
- Files: Guidance text only
- Network: None
- Commands: None

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

───────────────────────────────────────
## 5. first-customers
**Version:** 1.0.0
**Source:** ClawHub / github.com/slavingia/skills

### Files Reviewed: 4
### RED FLAGS: None

### PERMISSIONS NEEDED:
- Files: Guidance text only
- Network: None
- Commands: None

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

───────────────────────────────────────
## 6. pricing
**Version:** 1.0.0
**Source:** ClawHub

### Files Reviewed: 4
### RED FLAGS: None

### PERMISSIONS NEEDED:
- Files: Guidance text only
- Network: None
- Commands: None

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

### NOTES:
Pricing strategy framework. All guidance-based, no executable code.

───────────────────────────────────────
## 7. marketing-plan
**Version:** 1.0.2
**Source:** ClawHub

### Files Reviewed: 3 (SKILL.md, LICENSE, _meta.json)
### RED FLAGS: ⚠️ One finding - requires python-docx dependency

- Skill includes Python code in SKILL.md for generating Word documents
- No external network calls except what web search already does
- Reads/writes only to workspace (user-controlled)
- Dependency: `pip install python-docx` - clearly documented

### PERMISSIONS NEEDED:
- **Files:** Reads nothing outside workspace, writes .docx outputs to workspace
- **Network:** Requires web search for market data (already available via OpenClaw)
- **Commands:** Pip install python-docx (one-time setup)

### RISK LEVEL: 🟡 MEDIUM

### VERDICT: ⚠️ SAFE TO INSTALL WITH CAUTION

### NOTES:
Python code is visible, not obfuscated. Only generates Word documents in workspace. No credential access. The risk is minimal but it's executable code so classified as MEDIUM.

───────────────────────────────────────
## 8. grow-sustainably
**Version:** 1.0.0
**Source:** ClawHub / github.com/slavingia/skills

### Files Reviewed: 4
### RED FLAGS: None

### PERMISSIONS NEEDED:
- Files: Guidance text only
- Network: None
- Commands: None

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

───────────────────────────────────────
## 9. company-values
**Version:** 1.0.0
**Source:** ClawHub / github.com/slavingia/skills

### Files Reviewed: 4
### RED FLAGS: None

### PERMISSIONS NEEDED:
- Files: Guidance text only
- Network: None
- Commands: None

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

───────────────────────────────────────
## 10. minimalist-review
**Version:** 1.0.0
**Source:** ClawHub / github.com/slavingia/skills

### Files Reviewed: 4
### RED FLAGS: None

### PERMISSIONS NEEDED:
- Files: Guidance text only
- Network: None
- Commands: None

### RISK LEVEL: 🟢 LOW

### VERDICT: ✅ SAFE TO INSTALL

───────────────────────────────────────
## SUMMARY

| Skill | Risk Level | Verdict |
|-------|------------|---------|
| find-community | 🟢 LOW | ✅ Install |
| validate-idea | 🟢 LOW | ✅ Install |
| mvp | 🟢 LOW | ✅ Install |
| processize | 🟢 LOW | ✅ Install |
| first-customers | 🟢 LOW | ✅ Install |
| pricing | 🟢 LOW | ✅ Install |
| marketing-plan | 🟡 MEDIUM | ⚠️ Install with caution |
| grow-sustainably | 🟢 LOW | ✅ Install |
| company-values | 🟢 LOW | ✅ Install |
| minimalist-review | 🟢 LOW | ✅ Install |

### OVERALL VERDICT: 9/10 🟢 LOW RISK, 1/10 🟡 MEDIUM RISK
**All 10 skills are safe to install.**

- 9 skills are pure guidance/conversation frameworks (no executable code) - completely safe
- marketing-plan contains Python code for Word document generation. Code is visible, no suspicious behavior, only writes to workspace. Requires one-time `pip install python-docx`.

### Source Attribution:
All skills are based on **The Minimalist Entrepreneur** by **Sahil Lavingia** (founder of Gumroad), MIT License. Source: https://github.com/slavingia/skills

═══════════════════════════════════════
