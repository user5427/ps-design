# Fastify Scope-Based Authorization System - Implementation Requirements

## Project Context
We're building a Fastify application using fastify-awilix for dependency injection. We need to implement a scope-based authorization system that completely replaces the traditional role system.

## Core Concept
Instead of assigning users roles (like "admin" or "user"), we assign them scopes directly. Scopes are same as roles, but more flexible for declaring endpoint access requirements.

## Required Dependencies
- fastify
- fastify-awilix
- awilix

## Database Requirements

### Tables Needed
1. **users table** - Standard user table WITHOUT any role_id column, so just reuse what we have
3. **user_scopes table** - Junction table linking users to their scopes (user_id, scope enum/string)

### Key Points
- Users get scopes assigned directly through user_scopes table


### ScopeRepository
Create a repository with these methods:
- Get all scopes for a user ID
- Assign multiple scopes to a user at once
- Remove a specific scope from a user
- Remove all scopes from a user (useful for role changes)

## Authentication Service

### AuthService Requirements
- Must verify that the user has the necessary scopes when accessing protected routes. 
- When generating tokens, fetch the user's scopes from the database first to embed them in the JWT payload.
- apply the changes to only the accessToken generation.

## ScopeChecker Service (Critical Component)

### Purpose
This is a request-scoped service injected via fastify-awilix that checks if the current user has required scopes.

### Must Have These Methods
All methods should return the user object when successful, or throw an error with appropriate status code when failing:

1. **hasScope(scope)** - Check if user has a single scope (returns boolean)
2. **hasAllScopes(...scopes)** - Check if user has all provided scopes (returns boolean)
3. **hasAnyScope(...scopes)** - Check if user has at least one of the provided scopes (returns boolean)
4. **requireScope(scope)** - Throw 401 if not authenticated, throw 403 if missing scope, return user object if valid
5. **requireAllScopes(...scopes)** - Throw 401 if not authenticated, throw 403 if missing any scope, return user object if valid
6. **requireAnyScope(...scopes)** - Throw 401 if not authenticated, throw 403 if missing all scopes, return user object if valid

### Critical Behavior
- If user is not authenticated at all → throw 401 error
- If user is authenticated but missing required scopes → throw 403 error
- If user has required scopes → return the user object
- User object should be accessible throughout the request after scope check passes

## Dependency Injection Setup

### Container Registration
Register these services in the DI container:
- **scopeChecker** (asClass, SCOPED) - Per-request scope checking

### Request Scope
ScopeChecker must be request-scoped (Lifetime.SCOPED) so it has access to the current request's user data.

## Authentication Middleware

### OnRequest Hook
Create a hook that:
- Extracts JWT from Authorization header
- Verifies the token
- Attaches decoded user data
- fail the request if token is invalid
