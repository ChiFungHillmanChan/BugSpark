---
name: worktree-manager
description: Manage git worktrees for parallel Claude Code development sessions. Create isolated worktrees, set up shell aliases, and run multiple Claude sessions simultaneously.
---

# Worktree Manager

## When to Use

- Starting parallel development on independent tasks
- Need isolated environment for risky changes
- Running multiple Claude Code sessions simultaneously
- Feature work that shouldn't affect main branch

## Quick Start

### Create a Worktree

```bash
# New branch + worktree
git worktree add -b feature/task-name ../project-task-name

# Existing branch
git worktree add ../project-task-name feature/existing-branch

# List worktrees
git worktree list
```

### Shell Aliases

Add to `~/.zshrc` or `~/.bashrc`:

```bash
# Quick worktree management
alias gwa='git worktree add'
alias gwl='git worktree list'
alias gwr='git worktree remove'

# Create worktree + open Claude Code
za() {
  local branch="$1"
  local dir="../$(basename $(pwd))-${branch//\//-}"
  git worktree add -b "$branch" "$dir" && cd "$dir" && claude
}

# Switch to existing worktree
zb() {
  local branch="$1"
  local dir="../$(basename $(pwd))-${branch//\//-}"
  cd "$dir" && claude
}

# Clean up worktree
zc() {
  local branch="$1"
  local dir="../$(basename $(pwd))-${branch//\//-}"
  git worktree remove "$dir"
  git branch -d "$branch"
}
```

## Parallel Workflow

### 1. Plan Tasks
Break work into independent tasks (don't touch same files).

### 2. Create Worktrees
```bash
za feature/task-a
# In another terminal:
za feature/task-b
```

### 3. Merge When Complete
```bash
git checkout main
git merge feature/task-a
git merge feature/task-b
```

### 4. Clean Up
```bash
zc feature/task-a
zc feature/task-b
```

## Naming Conventions

| Pattern | Example |
|---------|---------|
| Features | `feature/user-auth` |
| Fixes | `fix/login-error` |
| Refactors | `refactor/auth-module` |
| Experiments | `experiment/new-approach` |

## Common Issues

- **"already checked out"**: Branch is in another worktree. Use different branch name.
- **Stale references**: Run `git worktree prune` to clean up.
- **Shared dependencies**: Run `npm install` in each worktree separately.
