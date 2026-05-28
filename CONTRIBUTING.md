# Contributing to Electronium

Thank you for your interest in contributing to Electronium! Every contribution matters, whether it's a bug report, a feature suggestion, or a code change.

## Table of Contents

- [Contributing to Electronium](#contributing-to-electronium)
  - [Table of Contents](#table-of-contents)
  - [Reporting Issues](#reporting-issues)
  - [Pull Requests](#pull-requests)
    - [General Guidelines](#general-guidelines)
    - [Proposing New Features](#proposing-new-features)
    - [Before Submitting](#before-submitting)
  - [Code Style](#code-style)
  - [Commit Messages](#commit-messages)

## Reporting Issues

Before creating a new issue, please search [existing issues](https://github.com/kingomost/electronium/issues) to avoid duplicates.

When opening an issue, include the following information:

| Field                 | Description                                            |
| --------------------- | ------------------------------------------------------ |
| **Version**           | The version of Electronium you are using               |
| **Description**       | A clear summary of what is happening                   |
| **Expected behavior** | What you expected to happen                            |
| **Actual behavior**   | What actually happened instead                         |
| **Proposed solution** | If you have ideas on how to fix it, describe them here |

Providing as much detail as possible helps us resolve issues faster.

## Pull Requests

### General Guidelines

- **One issue per pull request.** Keep changes focused. If you need to fix multiple issues, please open separate pull requests for each.
- **Link to an issue.** Every pull request should reference an existing issue. If there isn't one yet, create an issue first and then open your pull request as a proposed solution.

### Proposing New Features

If you have an idea for a new feature and want to contribute it:

1. **Open an issue first** — describe the feature, why it's useful, and how you envision it working.
2. **Wait for discussion** — give maintainers and the community a chance to provide feedback.
3. **Open a pull request** — reference the issue in your PR description so it's clear what problem you're solving.

### Before Submitting

- Make sure your code passes linting: `npm run lint`
- Make sure your code passes formatting: `npm run format:check`
- Make sure TypeScript compiles without errors: `npm run typecheck`

## Code Style

This project uses [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) to maintain consistent code style. Please make sure your contributions follow the existing conventions:

```bash
# Check for lint errors
npm run lint

# Auto-fix lint errors
npm run lint:fix

# Format code
npm run format
```

## Commit Messages

We encourage using [Conventional Commits](https://www.conventionalcommits.org/) for your commit messages. This leads to more readable messages that are easy to follow when looking through the project history.
