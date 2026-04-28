# Contributing to EcoFeed

We love contributions! This document provides guidelines and instructions for contributing.

---

## Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Report violations to conduct@ecofeed.io

---

## Getting Started

### 1. Fork the Repository
```bash
git clone https://github.com/yourusername/ecofeed.git
cd ecofeed
```

### 2. Create a Branch
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 3. Setup Development Environment
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

---

## Making Changes

### Code Style

**Python (Backend)**
- Follow PEP 8
- Use type hints
- Add docstrings to functions
- Max line length: 100 characters

```python
def process_data(items: List[str]) -> Dict[str, int]:
    """Process items and return count by type.
    
    Args:
        items: List of item strings to process
        
    Returns:
        Dictionary with counts by item type
    """
    result = {}
    for item in items:
        result[item] = result.get(item, 0) + 1
    return result
```

**JavaScript/React (Frontend)**
- Use functional components
- Add PropTypes or TypeScript
- Use meaningful variable names
- Add comments for complex logic

```jsx
import { useState } from 'react';

export function MyComponent({ data }) {
  const [state, setState] = useState(null);
  
  return <div>{/* Component JSX */}</div>;
}
```

### Commit Messages

Use clear, descriptive commit messages:

```
feat: Add new feature description
fix: Fix bug description
docs: Update documentation
style: Format code changes
refactor: Restructure code
perf: Improve performance
test: Add tests
chore: Maintenance tasks
```

Examples:
```
feat: Add email notifications for pickup requests
fix: Fix CORS error on localhost:3000
docs: Update API documentation
```

---

## Testing

### Backend Tests
```bash
cd backend
pytest
pytest --cov=.
```

### Frontend Tests
```bash
cd frontend
npm test
npm run lint
```

### Manual Testing
1. Test in development environment
2. Test on multiple browsers (Chrome, Firefox, Safari)
3. Test on mobile devices
4. Test API endpoints with curl/Postman

---

## Pull Request Process

1. **Update branch**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push changes**
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request**
   - Use a descriptive title
   - Reference related issues
   - Describe changes clearly
   - Add screenshots/videos if UI changes

4. **PR Description Template**
   ```markdown
   ## Description
   Brief description of changes
   
   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   
   ## Testing
   Describe how you tested
   
   ## Screenshots (if applicable)
   Add screenshots
   
   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] No breaking changes
   ```

5. **Code Review**
   - Address reviewer feedback
   - Make requested changes
   - Re-request review

6. **Merge**
   - Rebase and merge (preferred)
   - Squash and merge (for small fixes)

---

## Reporting Issues

### Bug Report
```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: 
- Browser:
- Python version:
- Node version:

## Screenshots/Logs
Add relevant screenshots or error logs
```

### Feature Request
```markdown
## Description
Clear description of the feature

## Use Case
Why this feature is needed

## Proposed Solution
Your idea for implementation

## Alternatives
Other approaches considered
```

---

## Documentation

### Writing Docs

- Use clear, simple language
- Include examples
- Add diagrams where helpful
- Keep up to date with code changes

### Types of Documentation

1. **README.md** - Overview and quick start
2. **DEPLOYMENT_GUIDE.md** - Deployment instructions
3. **SECURITY.md** - Security guidelines
4. **Code Comments** - Explain complex logic
5. **Docstrings** - Document functions/classes
6. **API Docs** - Document endpoints

---

## Performance Guidelines

### Backend
- Keep response times < 500ms
- Use async/await for I/O
- Cache frequently accessed data
- Index database queries

### Frontend
- Keep bundle size < 500KB
- Use lazy loading for components
- Optimize images
- Minimize re-renders

---

## Security Guidelines

- Don't commit secrets or credentials
- Validate all user input
- Escape output to prevent XSS
- Use parameterized queries
- Follow OWASP guidelines
- Report security issues privately

---

## Release Process

### Version Numbering
Use semantic versioning: MAJOR.MINOR.PATCH
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

### Release Steps
1. Update version in package.json and main.py
2. Update CHANGELOG.md
3. Create GitHub Release with tag
4. Build and push Docker images
5. Deploy to production

---

## Community

- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - General questions and ideas
- **Email** - security@ecofeed.io for security issues

---

## Helpful Resources

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Python Style Guide](https://pep8.org/)
- [React Best Practices](https://react.dev/learn)

---

## Questions?

- Check existing issues
- Review documentation
- Ask in discussions
- Email support@ecofeed.io

---

Thank you for contributing to EcoFeed! 🎉

---

**Last Updated:** April 2026
