# Request Codeowner Reviews

A GitHub Action that requests reviews from CODEOWNERS for pull requests, without requiring those owners to have write access to the repository.

## Installation

### Quick Setup

1. Create a new workflow file at `.github/workflows/request-codeowner-reviews.yml`
2. Add the following configuration:

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
          fail-on-error: true
          output-mode: review
```

### Configuration Options

| Input           | Required | Default               | Description                                                                       |
| --------------- | -------- | --------------------- | --------------------------------------------------------------------------------- |
| `token`         | Yes      | `${{ github.token }}` | GitHub token with permissions to manage pull request reviews                      |
| `fail-on-error` | No       | `true`                | Whether to fail the action when an error occurs                                   |
| `output-mode`   | No       | `review`              | How to notify codeowners: `review` to request reviews, `comment` to add a comment |

#### Output Modes

- **`review`** (default): Requests reviews from codeowners using GitHub's review request feature
- **`comment`**: Creates a comment on the pull request mentioning the codeowners instead of requesting reviews

The `comment` mode is useful when:

- Codeowners don't have write access to the repository
- You want to notify without formally requesting reviews
- You prefer a less formal notification approach

### Alternative Setup: Comment Mode

If you prefer to notify codeowners via comments instead of review requests:

```yaml
name: Notify Codeowners

on:
  pull_request_target:
    types: [opened]

jobs:
  notify-codeowners:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Notify Codeowners
        uses: avivkeller/request-codeowner-review@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          output-mode: comment
          fail-on-error: false
```

## CODEOWNERS Setup

### File Placement

Place your `CODEOWNERS` file in one of these locations (checked in order):

1. `.github/CODEOWNERS`
2. `docs/CODEOWNERS`
3. `CODEOWNERS` (in repository root)

### Syntax Guide

The CODEOWNERS file uses GitHub's standard format. Each line specifies a pattern and its corresponding owners:

```plaintext
# Format: <pattern>  <owner1> <owner2> <owner3>

# Global owners (fallback for all files)
*       @global-owner1 @global-owner2

# Directory-specific owners
/docs/  @docs-team
/src/   @dev-team

# File type owners
*.js    @javascript-team
*.go    @go-team
```

For complete details on CODEOWNERS syntax and pattern matching, see the [GitHub CODEOWNERS documentation](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners).
