# dondon-build

Staging directory + **optional CI** cho DonDon desktop releases.

> **Board deploy thủ công** theo [THA-1500 plan v7](/THA/issues/THA-1500#document-plan): build local → DMG vào thư mục này → Phase C `scripts/publish-github-release.mjs` trong monorepo `dondon`. **Không cần** GitHub Actions secret cho luồng manual.

## Manual release (primary — board)

1. Trong monorepo `dondon`: `set -a && source .env.deploy && set +a` (xem `.env.deploy.example`)
2. `./scripts/deploy-full-release.sh B` — build + DMG → `DONDON_BUILD_DIR` (mặc định thư mục này)
3. `./scripts/deploy-full-release.sh C` — publish lên `techmely/dondon` Releases (DMG + `latest.json` + changelog)

Env `GH_TOKEN` cấu hình tại **`dondon/.env.deploy`** (local, gitignored).

## Optional CI (future / Windows matrix)

Workflow `.github/workflows/release-desktop.yml` — trigger tag `v*` hoặc `workflow_dispatch`, build matrix macOS + Windows trên GitHub Actions.

| Secret | Repo | Khi nào cần |
|--------|------|-------------|
| `DONDON_RELEASE_TOKEN` | `dondon-build` | Chỉ khi dùng CI cross-repo publish |

Scripts trong repo này (`extract-changelog.mjs`, `generate-latest-json.mjs`) được mirror sang `dondon/scripts/` cho luồng manual.

## Local script test

```bash
node scripts/extract-changelog.mjs 0.1.0 ../dondon/CHANGELOG.md
```

## Liên quan

- Manual routine: [THA-1500](/THA/issues/THA-1500) / [THA-1520](/THA/issues/THA-1520)
- GitHub Releases + manifest: [THA-1515](/THA/issues/THA-1515)
- Version SSOT: [THA-1513](/THA/issues/THA-1513)
