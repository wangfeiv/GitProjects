# clawhub

Use the ClawHub CLI to search, install, update, and publish agent skills from clawhub.com.

## Description

This skill provides the `clawhub` command-line tool for managing OpenClaw skills. It acts as a package manager for AI agent capabilities.

## Usage

### Search for skills

```
clawhub search <query>
```

### Install a skill

```
clawhub install <skill-name>
```

### List installed skills

```
clawhub list
```

### Update skills

```
clawhub update
```

### Vet a skill

```
clawhub vet <path>
```

### Publish a skill

```
clawhub publish <path>
```

## Features

- 🔍 Search the ClawHub registry
- 🔒 Automatic security vetting before installation
- 📦 Deterministic installations
- 🔄 Version management
- 📝 Manifest validation

## Permissions

- network: Required to access the ClawHub registry
- fs.read/fs.write: Required to install and manage skills
- shell: Required to install npm dependencies for skills
