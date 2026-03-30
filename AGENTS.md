# AGENTS.md

## Build/Lint/Test Commands

### Development
- Start client dev server: `npm run dev:client` (runs Vite on port 3000)
- Start server dev server: `npm run dev:server` (runs tsx watch on port 4000)
- Start both with scripts: `./start.sh` (auto-detects ports, background)
- Stop both: `./stop.sh`

### Build
- Build client: `npm run build:client` (runs TypeScript check + Vite build)
- Build server: `npm run build:server` (runs TypeScript compiler)
- Build all: `npm run build:client && npm run build:server`

### Type Checking
- Client: `cd client && npx tsc --noEmit`
- Server: `cd server && npx tsc --noEmit`
- Both: run sequentially

### Single Test (when tests exist)
- Run all tests: `npm test` (to be added)
- Run single test file: `npx jest path/to/test.test.ts` (when Jest configured)
- Run tests matching pattern: `npx jest -t "test name"`

### Linting/Formatting
- Format with Prettier: `npx prettier --write .` (uses .prettierrc)
- Check formatting: `npx prettier --check .`
- No ESLint configured yet; follow TypeScript strict rules

## Code Style Guidelines

### General
- **Language**: TypeScript strict mode (`"strict": true` in tsconfig)
- **Module System**: ESNext modules (`"module": "ESNext"`)
- **Target**: ES2020+ (client ES2020, server ES2022)

### Formatting
- **Indentation**: 2 spaces, no tabs (`.editorconfig`)
- **Quotes**: Single quotes (`'use client'`)
- **Semicolons**: Yes (`"semi": true`)
- **Trailing Commas**: ES5 (`"trailingComma": "es5"`)
- **Line Length**: 80 characters max (`"printWidth": 80`)
- **Arrow Functions**: Parentheses omitted for single param (`"arrowParens": "avoid"`)
- **Line Endings**: LF (`"endOfLine": "lf"`)

### Imports
```typescript
// 1. React and third-party imports
import React, { useState, useEffect } from 'react';
import { SomeLibrary } from 'some-library';

// 2. Local/relative imports
import { AudioProcessor } from './audioProcessor.js';
import type { Config } from '../types';
```
- Use `.js` extensions for local imports (ESM compatibility)
- Group imports with blank lines between groups
- Sort imports alphabetically within groups (optional)

### Naming Conventions
- **Components**: PascalCase (`AudioProcessor`, `WebSocketClient`)
- **Functions/Variables**: camelCase (`processAudio`, `isConnected`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_PORT`, `MAX_RETRIES`)
- **Types/Interfaces**: PascalCase (`AudioConfig`, `ServerState`)
- **Files**: kebab-case for most files, PascalCase for React components

### TypeScript Patterns
- **Explicit Types**: Prefer explicit return types for functions
```typescript
function processAudio(data: number[]): number[] {
  // implementation
}
```
- **Interfaces vs Types**: Use `interface` for object shapes, `type` for unions/intersections
- **Avoid `any`**: Use `unknown` if type is truly unknown, then narrow
- **Null vs Undefined**: Use `null` for optional values, explicit `| null` type
- **Optional Properties**: Use `?` syntax, not `| undefined`

### Error Handling
- **Async/Await**: Prefer over callbacks and raw Promises
- **Try/Catch**: Use for async operations, especially external calls
- **Error Logging**: Use framework logger (e.g., `fastify.log.error(error)`)
- **User Errors**: Throw custom errors with clear messages
```typescript
try {
  await someAsyncOperation();
} catch (error) {
  logger.error('Operation failed:', error as Error);
  throw new Error(`Operation failed: ${error.message}`);
}
```

### React Patterns
- **Components**: Functional components with hooks
- **State**: Use `useState` for local state, context for shared state
- **Effects**: Clean up effects (return cleanup function)
- **Refs**: Use `useRef` for mutable values that don't trigger re-renders
- **Callbacks**: Use `useCallback` for functions passed to child components

### Server Patterns
- **Framework**: Fastify with TypeScript
- **Plugins**: Register with `await fastify.register(plugin)`
- **Routes**: Use route schemas for validation
- **WebSockets**: Handle messages in switch statements
- **Audio Processing**: Use AudioProcessor class per connection

### Project Structure
```
client/src/
├── App.tsx           # Main component
├── main.tsx          # Entry point
└── index.css         # Global styles

server/src/
├── index.ts          # Server setup and routes
└── audioProcessor.ts # Audio processing logic
```

### Documentation
- **JSDoc**: Use for public APIs and complex functions
- **Comments**: Explain "why", not "what"
- **README**: Keep updated with setup instructions

### Git Workflow
- **Commit Messages**: Present tense, imperative ("Add feature" not "Added feature")
- **Branches**: Feature branches from `master`
- **PRs**: Include description and test plan

## Existing Configuration Files
- `.editorconfig`: Consistent coding styles across editors
- `.prettierrc`: Prettier formatting rules
- `.gitignore`: Files/directories to ignore in git
- `tsconfig.json`: TypeScript compiler options (strict mode enabled)

## No Existing Cursor/Copilot Rules
- No `.cursorrules` file found
- No `.github/copilot-instructions.md` found
- No `.cursor/` directory found

## Running a Single Test (Future)
When tests are added, use:
```bash
# If using Jest
npx jest path/to/test.test.ts
npx jest -t "test name"

# If using Vitest
npx vitest path/to/test.test.ts
npx vitest -t "test name"
```

## Environment Setup
- Node.js 18+ required
- Install: `npm install`
- Environment variables in `server/.env` (PORT, HOST, NODE_ENV)
- Models go in `server/models/`