# Setting Up GitHub Actions CI/CD for Kibabii Nest

The CI/CD pipeline is configured in `.github/workflows/ci.yml`. It automatically runs tests, lint checks, and verifies the application builds for both the NestJS backend and Next.js frontend web application upon pushing or opening a pull request to the `main` branch.

Below is the step-by-step guide to configure the repository and secrets.

---

## 1. Automated Testing Setup

To run NestJS unit tests, the pipeline installs Node.js packages and executes `npm run test` inside the runner container.
Since the backend unit tests run in isolation and do not hit a live database, they do not require database connections.
If integration/E2E tests are added in the future, you can configure GitHub Actions to launch a PostgreSQL service container side-by-side using the `services:` block in YAML.

---

## 2. Setting Up SSH Deployment Secrets

The pipeline is pre-configured with automated deployment jobs:
* **Staging Server Deployment**: Triggers automatically on any code push to the `main` branch.
* **Production Server Deployment**: Triggers automatically when a version release tag (e.g. `v1.0.0`) is pushed.

To enable these, you must define the following Repository Secrets in GitHub (**Settings** > **Secrets and variables** > **Actions** > **New repository secret**):

### Staging Environment Secrets:
* `STAGING_SSH_HOST`: Staging server IP or hostname.
* `STAGING_SSH_USER`: The server username (e.g., `ubuntu` or `root`).
* `STAGING_SSH_PRIVATE_KEY`: The private SSH key matching the key added to the server's `authorized_keys`.
* `STAGING_SSH_PORT`: SSH port (optional, defaults to `22`).
* `STAGING_PROJECT_PATH`: Directory path of the repository on the server (e.g., `/var/www/kibabii-nest-staging`).

### Production Environment Secrets:
* `PROD_SSH_HOST`: Production server IP or hostname.
* `PROD_SSH_USER`: The server username (e.g., `ubuntu` or `root`).
* `PROD_SSH_PRIVATE_KEY`: The private SSH key.
* `PROD_SSH_PORT`: SSH port (optional, defaults to `22`).
* `PROD_PROJECT_PATH`: Directory path of the repository on the server (e.g., `/var/www/kibabii-nest-production`).

---

## 3. Configuring SSH Keys on Your Server

For the deployment runner to authenticate without password input, perform the following steps:

1. **Generate SSH Keypair** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "github-actions-deploy"
   ```
2. **Authorize the Public Key** on the host server:
   Copy the contents of `id_ed25519.pub` and append it to your server's authorized keys file:
   ```bash
   echo "your-ssh-public-key-content" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   chmod 700 ~/.ssh
   ```
3. **Save the Private Key in GitHub**:
   Copy the exact contents of the private key `id_ed25519` (including headers) and paste it into the `STAGING_SSH_PRIVATE_KEY` / `PROD_SSH_PRIVATE_KEY` fields on GitHub.

---

## 4. Local Verification

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
