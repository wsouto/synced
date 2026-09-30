# Git Workflow

This repository follows a standard GitHub workflow with remotes. Changes are
developed on short-lived task branches off an up-to-date `main`, pushed to the
remote repository. No issues and no pull requests.

## Workflow Steps

1. **Pre-flight & Base Branch**
   - Start on `main` and inspect `git status`.
   - Preserve existing user modifications; halt and ask for clarification if
     they overlap with the task.

2. **Branch Creation**
   - Create a short-lived task branch off `main`:

     ```bash
     git checkout -b <type>/<short-kebab-slug>
     ```

   - Examples: `feat/add-dev-vm`, `fix/cloud-init-network`, `docs/update-workflow`.

3. **Development & Commits**
   - Make focused, atomic changes.
   - Format commit messages following
     [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
     (`feat(scope): ...`, `fix(scope): ...`).

4. **Verification**
   - Run all checks relevant to the modified files
   - Do not merge while any relevant check fails.

5. **Changelog Entry**
   - If changes affect user-visible behavior, security, or compatibility, add
     an entry under `## [Unreleased]` in `CHANGELOG.md`.
   - Follow the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format
     (`Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`).
   - This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
   - Pure documentation, formatting, or internal maintenance tasks do not
     require a changelog entry.

6. **Merge & Cleanup**
   - Switch to `main`, integrate changes with a non-fast-forward merge, and
     delete the task branch:

     ```bash
     git checkout main
     git merge --no-ff <type>/<short-kebab-slug>
     git branch -d <type>/<short-kebab-slug>
     ```

   - Verify you finish on `main` with no lingering task artifacts, keeping any
     pre-existing unrelated user changes untouched.

## Working Trees

- Use the primary working tree for normal sequential work.
- Create and remove a separate `git worktree` only when parallel branch work is
  explicitly required.
