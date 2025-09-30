# Branching Strategy

## Branch Naming Convention

We use descriptive branch names based on the type of work:

### For New Features or Enhancements
```
# Standard branching technique
feature/your-name/feature-description
enhancement/your-name/enhancement-description

# Examples:
feature/darshan/ai-cost-optimization
enhancement/john/chat-performance-improvements
feature/sarah/multi-cloud-integration
```

### For Bug Fixes
```
bugfix/your-name/bug-description
hotfix/your-name/critical-bug-description

# Examples:
bugfix/alex/authentication-redirect-issue
hotfix/maria/memory-leak-chat-component
```

### For Documentation
```
docs/your-name/documentation-description

# Examples:
docs/tom/api-documentation-update
docs/lisa/contributing-guidelines
```

### For Refactoring
```
refactor/your-name/refactor-description

# Examples:
refactor/mike/chat-component-cleanup
refactor/anna/database-service-optimization
```

## Branch Workflow

1. Create your branch from the latest `dev` branch:
```bash
git checkout dev
git pull upstream dev
git checkout -b feature/your-name/feature-description
```

2. Work on your changes in your branch

3. Keep your branch updated with the latest changes:
```bash
git fetch upstream
git rebase upstream/dev
```

4. Push your branch to your fork:
```bash
git push origin feature/your-name/feature-description
```

## Best Practices

- Keep branches focused on a single purpose (feature, fix, or docs).
- Rebase frequently to reduce merge conflicts and keep history linear.
- Use descriptive branch names so reviewers can immediately understand intent.
- Open small, focused PRs where possible — large PRs are harder to review and more error prone.

---

For more details, see the `CONTRIBUTING.md` in the repository root.