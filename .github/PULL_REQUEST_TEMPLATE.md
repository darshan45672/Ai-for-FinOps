## Pull Request Checklist

Before requesting review, ensure your PR meets the following requirements:

- ✅ Pass all CI checks (tests, linting, and build)
- ✅ Include tests for new functionality (unit/integration/e2e as appropriate)
- ✅ Update documentation if the public behavior or API changed
- ✅ Follow branching conventions (branch from `dev`, use descriptive branch names)
- ✅ Provide a clear, concise description of what changed and why
- ✅ Keep the PR focused on a single feature, improvement, or bug fix

### PR Title

Use a short, descriptive title in the form:

```
type(scope): short description
```

Examples:

- `feat(auth): add OAuth2 sign-in support`
- `fix(api): handle null responses from provider`

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`

<!-- 
Thank you for contributing to Ai-for-FinOps! 
Please fill out this template completely. Remove any sections that don't apply.
-->

## Description
<!-- Provide a clear and concise description of what this PR accomplishes -->
<!-- Example: This PR adds user authentication functionality using JWT tokens -->



## Related Issue
<!-- Link the related issue(s) this PR addresses -->
<!-- Example: Closes #123, Fixes #456 -->
Closes #

## Type of Change
<!-- Mark the type(s) that apply to this PR -->
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Documentation update
- [ ] Refactoring (code improvement without changing functionality)
- [ ] Performance improvement
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)

## Changes Made
<!-- List the specific changes made in this PR -->
<!-- Example:
- Added authentication module with JWT support
- Created login and registration endpoints
- Updated user model with password hashing
-->

- 
- 
- 

## Testing
<!-- Describe the tests you ran and mark completed items -->
- [ ] Unit tests pass locally
- [ ] Integration tests pass locally
- [ ] Manual testing completed
- [ ] Cross-browser testing (if frontend changes)
- [ ] Mobile responsiveness tested (if UI changes)

### Test Details
<!-- Describe your testing approach and any edge cases covered -->



## Screenshots (if applicable)
<!-- Add screenshots or screen recordings for UI changes -->
<!-- You can drag and drop images directly into this text area -->



## Additional Context
<!-- Add any other context, dependencies, or information reviewers should know -->



## Checklist
<!-- Ensure all items are completed before requesting review -->
- [ ] Code follows project coding standards and style guide
- [ ] Self-review completed (checked for bugs, typos, and logic errors)
- [ ] Comments added for complex or unclear code
- [ ] Documentation updated (README, API docs, etc.)
- [ ] No breaking changes (or breaking changes are clearly documented)
- [ ] All tests pass locally
- [ ] No new warnings or errors introduced
- [ ] Branch is up to date with the base branch

### How to test

Describe how reviewers can verify the changes locally. Include commands or steps to run tests, start the app, or reproduce the issue.

Example:

```
# install dependencies
npm ci

# run unit tests
npm test

# run lint
npm run lint

# run the app (if applicable)
npm run dev
```

### Checklist for reviewers

- [ ] CI green
- [ ] Tests added/updated and passing
- [ ] Documentation updated (if necessary)
- [ ] Changes limited to a single purpose
- [ ] No sensitive data or secrets included

If your change is large or touches many files, please split it into smaller PRs where possible.

Thank you for contributing! Your clear and well-tested PRs make reviews faster and releases safer.
