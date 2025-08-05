# Request Codeowner Reviews

A GitHub Action that automatically requests reviews from codeowners for changed files in a pull request.

## Usage

### Basic Setup

Create a workflow file (e.g., `.github/workflows/request-codeowner-reviews.yml`):

```yaml
name: Request Codeowner Reviews

on:
  pull_request_target:
    types: [opened]

jobs:
  request-reviews:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Request Codeowner Reviews
        uses: avivkeller/request-codeowner-review@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

| Input   | Description                                      | Required | Default               |
| ------- | ------------------------------------------------ | -------- | --------------------- |
| `token` | GitHub token with pull request write permissions | Yes      | `${{ github.token }}` |

## CODEOWNERS File Format

This action supports the standard GitHub `CODEOWNERS` file format. Place your `CODEOWNERS` file in one of these locations:

- `.github/CODEOWNERS`
- `docs/CODEOWNERS`
- `CODEOWNERS` (repository root)
