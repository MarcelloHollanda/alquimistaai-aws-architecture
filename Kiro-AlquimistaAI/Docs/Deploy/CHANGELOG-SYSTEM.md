# Changelog System Documentation

## Overview

The Fibonacci AWS Setup project uses an automated changelog generation system based on conventional commits. This system automatically generates changelogs, creates releases, and maintains version history.

## Conventional Commits

### Format

All commits must follow the conventional commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scopes

Suggested scopes for this project:
- `fibonacci`: Core orchestrator changes
- `nigredo`: Prospecting agents changes
- `alquimista`: Platform changes
- `mcp`: MCP integrations
- `lambda`: Lambda functions
- `database`: Database changes
- `api`: API changes
- `auth`: Authentication changes
- `security`: Security improvements
- `monitoring`: Monitoring and observability
- `ci`: CI/CD changes
- `docs`: Documentation
- `tests`: Test changes

### Examples

```bash
# Feature commit
feat(nigredo): add sentiment analysis agent

# Bug fix
fix(api): resolve authentication timeout issue

# Breaking change
feat(database)!: migrate to Aurora Serverless v2

BREAKING CHANGE: Database connection strings have changed
```

## Using the Commit Helper

We provide a commit helper script to make creating conventional commits easier:

```bash
npm run commit
```

This interactive script will guide you through creating a properly formatted commit.

## Automatic Releases

### Release Types

The system automatically determines release types based on commits:

- **Patch** (1.0.1): Bug fixes and chores
- **Minor** (1.1.0): New features
- **Major** (2.0.0): Breaking changes

### Manual Releases

You can also trigger manual releases:

```bash
# Patch release
npm run release:patch

# Minor release
npm run release:minor

# Major release
npm run release:major

# Dry run (preview changes)
npm run release:dry
```

### GitHub Workflow

The release workflow (`.github/workflows/release.yml`) automatically:

1. Detects if a release is needed based on conventional commits
2. Runs tests and linting
3. Generates changelog
4. Creates a new version tag
5. Pushes changes to GitHub
6. Creates a GitHub release with release notes
7. Comments on related issues

## Changelog Generation

### Automatic Generation

Changelogs are automatically generated during releases based on conventional commits.

### Manual Generation

You can manually generate changelog entries:

```bash
# Add new entries to existing changelog
npm run changelog

# Generate complete changelog from scratch
npm run changelog:first
```

## Configuration Files

### .versionrc.json

Controls standard-version behavior:
- Commit types included in changelog
- URL formats for GitHub links
- Bump and package files
- Release commit message format

### .commitlintrc.json

Enforces conventional commit format:
- Allowed commit types
- Case rules
- Length limits
- Required fields

## GitHub Integration

### Release Notes

Each GitHub release includes:
- Changelog for the version
- Installation instructions
- Deployment commands
- Link to full changelog

### Issue Linking

The system automatically:
- Links commits to issues using `#123` syntax
- Comments on resolved issues when released
- Creates cross-references between releases and issues

## Best Practices

### Writing Commit Messages

1. **Use imperative mood**: "add feature" not "added feature"
2. **Be specific**: "fix login timeout" not "fix bug"
3. **Include scope when relevant**: "feat(api): add health check endpoint"
4. **Reference issues**: "fix(auth): resolve token expiration #123"

### Breaking Changes

For breaking changes:
1. Add `!` after the scope: `feat(api)!: change response format`
2. Include `BREAKING CHANGE:` in the footer with description
3. Update documentation accordingly

### Release Strategy

- **Development**: Continuous integration with automatic patch releases
- **Staging**: Manual minor releases for feature testing
- **Production**: Manual major releases with approval process

## Troubleshooting

### Common Issues

1. **Commit rejected**: Check commit message format with commitlint
2. **Release failed**: Ensure all tests pass and no uncommitted changes
3. **Missing changelog**: Run `npm run changelog:first` for initial setup

### Validation

Check your commit message format:
```bash
echo "feat: add new feature" | npx commitlint
```

Preview release changes:
```bash
npm run release:dry
```

## Integration with CI/CD

The changelog system integrates with our CI/CD pipeline:

1. **Pull Requests**: Validate commit messages
2. **Main Branch**: Automatic releases on merge
3. **Manual Triggers**: Support for emergency releases
4. **Notifications**: Team notifications on successful releases

## Maintenance

### Regular Tasks

1. Review and clean up old releases
2. Update changelog templates if needed
3. Monitor release automation health
4. Update documentation as project evolves

### Configuration Updates

When updating the changelog system:
1. Test changes in development environment
2. Update documentation
3. Communicate changes to team
4. Monitor first few releases after changes