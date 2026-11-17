# Sotex ERP

A workspace-managed Enterprise Resource Planning (ERP) web application (`sotex-workspace`) structured with a root orchestrator and the core application in `sotex/`.

## Executive Summary & Purpose
`sotexerp` provides a unified ERP platform for managing business operations, workflows, and internal resources. The root repository acts as a workspace wrapper that delegates development, build, start, and lint commands to the `sotex/` application package.

## Architecture & Tech Stack
- **Workspace**: npm prefix workspace (`sotex/`)
- **Environment**: Configured via `.env.example`

## Project Structure
```text
├── sotex/                # Core ERP application source
├── .env.example          # Environment variable template
├── .gitignore
└── package.json          # Root workspace scripts
```

## Getting Started

```bash
git clone https://github.com/islamsamyy/sotexerp.git
cd sotexerp
npm --prefix sotex install
cp .env.example .env.local
```

### Available Scripts
| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the `sotex` development server |
| `npm run build` | Build the `sotex` production bundle |
| `npm run start` | Start the `sotex` production server |
| `npm run lint` | Run linter in `sotex` |
