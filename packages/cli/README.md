# @bugspark/cli

Command-line tool for managing BugSpark projects and bug reports.

## Install

```bash
npm install -g @bugspark/cli
```

## Quick Start

```bash
# 1. Login with a Personal Access Token
bugspark login

# 2. Create a project (or pick an existing one)
bugspark init

# 3. List bug reports
bugspark reports list
```

## Authentication

The CLI uses **Personal Access Tokens** (PATs) for authentication.

1. Open your BugSpark dashboard → Settings → Personal Access Tokens
2. Create a token with a descriptive name
3. Run `bugspark login` and paste the token when prompted

Your token is stored locally at `~/.bugspark/config.json` (file permissions `600`).

## Commands

### Auth

| Command           | Description                     |
| ----------------- | ------------------------------- |
| `bugspark login`  | Authenticate with BugSpark      |
| `bugspark logout` | Remove stored credentials       |
| `bugspark whoami` | Show current user info          |

### Projects

| Command                                  | Description          |
| ---------------------------------------- | -------------------- |
| `bugspark init`                          | Interactive setup    |
| `bugspark projects list`                 | List all projects    |
| `bugspark projects create <name>`        | Create a project     |
| `bugspark projects delete <project-id>`  | Delete a project     |

### Reports

| Command                                          | Description            |
| ------------------------------------------------ | ---------------------- |
| `bugspark reports list`                          | List bug reports       |
| `bugspark reports list --project <id>`           | Filter by project      |
| `bugspark reports list --status open`            | Filter by status       |
| `bugspark reports view <report-id>`              | View report details    |
| `bugspark reports update <id> --status resolved` | Update report status   |

## Config File

The CLI stores config at `~/.bugspark/config.json`:

```json
{
  "apiUrl": "https://api.bugspark.hillmanchan.com/api/v1",
  "token": "bsk_pat_..."
}
```

## Self-Hosted

If you're running a self-hosted BugSpark API, specify the URL during login:

```bash
bugspark login
# When prompted, enter your custom API URL
```

## License

MIT
