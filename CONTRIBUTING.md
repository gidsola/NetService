# Contributing to NetService

Thank you for your interest in contributing to **NetService**! Your help is essential for improving this project.

---

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Guidelines](#coding-guidelines)
- [Submitting Changes](#submitting-changes)
- [Pull Request Process](#pull-request-process)
- [License](#license)

---

## Code of Conduct
By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it to understand the expectations for all contributors.

---

## How Can I Contribute?

### Reporting Bugs
- **Check existing issues** to avoid duplicates.
- **Open a new issue** with a clear title and description, including:
  - Steps to reproduce
  - Expected vs. actual behavior
  - Environment details (OS, Node.js version, etc.)

### Suggesting Enhancements
- Open an issue with the **enhancement** label.
- Describe the feature, its use case, and why it’s valuable.

### Pull Requests
- Fix bugs, add features, or improve documentation.
- Follow the [Pull Request Process](#pull-request-process).

---

## Getting Started

1. **Fork the repository** on GitHub.
2. **Clone your fork**:
   ```bash
   git clone https://github.com/your-username/netservice.git
   cd netservice
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```

---

## Development Setup

### Prerequisites
- Node.js (v16+)
- OpenSSL (for TLS certificate generation)
- Linux: Port-binding permissions (see [Configuration](#configuration) in README)

### Running Tests
```bash
npm test
```
- Ensure all tests pass before submitting changes.

---

## Coding Guidelines

### JavaScript/TypeScript
- Use **ES6+** syntax.
- Follow **consistent indentation** (2 spaces).
- Add **JSDoc** for public APIs.
- Use **TypeScript** for type safety where possible.

### Commits
- Write **clear, concise** commit messages.
- Reference issues (e.g., `Fixes #123`).

### Documentation
- Update **README.md** and **docs** for new features.
- Add examples for new APIs.

---

## Submitting Changes

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature
   ```
2. **Make your changes**.
3. **Test thoroughly**.
4. **Push to your fork**:
   ```bash
   git push origin feature/your-feature
   ```

---

## Pull Request Process

1. **Open a PR** from your fork to the `main` branch.
2. **Title**: Use a descriptive prefix (`feat:`, `fix:`, `docs:`).
3. **Description**:
   - Explain the purpose of the PR.
   - Reference related issues.
4. **Review**:
   - A maintainer will review your PR.
   - Address feedback promptly.
5. **Merge**: Once approved, your PR will be merged.

---

## License
By contributing, you agree that your contributions will be licensed under the **MIT License**.
