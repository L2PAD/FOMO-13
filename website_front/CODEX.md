# Project workflow for AI agents

This repository uses an AI-assisted workflow for the frontend deployed to:

```text
https://development.fomo.cx
```

## Main branches

* `main` - stable production branch.
* `fomo_v2_architecture` - development/staging branch. Pushes or merges into this branch deploy automatically to `https://development.fomo.cx`.
* `feature/*` - task branches created by AI agents.

## Golden rule

Never push directly to `fomo_v2_architecture`.

Always work in a separate `feature/*` branch and open a Pull Request into `fomo_v2_architecture`.

## Required workflow

For every task:

1. Start from the latest `fomo_v2_architecture`.
2. Create a new branch:

   * `feature/short-task-name`
   * or `feature/codex-short-task-name`
3. Make the requested frontend changes.
4. Run validation:

   ```bash
   npm run build
   ```

5. Do not commit secrets or local environment files.
6. Commit changes with a clear message.
7. Push the feature branch.
8. Open a Pull Request into `fomo_v2_architecture`.

After the PR is merged into `fomo_v2_architecture`, GitHub Actions deploys automatically to:

```text
https://development.fomo.cx
```

Backend dev API:

```text
https://devapi.fomo.cx/api
```

Backend healthcheck:

```text
https://devapi.fomo.cx/__health
```

## Do not commit

Never commit:

```text
.env
.env.*
.env.development
.env.production
private keys
tokens
passwords
database dumps
server credentials
```

Only `.env.example` may be committed.

## Deployment

Do not deploy directly to the server.

Deployment is handled by GitHub Actions after merge into `fomo_v2_architecture`.

Frontend deployment workflow:

```text
.github/workflows/deploy-development.yml
```

Server deploy script:

```text
scripts/deploy/deploy-development.sh
```

## Frontend deployment target

Public frontend dev URL:

```text
https://development.fomo.cx
```

Local frontend inside server:

```text
http://127.0.0.1:3001
```

Docker container:

```text
fomo-frontend-development
```

## Coding rules

* Keep changes minimal and focused on the task.
* Do not rewrite unrelated modules.
* Do not change deployment files unless the task explicitly asks for it.
* Do not change branch names.
* Do not change server secrets.
* Do not modify `.env.development`.
* If a new environment variable is required, add it only to `.env.example`.
* If the task changes API usage, ensure the frontend uses the dev backend:

  ```text
  https://devapi.fomo.cx/api
  ```

## Pull Request description template

Use this template:

```markdown
## What changed

- ...

## Validation

- [ ] `npm run build` passed
- [ ] No secrets committed
- [ ] `.env` / `.env.development` not changed

## Deployment notes

- Deploys automatically after merge into `fomo_v2_architecture`
- Frontend dev: https://development.fomo.cx
- Backend dev API: https://devapi.fomo.cx/api
```
