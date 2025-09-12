# Dependency Updates and Security Resolutions

This document tracks temporary dependency resolutions and explains when they can be removed.

## Temporary Security Resolutions

### Current Overrides (Added: December 2024)

The following package overrides are currently in place in `package.json`:

```json
"pnpm": {
  "overrides": {
    "braces": ">=3.0.3",
    "ansi-html": ">=0.0.9"
  }
}
```

### Why These Overrides Exist

These overrides address security vulnerabilities in transitive dependencies that come from Broccoli-related and other development packages:

- **braces**: Vulnerability in versions < 3.0.3 (CVE-2024-4068 - ReDoS vulnerability)
- **ansi-html**: Vulnerability in versions < 0.0.9 (CVE-2021-23424 - XSS vulnerability)

### When to Remove These Overrides

**⚠️ These overrides should be removed once the underlying Broccoli dependencies are updated.**

To check if these can be removed:

1. Run `pnpm audit` to see if vulnerabilities still exist
2. Check if broccoli-related packages have been updated to use secure versions
3. Remove overrides one by one and test that no vulnerabilities are reintroduced

### How to Remove

1. Remove the specific override from `package.json`
2. Run `pnpm install` to update the lockfile
3. Run `pnpm audit` to verify no new vulnerabilities
4. Run tests to ensure functionality is preserved

### Monitoring

These overrides should be reviewed regularly:
- Check monthly if underlying dependencies have been updated
- Monitor security advisories for new vulnerabilities
- Update override versions if newer secure versions are available

### Related Issues

- Broccoli ecosystem packages need to update their dependencies
- This is a temporary workaround until upstream packages are updated
- The overrides ensure we get the latest secure versions of these transitive dependencies
