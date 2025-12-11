# Project-Specific Copilot Instructions

## Type Definitions and Schemas

**IMPORTANT**: Always use the shared schemas from the `/schemas` directory for defining communication between backend and frontend.

- DO NOT create local type definitions for API requests/responses
- DO NOT duplicate type definitions across files
- ALWAYS import types from `/schemas` package
- The schemas directory is the single source of truth for all shared types