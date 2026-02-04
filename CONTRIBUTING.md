# Contributing to 46elks MCP Server

Thank you for your interest in contributing to the 46elks MCP Server! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to a [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Environment details** (Node.js version, OS, MCP client used)
- **Error messages or logs** if applicable

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:

- **Clear title and description** of the feature
- **Use case** - why would this be useful?
- **Proposed implementation** (if you have ideas)
- **Alternatives considered**

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** for any new functionality
4. **Ensure all tests pass**: `npm test`
5. **Ensure code is properly formatted**: `npm run format:check`
6. **Ensure there are no linting errors**: `npm run lint`
7. **Update documentation** if needed
8. **Write a clear commit message** following [Conventional Commits](https://www.conventionalcommits.org/)

## Development Setup

### Prerequisites

- Node.js 20+ (LTS recommended)
- npm (comes with Node.js)
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/46elks-mcp-server.git
cd 46elks-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run linter
npm run lint

# Format code
npm run format
```

### Project Structure

```
46elks-mcp-server/
├── src/
│   ├── __tests__/          # Test files
│   ├── config.ts           # Configuration management
│   ├── elks-client.ts      # 46elks API client
│   ├── validation.ts       # Input validation
│   ├── utils.ts            # Utility functions
│   ├── errors.ts           # Error handling
│   └── index.ts            # Main MCP server
├── dist/                   # Compiled JavaScript (generated)
├── .github/                # GitHub Actions workflows
├── package.json
├── tsconfig.json
└── README.md
```

## Coding Standards

### TypeScript

- Use TypeScript for all code
- Enable strict type checking
- Avoid `any` types when possible
- Export types for public APIs

### Code Style

- We use **Prettier** for code formatting
- We use **ESLint** for code linting
- Configuration is in `.prettierrc.json` and `.eslintrc.json`
- Run `npm run format` before committing

### Testing

- Write tests for new functionality
- We use **Vitest** for testing
- Aim for high test coverage
- Test files go in `src/__tests__/`
- Name test files: `*.test.ts`

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```
feat: add SMS template support
fix: handle rate limit errors gracefully
docs: update installation instructions
test: add validation tests for sender ID
```

## Testing Your Changes

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Integration Testing

To test with a real MCP client:

1. Build the project: `npm run build`
2. Configure your MCP client (Claude Desktop, VS Code) to use your local build
3. Test the functionality through the MCP client
4. Always use `DRY_RUN=true` for testing to avoid sending real SMS

### Manual Testing Checklist

- [ ] Build succeeds without errors
- [ ] All tests pass
- [ ] Linter passes
- [ ] Type checking passes
- [ ] Code is properly formatted
- [ ] MCP client can connect to the server
- [ ] Tools are listed correctly
- [ ] Error handling works as expected

## Documentation

- Update README.md if adding new features
- Add JSDoc comments to public functions
- Update CHANGELOG.md following [Keep a Changelog](https://keepachangelog.com/)
- Include examples for new features

## Release Process

Maintainers will handle releases. The process includes:

1. Update version in `package.json`
2. Update CHANGELOG.md
3. Create a git tag
4. Create GitHub release
5. Publish to npm (if applicable)

## Questions?

- Check existing [Issues](https://github.com/palhamel/46elks-mcp-server/issues)
- For 46elks API questions: [46elks documentation](https://46elks.com/docs)
- For MCP questions: [MCP documentation](https://modelcontextprotocol.io/)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
