# clawhub-cli

CLI tool for searching, installing, and managing OpenClaw skills from clawhub.com.

## Core Principles

- **Minimal**: Small footprint, minimal dependencies
- **Self-contained**: No external services required beyond the registry API
- **Batteries included**: Works out of the box with sensible defaults
- **Deterministic**: Same inputs produce same outputs

## Installation

```bash
npm install -g clawhub-cli
```

## Usage

### Search for skills

```bash
clawhub search <query>

# Example
clawhub search weather
clawhub search "stock analysis" --limit 20
```

### Install a skill

```bash
clawhub install <skill-name>

# Examples
clawhub install weather
clawhub install us-stock-analysis@1.2.3
clawhub install my-skill --force   # Reinstall
clawhub install my-skill --no-vet  # Skip security check (not recommended)
```

### List installed skills

```bash
clawhub list
clawhub list --verbose
```

### Check for updates

```bash
clawhub update
clawhub update weather
clawhub update --dry-run
```

### Vet a skill locally

```bash
clawhub vet ./path/to/skill
```

### Publish a skill

```bash
clawhub publish ./path/to/skill
```

## Security Features

- Automatic security vetting before installation
- Detects hardcoded secrets, eval() usage, and shell execution
- Manifest schema validation
- Required SKILL.md file check

## Configuration

Environment variables:

- `CLAWHUB_REGISTRY`: Custom registry URL (default: https://api.clawhub.com/v1)
- `CLAWHUB_SKILLS_DIR`: Skill installation directory

## License

MIT
