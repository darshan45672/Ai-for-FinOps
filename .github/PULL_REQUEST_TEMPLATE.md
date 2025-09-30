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

### Description

Provide a short description of the changes and the motivation behind them. Link any related issues (e.g. `Closes #123`).

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
