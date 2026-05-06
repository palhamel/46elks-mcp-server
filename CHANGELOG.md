# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2026-05-06

### Changed
- Drop Node.js 20 (EOL April 2026) from CI test matrix; add Node.js 24 LTS
- CI lint and build jobs now run on Node.js 24 (was 20)
- Test matrix updated to Node.js 22 and 24 (was 20 and 22)
- Dockerfile base image upgraded from `node:22-alpine` to `node:24-alpine`
- `engines` field in package.json updated to `>=22.0.0` (Node 20 EOL)
- Updated README, CONTRIBUTING badges and prerequisites to reflect Node.js 22+/24+
- Added `.node-version` file pinned to 24 for nvm/fnm/volta compatibility

## [0.3.1] - 2026-05-06

### Security
- Resolved all 14 npm audit vulnerabilities (0 vulnerabilities remain)
- Added `overrides` in package.json to force patched versions of transitive
  dependencies from `@modelcontextprotocol/sdk`:
  `@hono/node-server` >=1.19.14, `hono` >=4.12.18, `express-rate-limit` >=8.5.1,
  `path-to-regexp` >=8.4.2, `ajv` >=8.20.0, `ip-address` >=10.2.0
- Fixed HIGH severity prototype pollution in `flatted` (<=3.4.1) via dev dep upgrade
- Fixed HIGH severity regex vuln in `picomatch` (4.0.0-4.0.3) via dev dep upgrade
- Fixed MODERATE severity regex vuln in `brace-expansion` via dev dep upgrade

### Changed
- Upgraded `@modelcontextprotocol/sdk` from 1.27.1 to 1.29.0
- Upgraded `typescript` from 5.9.3 to 6.0.3 (major version — requires Node types
  declared explicitly; added `"types": ["node"]` to tsconfig.json)
- Upgraded `vitest` and `@vitest/ui` from 4.1.0 to 4.1.5
- Upgraded `eslint` from 10.1.0 to 10.3.0
- Upgraded `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser`
  from 8.57.1 to 8.59.2
- Upgraded `prettier` from 3.8.1 to 3.8.3
- Upgraded `@types/node` from 25.5.0 to 25.6.0

### Fixed
- Added `"types": ["node"]` to `tsconfig.json` for TypeScript 6 compatibility
  (TypeScript 6 no longer auto-includes Node.js ambient types)

## [0.3.0] - 2026-02-05

### Added
- Docker support with multi-stage Dockerfile for containerized deployment
- `server.yaml` for Docker MCP Catalog submission
- `tools.json` tool definitions for Docker MCP registry
- `docker-compose.yml` for easy local Docker testing
- Non-root user in Docker container for enhanced security
- Health check in Docker container

### Changed
- Updated MCP server version to 0.3.0
- Upgraded base image from node:20-alpine to node:22-alpine (LTS)
- Prepared for Docker MCP Catalog distribution

### Security
- Removed npm/yarn from production image (eliminates all HIGH vulnerabilities)
- Docker Scout scan: 0 Critical, 0 High vulnerabilities
- Docker container runs as non-root user (mcpuser)
- Container health checks for reliability monitoring
- Read-only root filesystem in docker-compose
- All Linux capabilities dropped (cap_drop: ALL)
- No new privileges flag enabled (no-new-privileges:true)

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
