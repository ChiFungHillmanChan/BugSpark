# Git Worktree Workflow

Use git worktrees for parallel Claude Code sessions on independent tasks.

## Why Worktrees?

Git worktrees let you have multiple branches checked out simultaneously in separate directories. Each directory can run its own Claude Code session, enabling true parallel development.

## Setup

### Create a Worktree

```bash
# Create a worktree for a new feature branch
git worktree add ../project-feature-name feature/branch-name

# Create worktree with a new branch
git worktree add -b feature/new-feature ../project-new-feature

# List all worktrees
git worktree list
```

### Shell Aliases (Add to ~/.zshrc or ~/.bashrc)

```bash
# Quick worktree aliases
alias gwa='git worktree add'
alias gwl='git worktree list'
alias gwr='git worktree remove'

# Create worktree + open Claude Code
za() { git worktree add -b "$1" "../$(basename $(pwd))-$1" && cd "../$(basename $(pwd))-$1" && claude; }
zb() { cd "../$(basename $(pwd))-$1" && claude; }
zc() { git worktree remove "../$(basename $(pwd))-$1"; }
```

### Usage with Aliases

```bash
# Create worktree for feature, open Claude Code
za feature/user-auth

# Switch to existing worktree
zb feature/user-auth

# Clean up when done
zc feature/user-auth
```

## Parallel Development Pattern

### Step 1: Plan Tasks
Break work into independent tasks that don't touch the same files.

### Step 2: Create Worktrees
```bash
git worktree add -b feature/task-a ../project-task-a
git worktree add -b feature/task-b ../project-task-b
```

### Step 3: Run Parallel Sessions
Open separate terminal tabs/windows:
```bash
# Terminal 1
cd ../project-task-a && claude

# Terminal 2
cd ../project-task-b && claude
```

### Step 4: Merge When Complete
```bash
# Back in main worktree
git checkout main
git merge feature/task-a
git merge feature/task-b
```

### Step 5: Clean Up
```bash
git worktree remove ../project-task-a
git worktree remove ../project-task-b
git branch -d feature/task-a feature/task-b
```

## Rules

1. **Independent tasks only** - Don't create worktrees for tasks that modify the same files
2. **One Claude session per worktree** - Each worktree gets its own Claude Code instance
3. **Clean up after merge** - Remove worktrees and branches when done
4. **Name worktrees clearly** - Use the branch name in the directory name
5. **Keep main clean** - Don't develop directly in the main worktree

## Common Issues

### "fatal: is already checked out"
The branch is checked out in another worktree. Use a different branch name or remove the existing worktree.

### Worktree points to missing directory
```bash
git worktree prune  # Clean up stale references
```

### Shared node_modules
Each worktree gets its own directory but shares `.git`. You may need to run `npm install` / `pnpm install` in each worktree.
