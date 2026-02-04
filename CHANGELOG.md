# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- ESLint for code linting with TypeScript support
- Prettier for code formatting
- EditorConfig for consistent coding styles
- Vitest for testing with comprehensive test coverage
- Unit tests for validation and utility functions
- GitHub Actions CI workflow for automated testing
- Dependabot configuration for automated dependency updates
- CONTRIBUTING.md with detailed contribution guidelines
- New npm scripts: `format`, `lint:fix`, `type-check`, `test:watch`, `test:coverage`

### Changed
- Updated @modelcontextprotocol/sdk from 1.17.4 to 1.25.3
- Updated @types/node to latest LTS version
- Updated TypeScript to 5.9.3
- Improved package.json with better scripts and metadata

### Fixed
- Fixed 3 npm security vulnerabilities (1 moderate, 2 high)
- Resolved MCP SDK DNS rebinding and ReDoS vulnerabilities

### Security
- Updated dependencies to fix known security vulnerabilities
- Updated MCP SDK to version with security patches

## [0.1.0] - 2025-08-31

### Added
- Initial release of the unofficial 46elks MCP server
