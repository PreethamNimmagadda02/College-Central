# College Onboarding Guide

Deploy College Central for a new college with their own Firebase project.

## Prerequisites

- College creates Firebase project with Auth, Firestore, Hosting
- You have push access to this repository
- Firebase CLI installed (`npm i -g firebase-tools`)

---

## Onboarding Steps

### 1. Create Firebase Project (College does this)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create project (e.g., `college-central-stanford`)
3. Enable: Authentication (Google), Firestore, Hosting

### 2. Create College Config

```bash
cp -r colleges/template colleges/<college-id>
# Edit the .env.production file with Firebase values
```

### 3. Add GitHub Secrets

**Per-Tenant Secrets** (prefix with college ID in uppercase):

| Secret | Description |
|--------|-------------|
| `<COLLEGE>_PROJECT_ID` | Firebase project ID |
| `<COLLEGE>_FIREBASE_SERVICE_ACCOUNT` | Service account JSON |
| `<COLLEGE>_FIREBASE_API_KEY` | API key |
| `<COLLEGE>_MESSAGING_SENDER_ID` | Sender ID |
| `<COLLEGE>_APP_ID` | App ID |
| `<COLLEGE>_MEASUREMENT_ID` | Measurement ID |
| `<COLLEGE>_GEMINI_API_KEY` | Gemini API key (optional) |

**Shared Secrets** (add once, used by all tenants):

| Secret | Description |
|--------|-------------|
| `EMAILJS_SERVICE_ID` | EmailJS service ID |
| `EMAILJS_TEMPLATE_ID` | EmailJS template ID |
| `EMAILJS_PUBLIC_KEY` | EmailJS public key |

### 4. Update Workflow

Add college to `.github/workflows/deploy-college.yml`:

```yaml
options:
  - iitism
  - <new-college>  # Add here
```

### 5. Deploy

**GitHub Actions:**
1. Go to Actions → "Deploy to College"
2. Select college → Run workflow

**Local:**
```bash
npm run deploy:college <college-id>
```

---

## Key Files

| File | Purpose |
|------|---------|
| `colleges/<id>/.env.production` | College environment config |
| `.github/workflows/deploy-college.yml` | CI/CD pipeline |
| `scripts/deploy-college.sh` | Local deployment script |
| `src/lib/utils/constants.ts` | Domain config (reads from env) |
