# Contributing to OpenVox

Thank you for your interest in contributing to OpenVox! This document provides guidelines and information for contributors.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in the Issues
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (browser, OS, device)
   - Screenshots if applicable

### Suggesting Features

1. Check existing Issues and Discussions
2. Create a new issue with:
   - Clear description of the feature
   - Use case and benefits
   - Proposed implementation approach

### Development Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/OpenVox.git
   cd OpenVox
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start development servers:
   ```bash
   npm run dev:client  # Starts React dev server on port 3000
   npm run dev:server  # Starts Fastify server on port 4000
   ```

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/your-bug-fix
   ```

2. Make your changes following the coding standards

3. Test your changes:
   - Ensure both client and server start without errors
   - Test audio capture and processing functionality
   - Verify WebSocket communication works

4. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

6. Create a Pull Request

### Coding Standards

- Use TypeScript for type safety
- Follow existing code style and conventions
- Add comments for complex logic
- Keep functions small and focused
- Use meaningful variable and function names

### Project Structure

- `client/` - React frontend application
- `server/` - Node.js backend with Fastify
- Keep related code together
- Use clear separation of concerns

### Audio Processing

When contributing to audio processing:
- Test with various audio inputs
- Consider latency implications
- Handle edge cases (silence, noise, distortion)
- Document any model requirements

### Documentation

- Update README.md for significant changes
- Add JSDoc comments for public APIs
- Include examples for new features
- Keep documentation up-to-date

## Pull Request Process

1. Update documentation if needed
2. Ensure all tests pass (if applicable)
3. Request review from maintainers
4. Address feedback promptly
5. Once approved, maintainers will merge

## Release Process

Maintainers will handle versioning and releases following semantic versioning.

## Questions?

- Open a Discussion for general questions
- Join our community channels (if available)
- Contact maintainers directly for security issues

Thank you for contributing to OpenVox!