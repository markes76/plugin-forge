# Plugin Forge

A desktop application for visually building plugins for **Claude Code** and **Cowork**. No CLI knowledge required.

![Plugin Forge](plugin-forge.png)

## What it does

Plugin Forge lets you create fully valid Claude Code plugins through a clean GUI:

- **Skills** — Teach Claude domain knowledge with SKILL.md files and YAML frontmatter
- **Agents** — Create specialist agents with system prompts, tool restrictions, and model selection
- **Commands** — Define slash commands (e.g., `/my-plugin:review`)
- **Hooks** — Set up automatic triggers (PreToolUse, PostToolUse, etc.)
- **MCP Connectors** — Declare Cowork connectors (Slack, Gmail, Google Calendar, etc.) or configure Claude Code MCP servers

Generates `.zip` files ready to upload to Cowork or install via `claude plugin install`.

## Features

- **Guided Builder** — Step-by-step wizard that asks questions and builds the plugin for you
- **Advanced Builder** — Full workspace with metadata form, component tree, editors, file tree preview, and real-time validation
- **6 built-in templates** — Code Review, Documentation, Testing, DevOps, Blank Skill, Blank Agent
- **20+ Cowork connectors** — Slack, Gmail, Google Calendar, Notion, Figma, Salesforce, HubSpot, and more
- **User-manageable connector registry** — Add custom MCP connectors in Settings
- **7 themes** — Forge (default dark), Carbon, Ember, Arctic, Daylight (light), Grimoire (fantasy), Ironworks (industrial)
- **Plugin lifecycle** — Draft, Generated, Installed status tracking with version history
- **Manual save** (Cmd+S) — No auto-save flooding. You control when to persist.
- **ZIP generation** — One-click export as `.zip` ready for Cowork upload

## Tech Stack

- **Electron 32** — Desktop runtime
- **React 18** — UI framework
- **TypeScript** — Strict mode
- **Tailwind CSS** — Styling with CSS custom properties for theming
- **Vite** (via electron-vite) — Build tooling
- **Zod** — Schema validation

## Installation

### Download the DMG (macOS)

1. Go to [Releases](https://github.com/markes76/plugin-forge/releases)
2. Download `Plugin-Forge-1.0.0-mac.dmg`
3. Open the DMG and drag **Plugin Forge** into your Applications folder
4. **First launch:** Right-click the app → Open → Click "Open" in the dialog
   (Required once for unsigned apps on macOS)

### Build from source

```bash
git clone https://github.com/markes76/plugin-forge.git
cd plugin-forge
npm install
npm run dev
```

> **Note:** If running from VS Code's integrated terminal, use an external terminal instead (Terminal.app, iTerm). VS Code sets `ELECTRON_RUN_AS_NODE=1` which prevents the Electron window from appearing. The `npm run dev` script handles this automatically via `scripts/dev.sh`.

### Package as DMG

```bash
npm run package
```

Output: `release/Plugin-Forge-1.0.0-mac.dmg`

## How to use

### Creating a plugin

1. Open Plugin Forge
2. Choose **Guided Builder** (recommended) or **Advanced Builder**
3. Fill in your plugin's name, description, and components
4. Click **Generate Plugin** — saves a `.zip` file
5. Upload to Cowork or run `claude plugin install path/to/plugin.zip`

### Guided Builder (Wizard)

The wizard walks you through step by step:

1. **Plugin Type** — Skills only, Skills + Agents, or Full Plugin
2. **Identity** — Name, description, audience
3. **Skills** — What should Claude know?
4. **Agents** — Create specialist agents (if selected)
5. **Commands** — Slash commands (if Full Plugin)
6. **Hooks** — Automatic triggers (if Full Plugin)
7. **Connectors** — Cowork connectors or MCP servers (if Full Plugin)
8. **Review** — Validate and generate

### Advanced Builder

Three-panel workspace:
- **Left:** Plugin metadata + component tree
- **Center:** Editor for the selected component
- **Right:** File tree preview + validation

### MCP Connectors

In **Cowork mode** (default): Check boxes next to the connectors your plugin needs. The generated `.mcp.json` uses the HTTP format:

```json
{
  "mcpServers": {
    "slack": { "type": "http", "url": "https://mcp.slack.com/mcp" },
    "gmail": { "type": "http", "url": "https://gmail.mcp.claude.com/mcp" }
  }
}
```

In **Claude Code mode**: Configure MCP servers manually with command, args, and environment variables.

### Themes

Switch themes in **Settings**. Five standard themes (color-only) and two styled themes with decorative CSS:

| Theme | Style | Accent |
|-------|-------|--------|
| Forge | Dark charcoal | Amber |
| Carbon | Near-black | Electric blue |
| Ember | Warm brown | Terracotta |
| Arctic | Blue-black | Green |
| Daylight | Light | Amber |
| Grimoire | Fantasy/forest | Gold |
| Ironworks | Industrial/steel | Forge red |

## Generated plugin structure

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── skills/
│   └── my-skill/
│       └── SKILL.md
├── agents/
│   └── my-agent.md
├── commands/
│   └── my-command.md
├── hooks/
│   └── hooks.json
├── .mcp.json
├── CONNECTORS.md
├── README.md
└── LICENSE
```

## Project structure

```
plugin-forge/
├── src/
│   ├── main/           # Electron main process
│   │   ├── index.ts          # App lifecycle, window creation
│   │   ├── ipc-handlers.ts   # All IPC channels
│   │   ├── persistence.ts    # Registry, drafts, connectors
│   │   ├── plugin-writer.ts  # File I/O
│   │   ├── claude-installer.ts
│   │   └── zip-exporter.ts
│   ├── preload/        # contextBridge API
│   │   └── index.ts
│   └── renderer/       # React application
│       └── src/
│           ├── pages/        # Dashboard, Builder, Wizard, etc.
│           ├── components/   # UI components
│           ├── hooks/        # usePluginState, useManualSave, etc.
│           ├── lib/          # Generator, validators, templates
│           └── styles/       # Themes, globals
├── build/              # Electron packaging resources
├── scripts/            # Dev helper scripts
└── electron-builder.config.js
```

## License

MIT

## Author

Mark Samuelson
