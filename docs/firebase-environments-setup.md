# Firebase App Hosting Multiple Environments Setup Guide

This guide explains how to deploy the CAF Triage Bot to multiple Firebase environments (staging and production) using environment-specific configurations.

## Overview

We have created three configuration files:
- `apphosting.yaml` - Default/fallback configuration
- `apphosting.staging.yaml` - Staging environment with reduced resources
- `apphosting.production.yaml` - Production environment with optimized resources

## Prerequisites

1. **Separate Firebase Projects**: Create distinct projects for each environment:
   - `triage-bot-staging` (or your preferred staging project name)
   - `triage-bot-production` (or your preferred production project name)

2. **GitHub Repository**: Your code should be stored in GitHub

3. **App Hosting Backends**: Create App Hosting backends in each project

## Step-by-Step Setup

### 1. Set Up Firebase Projects

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create two projects:
   - Staging project (e.g., `triage-bot-staging`)
   - Production project (e.g., `triage-bot-production`)
3. Tag your production project with "production" environment type

### 2. Create App Hosting Backends

For each project:
1. Navigate to **App Hosting** in the Firebase Console
2. Click **Get started** or **Add backend**
3. Connect your GitHub repository
4. Set the live branch (typically `main` for production, `develop` for staging)
5. Configure the root directory if needed

### 3. Set Environment Names

#### For Staging Backend:
1. Go to Firebase Console → Your staging project → App Hosting
2. Click **View dashboard** on your backend
3. Go to **Settings** tab → **Environment**
4. Set **Environment name** to `staging`
5. Click **Save**

#### For Production Backend:
1. Go to Firebase Console → Your production project → App Hosting
2. Click **View dashboard** on your backend
3. Go to **Settings** tab → **Environment**
4. Set **Environment name** to `production`
5. Click **Save**

### 4. Configure Secrets (Important!)

For sensitive data like API keys, use Firebase Secret Manager:

#### Create Secrets:
```bash
# For production
firebase projects:list
firebase use your-production-project-id
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set SUPABASE_URL
firebase functions:secrets:set SUPABASE_ANON_KEY

# For staging
firebase use your-staging-project-id
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set SUPABASE_URL
firebase functions:secrets:set SUPABASE_ANON_KEY
```

#### Update Configuration Files:
Add secrets to your environment-specific YAML files:

```yaml
# In apphosting.production.yaml or apphosting.staging.yaml
env:
  - variable: OPENAI_API_KEY
    secret: OPENAI_API_KEY
    availability:
      - RUNTIME
  - variable: SUPABASE_URL
    secret: SUPABASE_URL
    availability:
      - RUNTIME
  - variable: SUPABASE_ANON_KEY
    secret: SUPABASE_ANON_KEY
    availability:
      - RUNTIME
```

### 5. Deploy

Once your environment-specific files are ready:

```bash
# Commit and push your configuration files
git add apphosting*.yaml
git commit -m "Add environment-specific configurations"
git push
```

The deployment will automatically pick up the correct configuration based on the environment name you set.

## Configuration Details

### Resource Allocation

| Environment | CPU | Memory | Max Instances | Min Instances | Concurrency |
|------------|-----|--------|---------------|---------------|-------------|
| Staging    | 1   | 512MB  | 2             | 0             | 10          |
| Production | 2   | 1024MB | 10            | 1             | 50          |
| Default    | 1   | 1024MB | 5             | 0             | 25          |

### Environment Variables

- `NODE_ENV`: Set to environment name (staging/production)
- `ENVIRONMENT`: Additional environment identifier
- `NPM_CONFIG_LEGACY_PEER_DEPS`: Required for dependency resolution

## Best Practices

1. **Never commit secrets** to your repository
2. **Use different resource allocations** for different environments
3. **Keep staging lightweight** to reduce costs
4. **Ensure production has warm instances** (minInstances: 1)
5. **Test in staging** before deploying to production
6. **Use different databases/services** for each environment

## Monitoring and Logs

Monitor your deployments:
1. Firebase Console → App Hosting → Your backend
2. Check **Rollouts** tab for deployment status
3. View **Logs** for runtime information
4. Monitor **Usage** for performance metrics

## Troubleshooting

### Common Issues:
1. **Build failures**: Check Cloud Build logs in the console
2. **Environment not picking up config**: Verify environment name matches YAML filename
3. **Secret access issues**: Ensure service account has access to secrets
4. **Resource limits**: Adjust CPU/memory based on actual usage

### Useful Commands:
```bash
# Check current project
firebase projects:list

# Switch projects
firebase use project-id

# View secrets
firebase functions:secrets:access SECRET_NAME

# Deploy manually (if needed)
firebase deploy --only hosting
```

## Next Steps

1. Set up monitoring and alerting
2. Configure custom domains for each environment
3. Set up CI/CD pipeline for automated deployments
4. Implement proper testing strategies for each environment 