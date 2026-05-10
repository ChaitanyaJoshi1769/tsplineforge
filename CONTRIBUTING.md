# Contributing to TSplineForge

Thank you for your interest in contributing! This document outlines how to get started.

## Code of Conduct

Be respectful, inclusive, and professional. We welcome contributions from everyone.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/tsplineforge.git`
3. Create a branch: `git checkout -b feature/my-feature`
4. Set up development environment: See [GETTING_STARTED.md](./docs/GETTING_STARTED.md)

## Development Process

### Before You Start

- Check [existing issues](https://github.com/anthropics/tsplineforge/issues)
- Open an issue for new features to discuss approach
- Read relevant docs: [ARCHITECTURE.md](./ARCHITECTURE.md)

### Making Changes

#### Code Style

- **JavaScript/TypeScript**: Prettier (auto-format)
  ```bash
  pnpm format
  ```

- **Rust**: Rustfmt + Clippy
  ```bash
  cargo fmt
  cargo clippy --all-targets --all-features
  ```

- **Python**: Black + isort
  ```bash
  black .
  isort .
  ```

#### Commits

- Write clear, descriptive commit messages
- One logical change per commit
- Reference issues: `Fixes #123`

Example:
```
Add curvature computation to geometry engine

- Implement principal curvature calculation
- Add discrete Gaussian/mean curvature
- Include tests and benchmarks

Fixes #456
```

#### Tests

All code must include tests:

```rust
// src/curvature.rs
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gaussian_curvature() {
        // Test implementation
    }
}
```

```typescript
// src/services/mesh.test.ts
describe('MeshValidator', () => {
  it('detects non-manifold edges', () => {
    // Test implementation
  });
});
```

Run tests before pushing:
```bash
pnpm test
cd services/geometry-engine && cargo test
```

### Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass: `pnpm test`
4. Push to your fork
5. Create Pull Request with:
   - Clear title and description
   - Link to related issues
   - Screenshots/videos if UI changes
   - Benchmark results if performance changes

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code formatted (`pnpm format`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Commit messages are clear
- [ ] Branch up-to-date with main

## Areas for Contribution

### High Priority

- [ ] Complete T-Spline kernel implementation
- [ ] Add quad remeshing engine
- [ ] Implement AI topology assistant
- [ ] Add STEP/IGES export
- [ ] Improve viewport performance
- [ ] Add GPU acceleration (CUDA/Vulkan)

### Medium Priority

- [ ] Additional mesh formats (Parasolid, SAT)
- [ ] Collaborative editing improvements
- [ ] Performance benchmarking suite
- [ ] Documentation and tutorials
- [ ] Desktop app (Tauri)

### Good First Issues

- Documentation improvements
- Bug fixes (marked `good-first-issue`)
- Unit test coverage
- Code refactoring

## Architecture Decisions

Major changes need architectural discussion. Open an issue or discussion before implementing.

### Decision Process

1. Open issue describing change
2. Discuss approach in comments
3. Core team provides guidance
4. Implement and PR once approved

## Documentation

### API Documentation

```typescript
/**
 * Compute principal curvatures at vertex
 * @param mesh - Input mesh
 * @param vertexId - Vertex identifier
 * @returns Principal curvature values
 * @throws {ValidationError} If vertex doesn't exist
 */
export function principal_curvatures(
  mesh: Mesh,
  vertexId: u32
): PrincipalCurvatures
```

### Code Comments

- Explain *why*, not *what*
- Use comments for non-obvious logic
- Keep comments up-to-date

Good:
```rust
// Use Cholesky decomposition because matrix is SPD and faster than LU
let cholesky = A.cholesky().expect("Matrix not positive definite");
```

Avoid:
```rust
// Compute x
let x = A.lu() * b;
```

### Markdown Files

- Use clear headings
- Include code examples
- Add table of contents for long docs

## Testing Guidelines

### Unit Tests

- Test one thing per test
- Use descriptive names: `test_computes_curvature_correctly`
- Mock external dependencies

### Integration Tests

- Test service interactions
- Use test fixtures/factories
- Clean up after tests

### Performance Tests

- Benchmark critical paths
- Document expected performance
- Track regressions

## Deployment

Production changes require:
- All tests passing
- Code review approval
- Changelog entry
- Semantic version bump

## Getting Help

- **Questions**: Use [Discussions](https://github.com/anthropics/tsplineforge/discussions)
- **Bugs**: Open [Issues](https://github.com/anthropics/tsplineforge/issues)
- **Chat**: Discord (link in main README)

## Recognition

Contributors are recognized in:
- README.md contributors list
- Release notes
- Community spotlight

## Legal

By submitting code, you agree it's licensed under MIT and you own the rights to it.

---

Happy contributing! 🚀
