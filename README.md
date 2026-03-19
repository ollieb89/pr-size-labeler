# 🏷️ PR Size Labeler

Automatically label pull requests by diff size to improve code review prioritization.

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-PR%20Size%20Labeler-blue?logo=github)](https://github.com/marketplace/actions/pr-size-labeler)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Why?

Large PRs get less thorough reviews. Studies show that review quality drops significantly after 200-400 lines of changes. This action makes PR size visible at a glance, helping teams:

- **Prioritize reviews** — XS/S PRs can be reviewed quickly between tasks
- **Encourage smaller PRs** — XL label is a gentle nudge to split
- **Track team patterns** — see size distribution over time

## Quick Start

```yaml
name: PR Size
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write
  issues: write

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: ollieb89/pr-size-labeler@v1
```

That's it. PRs get labeled automatically:

| Label | Default Range | Color |
|-------|--------------|-------|
| `size/XS` | 0-10 lines | 🟢 Green |
| `size/S` | 11-50 lines | 🟢 Light green |
| `size/M` | 51-200 lines | 🟡 Yellow |
| `size/L` | 201-500 lines | 🟠 Orange |
| `size/XL` | 501+ lines | 🔴 Red |

## Configuration

```yaml
- uses: ollieb89/pr-size-labeler@v1
  with:
    # Customize size thresholds
    xs-max: '10'
    s-max: '100'
    m-max: '300'
    l-max: '800'
    
    # Custom label prefix
    label-prefix: 'size/'
    
    # Exclude generated files from size calculation
    exclude-patterns: |
      package-lock.json
      yarn.lock
      pnpm-lock.yaml
      *.generated.*
      dist/**
      **/*.snap
```

## Smart Exclusions

By default, lock files and generated code are excluded from the size calculation. A 2-line code change shouldn't get an XL label just because `package-lock.json` changed.

Default exclusions:
- `package-lock.json`
- `yarn.lock`
- `pnpm-lock.yaml`
- `*.generated.*`
- `dist/**`

## Outputs

| Output | Description |
|--------|-------------|
| `size` | The size label applied (e.g., `size/M`) |
| `total-changes` | Total lines changed (after exclusions) |
| `files-changed` | Number of files changed (after exclusions) |

Use outputs in subsequent steps:

```yaml
- uses: ollieb89/pr-size-labeler@v1
  id: size
- run: echo "PR is ${{ steps.size.outputs.size }} with ${{ steps.size.outputs.total-changes }} lines changed"
```

## Part of the GitHub Actions Toolkit

| Action | Purpose |
|--------|---------|
| [workflow-guardian](https://github.com/marketplace/actions/workflow-guardian) | Lint workflow files for security issues |
| [test-results-reporter](https://github.com/ollieb89/test-results-reporter) | Aggregate test results into PR comments |
| **pr-size-labeler** | Label PRs by diff size |

## License

MIT
