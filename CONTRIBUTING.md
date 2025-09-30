# Contributing to AI for FinOps

Thank you for your interest in contributing to AI for FinOps! We welcome contributions from the community and are excited to collaborate with you to build the future of AI-powered financial operations.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Issue Assignment Process](#issue-assignment-process)
- [Branching Strategy](#branching-strategy)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

## 🤝 Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- **Be respectful** and inclusive in your language and actions
- **Be collaborative** and constructive in discussions
- **Be patient** with newcomers and those learning
- **Focus on what's best** for the community and project

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** configured with your GitHub account
- **VS Code** or your preferred IDE
- Basic knowledge of **TypeScript**, **React**, and **NestJS**

### Local Development Setup

1. **Fork the repository** to your GitHub account

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Ai-for-FinOps.git
   cd Ai-for-FinOps
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/darshan45672/Ai-for-FinOps.git
   ```

4. **Install dependencies** for all services
   ```bash
   # Frontend
   cd frontend && npm install
   
   # Authentication Service
   cd ../authentication && npm install
   
   # Backend Service
   cd ../backend && npm install
   
   # Database Service
   cd ../database && npm install
   ```

5. **Set up environment variables**
   ```bash
   # Copy example files and configure
   cp frontend/.env.example frontend/.env.local
   cp authentication/.env.example authentication/.env
   cp backend/.env.example backend/.env
   cp database/.env.example database/.env
   ```

## 📝 Issue Assignment Process

### How Issues Are Assigned

Issues in this project are assigned using a **name-based assignment system**:

1. **Browse open issues** in the [Issues tab](https://github.com/darshan45672/Ai-for-FinOps/issues)
2. **Comment on the issue** you'd like to work on with: `"I'd like to work on this"`
3. **Wait for assignment** - A maintainer will assign the issue to you
4. **Start working** only after the issue is officially assigned to your username

### Issue Labels

- 🐛 **bug** - Something isn't working correctly
- ✨ **enhancement** - New feature or improvement
- 📚 **documentation** - Documentation updates
- 🆘 **help wanted** - Community help needed
- 🟢 **good first issue** - Perfect for newcomers
- 🔥 **priority** - High priority items
- 🚀 **feature** - Major new functionality

### Creating New Issues

When creating an issue, please:

1. **Search existing issues** to avoid duplicates
2. **Use appropriate labels** to categorize your issue
3. **Provide detailed description** with steps to reproduce (for bugs)
4. **Include screenshots** or code snippets when helpful
5. **Suggest solutions** if you have ideas

## 🌿 Branching Strategy

### Branch Naming Convention

We use descriptive branch names based on the type of work:

#### For New Features or Enhancements
```bash
# Standard branching technique
feature/your-name/feature-description
enhancement/your-name/enhancement-description

# Examples:
feature/darshan/ai-cost-optimization
enhancement/john/chat-performance-improvements
feature/sarah/multi-cloud-integration
```

#### For Bug Fixes
```bash
bugfix/your-name/bug-description
hotfix/your-name/critical-bug-description

# Examples:
bugfix/alex/authentication-redirect-issue
hotfix/maria/memory-leak-chat-component
```

#### For Documentation
```bash
docs/your-name/documentation-description

# Examples:
docs/tom/api-documentation-update
docs/lisa/contributing-guidelines
```

#### For Refactoring
```bash
refactor/your-name/refactor-description

# Examples:
refactor/mike/chat-component-cleanup
refactor/anna/database-service-optimization
```

### Branch Workflow

1. **Create your branch** from the latest `dev` branch:
   ```bash
   git checkout dev
   git pull upstream dev
   git checkout -b feature/your-name/feature-description
   ```

2. **Work on your changes** in your branch

3. **Keep your branch updated** with the latest changes:
   ```bash
   git fetch upstream
   git rebase upstream/dev
   ```

4. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-name/feature-description
   ```

## 💻 Development Workflow

### 1. Before Starting Work

- ✅ Ensure the issue is assigned to you
- ✅ Create appropriate branch following naming convention
- ✅ Sync with latest `dev` branch changes
- ✅ Set up local development environment

### 2. During Development

- 📝 **Write clean, readable code** following our standards
- 🧪 **Add tests** for new functionality
- 📚 **Update documentation** when necessary
- 🔄 **Commit frequently** with descriptive messages
- ⚡ **Test your changes** across all affected services

### 3. Before Submitting PR

- ✅ **Run all tests** and ensure they pass
- ✅ **Run linting** and fix any issues
- ✅ **Test in multiple browsers** (for frontend changes)
- ✅ **Update documentation** if needed
- ✅ **Squash commits** if necessary for clean history

## 📏 Coding Standards

### TypeScript/JavaScript

```typescript
// ✅ Good: Use descriptive names and proper typing
interface CloudResource {
  id: string;
  type: 'ec2' | 'rds' | 's3';
  cost: number;
  region: string;
}

const analyzeCloudCosts = async (resources: CloudResource[]): Promise<AnalysisResult> => {
  // Implementation here
};

// ❌ Bad: Vague names and any types
const analyze = (data: any) => {
  // Implementation here
};
```

### React Components

```typescript
// ✅ Good: Functional component with proper props typing
interface ChatMessageProps {
  message: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  onEdit?: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  sender, 
  timestamp, 
  onEdit 
}) => {
  return (
    <div className="flex items-start space-x-3 p-4">
      {/* Component implementation */}
    </div>
  );
};
```

### CSS/Styling

- **Use Tailwind CSS** classes for styling
- **Follow mobile-first** responsive design
- **Use semantic HTML** elements
- **Ensure accessibility** with proper ARIA labels

### Commit Messages

Follow conventional commit format:

```bash
# Types: feat, fix, docs, style, refactor, test, chore
feat(chat): add real-time message streaming
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
style(ui): improve button hover states
refactor(api): optimize database queries
test(auth): add unit tests for login flow
chore(deps): update dependencies
```

## 🔄 Pull Request Process

### Creating a Pull Request

1. **Push your branch** to your fork
2. **Open a PR** against the `dev` branch (not `main`)
3. **Fill out the PR template** completely
4. **Link the related issue** using `Closes #issue-number`
5. **Request review** from maintainers

### PR Requirements

Your pull request must:

- ✅ **Pass all CI checks** (tests, linting, build)
- ✅ **Include tests** for new functionality
- ✅ **Update documentation** if needed
- ✅ **Follow branching conventions**
- ✅ **Have a clear description** of changes
- ✅ **Be focused** on a single feature/fix

### PR Template

```markdown
## Description
Brief description of what this PR does.

## Related Issue
Closes #issue-number

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if frontend)

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows project standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** run on PR creation
2. **Maintainer review** within 48 hours
3. **Address feedback** promptly
4. **Final approval** and merge by maintainers

## 🧪 Testing Guidelines

### Running Tests

```bash
# Run tests for all services
npm run test

# Run tests for specific service
cd frontend && npm run test
cd authentication && npm run test
cd backend && npm run test
cd database && npm run test

# Run tests in watch mode
npm run test:watch
```

### Writing Tests

#### Frontend Testing
```typescript
// Component tests using React Testing Library
import { render, screen } from '@testing-library/react';
import { ChatMessage } from './chat-message';

describe('ChatMessage', () => {
  it('renders user message correctly', () => {
    render(
      <ChatMessage 
        message="Hello, AI!" 
        sender="user" 
        timestamp={new Date()} 
      />
    );
    
    expect(screen.getByText('Hello, AI!')).toBeInTheDocument();
  });
});
```

#### Backend Testing
```typescript
// API endpoint tests using Jest
describe('AuthController', () => {
  it('should authenticate user with valid credentials', async () => {
    const result = await authController.login({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(result.accessToken).toBeDefined();
  });
});
```

## 📚 Documentation

### Code Documentation

- **Add JSDoc comments** for public APIs
- **Include inline comments** for complex logic
- **Update README** files when adding new features
- **Create examples** for new components/APIs

### Example Documentation

```typescript
/**
 * Analyzes cloud resource costs and provides optimization recommendations
 * @param resources - Array of cloud resources to analyze
 * @param timeframe - Analysis timeframe ('daily' | 'weekly' | 'monthly')
 * @returns Promise resolving to analysis results with recommendations
 * @example
 * ```typescript
 * const analysis = await analyzeCloudCosts(resources, 'monthly');
 * console.log(analysis.recommendations);
 * ```
 */
export async function analyzeCloudCosts(
  resources: CloudResource[],
  timeframe: AnalysisTimeframe
): Promise<AnalysisResult> {
  // Implementation
}
```

## 🌟 Recognition

Contributors will be recognized in:

- **README.md** contributors section
- **Release notes** for their contributions
- **GitHub insights** and contribution graphs
- **Community highlights** in project updates

## 💬 Community

### Getting Help

- **GitHub Discussions** - For questions and general discussion
- **Issues** - For bug reports and feature requests
- **Pull Requests** - For code review and collaboration

### Communication

- Be **respectful** and **constructive** in all interactions
- **Ask questions** when you're unsure about anything
- **Share knowledge** and help other contributors
- **Provide feedback** on PRs and issues

### Mentorship

New to open source? We're here to help!

- Look for **"good first issue"** labels
- **Ask for guidance** in issue comments
- **Join discussions** to learn from the community
- **Don't hesitate** to ask questions

## 🙏 Thank You

Thank you for contributing to AI for FinOps! Your contributions help make cloud financial operations more intelligent and accessible for businesses worldwide.

---

**Happy Coding!** 🚀

For questions about contributing, please open a discussion or contact the maintainers.