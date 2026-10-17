# Release Process

## Overview

This project uses a two-stage release process: **RC (Release Candidate) → Production**. Version numbers are date-based (`YYYY.MM.DD.N`) and managed via git tags—no VERSION file is committed to the main branch.

## How to Release

### 1. Create RC Release

1. Go to **GitHub Actions** → **"Create RC Release"** workflow
2. Click **"Run workflow"** on the `main` branch
3. The workflow will:
   - Generate version number (e.g., `2025.12.20.1`)
   - Create git tag `rc/2025.12.20.1`
   - Build frontend with `VITE_APP_VERSION`
   - Generate changelog from PRs since last production release
   - Create GitHub pre-release
   - **Does NOT deploy** (RC environment not configured)

### 2. Review RC

- Review the generated changelog in the GitHub pre-release
- Test the RC build artifacts
- If RC is buggy or incomplete, create a new RC with incremented version (`2025.12.20.2`)

### 3. Promote RC to Production

1. Go to **GitHub Actions** → **"Promote RC to Production"** workflow
2. Click **"Run workflow"**
3. Enter the RC tag to promote (e.g., `rc/2025.12.20.1`)
4. The workflow will:
   - Create production git tag `v2025.12.20.1`
   - Update GitHub release from pre-release to full release
   - Build and deploy frontend to AWS S3
   - Invalidate CloudFront cache
   - Deploy backend to Heroku
   - Both frontend and backend receive `APP_VERSION=2025.12.20.1`

## Versioning

### Format: `YYYY.MM.DD.N`

- **Date-based**: Year, month, day
- **Sequence number**: Multiple releases on same day increment `N`
- **Examples**: `2025.12.20.1`, `2025.12.20.2`, `2025.12.21.1`

### Version Source of Truth

- **Git tags**: RC tags (`rc/*`) and production tags (`v*`)
- **No VERSION file**: Version not committed to repository
- **Calculated by workflow**: Reads existing tags to determine next version

### Consuming Version in Code

**Frontend** (`packages/app/src`):

```typescript
const version = import.meta.env.VITE_APP_VERSION; // Set at build time
```

**Backend** (`webserver/main/settings.py`):

```python
APP_VERSION = os.environ.get('APP_VERSION', 'unknown')  # Set at runtime
```

## Architecture

### Workflows

1. **`.github/workflows/release-rc.yml`** - Create RC Release

   - Manually triggered
   - Calculates next RC version from git tags
   - Creates RC tag and pre-release
   - Builds artifacts (no deployment)

2. **`.github/workflows/release-prod.yml`** - Promote RC to Production

   - Manually triggered with RC tag input
   - Creates production tag from RC tag
   - Calls reusable deployment workflow

3. **`.github/workflows/deploy-reusable.yml`** - Reusable Deployment
   - Accepts `environment` and `version` inputs
   - Builds frontend with `VITE_APP_VERSION`
   - Deploys to AWS S3 and invalidates CloudFront
   - Deploys to Heroku with `HD_APP_VERSION`

### Tag Conventions

- **RC tags**: `rc/YYYY.MM.DD.N` → GitHub pre-releases
- **Production tags**: `vYYYY.MM.DD.N` → GitHub full releases
- **No branch commits**: Main branch stays clean, tags are version source

### Failed RCs

If an RC is buggy or incomplete:

- **Do NOT reuse** the same RC version
- **Create new RC** with incremented sequence number
- Example: `rc/2025.12.20.1` is bad → fix issues → create `rc/2025.12.20.2`
- Maintains full audit trail of all RC attempts

## Implementation Plan

### Phase 1: Documentation

1. Create/update `release.md` with new release process documentation

### Phase 2: Core Workflows

2. Create reusable deployment workflow with environment and version inputs
3. Create RC release workflow with date-based version generation
4. Create production promotion workflow accepting RC tag input

### Phase 3: Version Consumption

5. Add version exposure in frontend via Vite define
6. Add version exposure in backend via environment variable

### Phase 4: Migration

7. Archive or remove old `release.yml` workflow
8. Test new release process end-to-end

### Decisions

- ✅ Date-based versioning (no semver)
- ✅ RC failures always increment version number
- ✅ Git tags as source of truth (no VERSION file)
- ✅ RC builds artifacts only (no deployment)
- ✅ Version passed via environment variables
