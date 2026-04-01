# GitHub Workflow

## Purpose

This repository uses a protected `main` branch. All work must happen on feature branches and reach `main` only through a pull request that the repository owner approves.

Git supports creating branches and setting upstream tracking for pushes, and GitHub supports PR-based workflows and protected branches.

---

## Branch Policy

- Never commit directly to `main`.
- Never push directly to `main`.
- Always start from the latest `origin/main`.
- Always create a new feature branch for each task.
- Always push the feature branch to `origin`.
- Always open a pull request into `main`.
- The human owner reviews and approves before merge.

### Branch Naming

Use one of these prefixes:

- `codex/<short-feature-name>`
- `openclaw/<short-feature-name>`
- `fix/<short-feature-name>`
- `feat/<short-feature-name>`
- `chore/<short-feature-name>`

Examples:

- `codex/currency-note`
- `openclaw/timeline-fix`
- `fix/details-menu-overlap`

---

## Standard Workflow for Every Task

### 1. Sync `main`

Run these commands first:

```powershell
git checkout main
git pull origin main
```

### 2. Create a Feature Branch

Create a new branch from `main`:

```powershell
git checkout -b codex/<task-name>
```

If this task is being done by OpenClaw, use:

```powershell
git checkout -b openclaw/<task-name>
```

### 3. Make Changes

- Modify only the files needed for the task.
- Do not make unrelated edits.
- Do not change secrets, tokens, or environment files unless explicitly asked.

### 4. Review Before Commit

Before committing, run:

```powershell
git status
```

Check what changed. Keep the change focused.

### 5. Commit Changes

Use a clear commit message:

```powershell
git add .
git commit -m "Add <short description>"
```

Examples:

```powershell
git commit -m "Add currency note"
git commit -m "Fix timeline note rendering"
git commit -m "Improve details menu layout"
```

### 6. Push the Branch

Push the feature branch and set upstream:

```powershell
git push -u origin codex/<task-name>
```

Or:

```powershell
git push -u origin openclaw/<task-name>
```

Git documents `git push --set-upstream` / `-u` for setting the upstream branch on first push. [Git][1]

### 7. Open a Pull Request

Open a pull request with:

- `base`: `main`
- `compare`: your feature branch

Title format:

- `Add: <feature>`
- `Fix: <issue>`
- `Refactor: <area>`
- `Chore: <task>`

PR description should include:

- what changed
- why it changed
- files touched
- anything the reviewer should verify

GitHub supports creating pull requests from pushed branches as the normal review workflow. [GitHub Docs][2]

### 8. Do Not Merge the PR Yourself Unless Explicitly Instructed

The repository owner approves and merges into `main`.

---

## Safety Rules

- Never force-push to `main`.
- Never delete `main`.
- Never bypass the PR workflow.
- Never expose secrets in commits.
- Never commit `.env` files or API keys.
- If `.env` or secrets appear in `git status`, stop and fix `.gitignore` first.

Suggested ignore entries:

```gitignore
.env
.env.local
.env.*
node_modules/
dist/
build/
coverage/
```

---

## If the Branch Already Exists Remotely

If continuing work on an existing feature branch:

```powershell
git checkout <existing-branch-name>
git pull origin <existing-branch-name>
```

Do not create a second branch for the same task unless explicitly needed.

---

## If `main` Has Moved While Working

Before pushing large changes, sync with latest `main`:

```powershell
git checkout main
git pull origin main
git checkout <your-branch>
git merge main
```

Resolve conflicts if needed, then continue.

---

## If Push Is Rejected

Check status first:

```powershell
git status
git branch
git remote -v
```

Then confirm you are pushing the feature branch, not `main`.

Typical correct push:

```powershell
git push -u origin codex/<task-name>
```

---

## Definition of Done

A task is complete only when all of the following are true:

- changes are committed on a feature branch
- branch is pushed to GitHub
- a pull request targets `main`
- the human owner can review and approve it

Protected branch workflows on GitHub are designed for this PR-and-approval model. [GitHub Docs][3]

---

## Preferred One-Task Example

For a new Codex task called `web-bookmark-note`:

```powershell
git checkout main
git pull origin main
git checkout -b codex/web-bookmark-note
# make changes
git status
git add .
git commit -m "Add web bookmark note"
git push -u origin codex/web-bookmark-note
```

Then open a pull request from `codex/web-bookmark-note` into `main`.

---

## Agent Instruction Summary

For every requested code task, the agent must:

1. update local `main`
2. create a new feature branch
3. make only the requested changes
4. commit with a clean message
5. push the branch to `origin`
6. open or prepare a pull request into `main`
7. never push directly to `main`

[1]: https://git-scm.com/docs/git-push "git-push Documentation"
[2]: https://docs.github.com/articles/creating-a-pull-request "Creating a pull request"
[3]: https://docs.github.com/enterprise-cloud%40latest/rest/branches/branch-protection "REST API endpoints for protected branches"
