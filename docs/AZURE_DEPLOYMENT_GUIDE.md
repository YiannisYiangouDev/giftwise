# GiftWise — Azure Deployment Guide

> **Target:** Azure Production Environment | **Date:** July 13, 2026

---

## 1. RECOMMENDED ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────┐
│                        AZURE CLOUD                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Azure Static Web Apps                    │     │
│  │  → Next.js 15.5 frontend (SSR via SWA)              │     │
│  │  → Custom domain: giftwise.app                      │     │
│  │  → Free SSL via Azure                               │     │
│  │  → Global CDN edge caching                           │     │
│  └──────────────────────┬──────────────────────────────┘     │
│                         │                                      │
│  ┌──────────────────────▼──────────────────────────────┐     │
│  │           Supabase (External, eu-west-2)              │     │
│  │  → PostgreSQL 17 + Auth + Edge Functions + Cron      │     │
│  │  → Not hosted on Azure — managed service             │     │
│  └─────────────────────────────────────────────────────┘     │
│                         │                                      │
│  ┌──────────────────────▼──────────────────────────────┐     │
│  │          Azure Container Apps (Optional)              │     │
│  │  → Python scraper worker                             │     │
│  │  → Timer trigger: daily @ 06:00 UTC                  │     │
│  │  → Environment variables from Key Vault              │     │
│  └─────────────────────────────────────────────────────┘     │
│                         │                                      │
│  ┌──────────────────────▼──────────────────────────────┐     │
│  │              Azure Key Vault                          │     │
│  │  → SUPABASE_SERVICE_ROLE_KEY                         │     │
│  │  → RESEND_API_KEY                                    │     │
│  │  → Access granted to Static Web App + Container App   │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │          Azure Application Insights                   │     │
│  │  → Frontend performance monitoring                    │     │
│  │  → Error tracking                                     │     │
│  │  → Availability tests                                 │     │
│  └─────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. FRONTEND DEPLOYMENT — Azure Static Web Apps

### 2.1 Prerequisites

1. Azure account with subscription
2. GitHub repository connected
3. Custom domain (optional)

### 2.2 Deployment Steps

```bash
# 1. Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login

# 2. Create Static Web App
az staticwebapp create \
  --name giftwise-frontend \
  --resource-group giftwise-rg \
  --location westeurope \
  --source https://github.com/YiannisYiangouDev/giftwise \
  --branch main \
  --app-location frontend \
  --output-location .next \
  --login-with-github

# 3. Configure environment variables in Azure Portal:
#    Static Web Apps → giftwise-frontend → Settings → Environment variables
```

### 2.3 Environment Variables for Static Web App

```
NEXT_PUBLIC_SUPABASE_URL         = https://pnmsysqljdnprcwkerlf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    = (from Supabase Dashboard)
NEXT_PUBLIC_APP_URL              = https://giftwise.app
ADMIN_EMAILS                     = yiannis@yiangouweb.com
SUPABASE_SERVICE_ROLE_KEY        = @Microsoft.KeyVault(SecretUri=https://giftwise-kv.vault.azure.net/secrets/SUPABASE_SERVICE_ROLE_KEY/)
```

### 2.4 Vercel Alternative

For simplest deployment, Vercel is a better fit than Azure SWA (native Next.js support):
```bash
# One-click deploy via Vercel Dashboard → Import GitHub repo
# Set env vars in Vercel Dashboard → Project Settings → Environment Variables
```

---

## 3. SCRAPER DEPLOYMENT — Azure Container Apps

### 3.1 Dockerfile

Create `scraper/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY scraper/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scraper/ .

# Install cloudscraper dependencies
RUN pip install cloudscraper

CMD ["python", "main.py"]
```

### 3.2 Build and Deploy

```bash
# 1. Create Container Registry
az acr create --name giftwiseregistry --resource-group giftwise-rg --sku Basic

# 2. Build and push image
az acr build --registry giftwiseregistry --image giftwise-scraper:latest ./scraper

# 3. Create Container App with timer trigger
az containerapp create \
  --name giftwise-scraper \
  --resource-group giftwise-rg \
  --environment giftwise-env \
  --image giftwiseregistry.azurecr.io/giftwise-scraper:latest \
  --cpu 0.5 --memory 1.0Gi \
  --env-vars \
    SUPABASE_URL=https://pnmsysqljdnprcwkerlf.supabase.co \
    SUPABASE_SERVICE_ROLE_KEY=secretref:supabase-key

# 4. Add timer trigger (daily at 06:00 UTC)
az containerapp job create \
  --name giftwise-scraper-job \
  --resource-group giftwise-rg \
  --environment giftwise-env \
  --trigger-type Schedule \
  --cron-expression "0 6 * * *" \
  --image giftwiseregistry.azurecr.io/giftwise-scraper:latest
```

---

## 4. CI/CD PIPELINE (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: cd frontend && npm ci && npm run build
      - name: Deploy to Azure Static Web Apps
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_SWA_TOKEN }}
          app_location: frontend
          output_location: .next

  scraper:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker image
        run: |
          docker build -t giftwise-scraper ./scraper
          docker tag giftwise-scraper giftwiseregistry.azurecr.io/giftwise-scraper:${{ github.sha }}
          docker push giftwiseregistry.azurecr.io/giftwise-scraper:${{ github.sha }}
```

---

## 5. MONITORING & LOGGING

### 5.1 Application Insights

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app giftwise-insights \
  --resource-group giftwise-rg \
  --location westeurope

# Link to Static Web App
az staticwebapp appsettings set \
  --name giftwise-frontend \
  --setting-names APPLICATIONINSIGHTS_CONNECTION_STRING=$CONN_STR
```

### 5.2 Frontend Telemetry

Add to `frontend/src/app/layout.tsx`:
```tsx
import { ApplicationInsights } from '@microsoft/applicationinsights-web'

// In RootLayout:
useEffect(() => {
  if (process.env.NODE_ENV === 'production') {
    const appInsights = new ApplicationInsights({
      config: { connectionString: process.env.NEXT_PUBLIC_APPINSIGHTS_CS }
    })
    appInsights.loadAppInsights()
  }
}, [])
```

### 5.3 Alerts

Create Azure Monitor alerts:
- **Frontend errors > 5 in 5 min** → Email admin
- **Scraper job failure** → Email admin (Container App → Alerts)
- **Supabase DB CPU > 80%** → Email admin (Supabase Dashboard → Alerts)

---

## 6. CUSTOM DOMAIN & SSL

```bash
# Add custom domain
az staticwebapp hostname set \
  --name giftwise-frontend \
  --hostname giftwise.app

# Get validation token
az staticwebapp hostname show \
  --name giftwise-frontend \
  --hostname giftwise.app

# Add TXT record to DNS: asuid.giftwise.app → validation_token
# Add CNAME record: giftwise.app → giftwise-frontend.azurestaticapps.net
```

SSL is auto-provisioned by Azure Static Web Apps (free).

---

## 7. COST ESTIMATE

| Resource | Tier | Monthly Cost |
|---|---|---|
| Azure Static Web App | Free | $0 |
| Azure Container Apps | Consumption (0.5 CPU, 1 GB, 5 min/day) | ~$2 |
| Azure Container Registry | Basic | $5 |
| Azure Key Vault | Standard | ~$3 |
| Application Insights | 1 GB log ingestion | ~$5 |
| Supabase | Free (500 MB DB, 2 GB bandwidth) | $0 |
| **TOTAL** | | **~$15/month** |

**Budget alternative:** Skip Azure entirely — use Vercel (free) + Supabase (free) + manual scraper runs. Total: $0/month.

---

## 8. ROLLBACK STRATEGY

| Scenario | Rollback Action |
|---|---|
| Frontend deploy breaks | GitHub → Actions → Re-run last successful workflow |
| DB migration breaks | Supabase Dashboard → Database → Backups → Restore |
| Scraper deploy breaks | Azure CLI: `az containerapp revision activate --revision <previous>` |
| Secrets leaked | Key Vault → Rotate → Update env vars → Redeploy |

---

## 9. SUPABASE PRODUCTION CONFIGURATION

### 9.1 Production Settings (Supabase Dashboard)

```
Authentication → Settings:
  ☐ Allow new users to sign up          ← Disable for family-only
  ☑ Enable email confirmations          ← Enable for production
  Max login attempts: 5                 ← Brute force protection
  
Database → Settings:
  ☑ SSL enforced                        ← Already on
  Connection pool: Transaction mode     ← For Next.js
  
API → Settings:
  ☑ Expose PostgREST metadata          ← Already on
```

### 9.2 Production Environment Variables (Edge Functions)

Set in Supabase Dashboard → Edge Functions → price-checker:
```
RESEND_API_KEY = (from resend.com)
FIRECRAWL_API_KEY = (from firecrawl.dev)
```

---

## 10. DEPLOYMENT CHECKLIST

```
☐ Create Azure resource group: giftwise-rg
☐ Deploy Static Web App (frontend)
☐ Configure environment variables in SWA
☐ Add custom domain + SSL
☐ Create Container Registry
☐ Build and push scraper Docker image
☐ Create Container App with timer trigger
☐ Create Key Vault + store secrets
☐ Create Application Insights
☐ Set up alerts (error rate, scraper failure)
☐ Configure Supabase production settings
☐ Set RESEND_API_KEY in Edge Functions
☐ Test: sign up → add recipient → add wishlist → add item → search → fetch
☐ Test: scraper runs successfully (check price_history for new rows)
☐ Test: delete account → verify cascade
☐ Test: /s/[token] public share link
☐ Document rollback procedure
☐ Document on-call contact
☐ Create backup strategy (PITR on Supabase Pro)
```
