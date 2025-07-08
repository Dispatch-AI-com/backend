# Task Completion Checklist

## Code Quality Checks
- [ ] **Linting**: Run `pnpm run lint` to ensure code style compliance
- [ ] **Type Checking**: Run `pnpm run type-check` for TypeScript validation
- [ ] **Tests**: Run `pnpm run test` to ensure no regressions
- [ ] **Build**: Verify `pnpm run build` completes successfully

## Testing Requirements
- [ ] **Unit Tests**: Add tests for new functions/methods
- [ ] **Integration Tests**: Test API endpoints with proper requests
- [ ] **Manual Testing**: Test affected workflows end-to-end
- [ ] **Health Checks**: Verify `/health` and `/health/db` endpoints work

## Documentation Updates
- [ ] **Code Comments**: Add docstrings/comments for complex logic
- [ ] **README**: Update if new features or setup steps added
- [ ] **API Documentation**: Swagger docs auto-generated from decorators

## Docker & Deployment
- [ ] **Docker Build**: Ensure `docker compose up --build` works
- [ ] **Environment Variables**: Verify all required env vars are documented
- [ ] **UAT Testing**: Test with `docker-compose.uat.yml` if applicable

## AI Service Specific
- [ ] **Prompt Testing**: Validate new prompts work with various inputs
- [ ] **Validation Testing**: Test validation functions with edge cases
- [ ] **Redis Integration**: Verify data persistence and retrieval
- [ ] **LLM Integration**: Test OpenAI API calls and error handling

## Final Verification
- [ ] **Code Review**: Review changes for potential issues
- [ ] **Git Status**: Ensure all changes are committed
- [ ] **Branch Cleanup**: Clean up temporary files and branches