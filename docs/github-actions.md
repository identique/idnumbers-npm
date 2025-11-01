# GitHub Actions Workflows

This repository uses GitHub Actions for automated testing, quality checks, and npm publishing.

## Available Workflows

### 1. CI Workflow (`ci.yml`)

Runs on every push and pull request to the main branch.

**Quality Checks:**
- Prettier format check
- ESLint check
- TypeScript compilation
- Full test suite (797 tests)
- Runs on Node.js 16.x, 18.x, and 20.x

**Build Verification:**
- Clean build check
- Validates build artifacts exist

**Test Coverage:**
- Generates coverage report
- Displays summary in GitHub

**Examples Check:**
- Tests all example files to ensure documentation is correct

### 2. NPM Publish Workflow (`npm-publish.yml`)

Automatically publishes the package to npm when you create a new GitHub release.

**Setup Instructions:**

1. **Get your npm token:**
   - Log in to [npmjs.com](https://www.npmjs.com/)
   - Go to your account settings
   - Click on "Access Tokens"
   - Generate a new token with "Automation" type
   - Copy the token (it starts with `npm_`)

2. **Add the token to GitHub:**
   - Go to your GitHub repository
   - Click on "Settings" → "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

3. **Creating a release:**
   - Ensure your `package.json` version is updated
   - Commit and push all changes
   - Create a git tag: `git tag v2.1.0` (match the version in package.json)
   - Push the tag: `git push origin v2.1.0`
   - Go to GitHub → "Releases" → "Create a new release"
   - Choose your tag
   - Add release notes
   - Click "Publish release"

**The workflow will automatically:**
- Verify package name is "idnumbers"
- Install dependencies
- Run Prettier format check
- Run ESLint (continues on error)
- Run TypeScript compilation
- Run all 797 tests
- Verify build artifacts
- Check tag version matches package.json
- Publish to npm with public access
- Update GitHub release with npm install instructions
- Show success message with package URL

**Important Notes:**
- The tag must start with `v` (e.g., `v2.1.0`)
- The version in the tag must match the version in `package.json`
- The workflow only runs on published releases (not drafts or pre-releases)
- Make sure all tests pass before creating a release
- Package is published as public (`--access public`)

## Local Development

Before pushing, pre-commit hooks will automatically run:
- Prettier formatting on staged files
- TypeScript compilation
- Full test suite

Configure pre-commit hooks with:
```bash
npm install  # installs husky
```