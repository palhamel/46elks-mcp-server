# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-02-05

### Added
- `src/audit.ts` - Structured audit logging module
- `src/rate-limit.ts` - Rate limiting module with configurable limits
- Tests for audit logging and rate limiting
- Environment variables `RATE_LIMIT_SMS_PER_MINUTE` and `RATE_LIMIT_QUERIES_PER_MINUTE`
- Husky pre-commit hook to run lint and tests before commits
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
- Enhanced `src/validation.ts` with message ID validation and URL detection
- Enhanced `src/index.ts` with audit logging and rate limiting integration
- Updated SECURITY.md with comprehensive OWASP MCP Top 10 compliance documentation
- Updated README.md with security badges and OWASP compliance highlights
- Updated @modelcontextprotocol/sdk from 1.17.4 to 1.25.3
- Updated @types/node to latest LTS version
- Updated TypeScript to 5.9.3
- Improved package.json with better scripts and metadata

### Fixed
- Fixed 3 npm security vulnerabilities (1 moderate, 2 high)
- Resolved MCP SDK DNS rebinding and ReDoS vulnerabilities

### Security
- **OWASP MCP Top 10 compliance** - Full security hardening following OWASP guidelines
- Added rate limiting (10 SMS/min, 60 queries/min) to prevent abuse
- Added structured JSON audit logging with phone number masking
- Added credential validation on startup - server fails fast if credentials invalid
- Added message ID validation to prevent injection attacks
- Added control character stripping from SMS messages
- Added URL detection warnings in SMS content (potential phishing indicator)
- Updated dependencies to fix known security vulnerabilities
- Updated MCP SDK to version with security patches

## [0.1.0] - 2025-08-31

### Added
- Initial release of the unofficial 46elks MCP server
