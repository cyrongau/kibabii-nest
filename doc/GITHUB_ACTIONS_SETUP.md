# Setting Up GitHub Actions CI/CD for Kibabii Nest

The CI/CD pipeline is configured in `.github/workflows/ci.yml`. It automatically runs tests, lint checks, and verifies the application builds for both the NestJS backend and Next.js frontend web application upon pushing or opening a pull request to the `main` branch.

Below is the step-by-step guide to configure the repository and secrets.

---

## 1. Automated Testing Setup

To run NestJS unit tests, the pipeline installs Node.js packages and executes `npm run test` inside the runner container.
Since the backend unit tests run in isolation and do not hit a live database, they do not require database connections.
If integration/E2E tests are added in the future, you can configure GitHub Actions to launch a PostgreSQL service container side-by-side using the `services:` block in YAML.

---

## 2. Setting Up GitHub Actions Secrets (For deployment, if configured later)

If you decide to automate staging or production deployments using GitHub Actions (e.g. automatically building Docker images and pushing them to a server), you will need to add Secrets to your GitHub repository.

1. Go to your repository on GitHub.
2. Select **Settings** (gear icon) > **Secrets and variables** > **Actions**.
3. Click **New repository secret**.
4. Define the following secrets if needed:
   - `SSH_HOST`: The IP or hostname of the live/staging server.
   - `SSH_USER`: The SSH login username (e.g., `root` or `ubuntu`).
   - `SSH_KEY`: Your private SSH key to connect to the server.
   - `DOCKER_USERNAME` / `DOCKER_PASSWORD`: Credentials for your container registry (Docker Hub, GitHub Container Registry, etc.).

---

## 3. Local Verification

Before committing changes, ensure your local build and lint check pass by running:

### Backend
```bash
cd backend
npm run lint
npm run test
npm run build
```

### Frontend Web
```bash
cd frontend-web
npm run lint
npm run build
```
