# Simple frontend workflow for the customer

The customer does not need to use the terminal.

All frontend work should be done through AI tools such as Codex Cloud or another connected coding assistant.

Frontend dev URL:

```text
https://development.fomo.cx
```

Backend dev API:

```text
https://devapi.fomo.cx/api
```

## How to make a frontend change

### Step 1 - Open the AI coding tool

Open Codex Cloud or the connected AI coding environment for this repository.

Repository:

```text
FOMOwiki/FOMO-FRONT
```

Base branch:

```text
fomo_v2_architecture
```

### Step 2 - Give the AI a task

Use this prompt:

```text
Create a new feature branch from the latest fomo_v2_architecture.

Do not push directly to fomo_v2_architecture.

Task:
<describe the frontend task here>

After making changes:
1. Run npm run build.
2. Do not commit .env files, secrets, tokens, private keys, or server credentials.
3. Commit changes to the feature branch.
4. Open a Pull Request into fomo_v2_architecture.
5. Include a short summary of changes and validation results in the PR description.
```

Example:

```text
Create a new feature branch from the latest fomo_v2_architecture.

Do not push directly to fomo_v2_architecture.

Task:
Fix the funds page layout so that fund name, logo, description, and portfolio count are displayed correctly.

After making changes:
1. Run npm run build.
2. Do not commit .env files, secrets, tokens, private keys, or server credentials.
3. Commit changes to the feature branch.
4. Open a Pull Request into fomo_v2_architecture.
5. Include a short summary of changes and validation results in the PR description.
```

### Step 3 - Review the Pull Request

Open GitHub Pull Requests.

Check:

```text
feature/* -> fomo_v2_architecture
```

Review:

* What files changed
* Whether the change matches the task
* Whether `.env` or secrets were not committed
* Whether `npm run build` passed

### Step 4 - Merge the Pull Request

After review, click:

```text
Merge Pull Request
```

After merge, GitHub Actions automatically deploys the frontend to:

```text
https://development.fomo.cx
```

### Step 5 - Check deployment

Open:

```text
https://development.fomo.cx
```

Also check backend health:

```text
https://devapi.fomo.cx/__health
```

## Important rules

The customer should not:

```text
use terminal
SSH into the server
edit .env.development
handle private keys
push directly to fomo_v2_architecture
deploy manually
```

The customer should only:

```text
create tasks for AI
review Pull Requests
merge approved Pull Requests
check development.fomo.cx after deployment
```

## Branch flow

Use this flow:

```text
feature/task-name
        -> Pull Request
fomo_v2_architecture
        -> GitHub Actions
https://development.fomo.cx
```

## Safe AI prompt for every frontend task

Use this prompt for every AI coding task:

```text
Work only in a new feature branch from fomo_v2_architecture.

Do not push directly to fomo_v2_architecture.
Do not commit secrets.
Do not commit .env, .env.*, .env.development, database dumps, private keys, or tokens.
Do not deploy directly to the server.

Make the requested frontend changes.
Run npm run build.
Commit changes to the feature branch.
Open a Pull Request into fomo_v2_architecture.
Add a clear PR description with changed files, validation result, and deployment notes.

Task:
<write task here>
```

## Deployment

Deployment is automatic.

When a Pull Request is merged into:

```text
fomo_v2_architecture
```

GitHub Actions deploys the frontend to:

```text
https://development.fomo.cx
```

No manual server action is required.
