# Service Worker Deployment Fix

## Issue Fixed
The service worker was returning HTML instead of JavaScript due to Firebase Hosting configuration.

## Changes Made

### 1. Updated `firebase.json`
Added headers configuration to ensure `sw.js` is served with the correct MIME type:
```json
"headers": [
  {
    "source": "sw.js",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/javascript"
      },
      {
        "key": "Service-Worker-Allowed",
        "value": "/"
      }
    ]
  }
]
```

### 2. Updated `vite.config.ts`
Added build configuration to copy `sw.js` from `public` folder to `dist`:
```typescript
publicDir: 'public',
build: {
  copyPublicDir: true
}
```

### 3. Moved `sw.js`
Moved service worker file from root to `public/sw.js` so Vite copies it during build.

## How to Deploy

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Verify sw.js is in dist folder:**
   ```bash
   ls dist/sw.js
   ```
   You should see the file listed.

3. **Deploy to Firebase:**
   ```bash
   firebase deploy
   ```
   Or deploy hosting only:
   ```bash
   firebase deploy --only hosting
   ```

## Verification

After deployment, check the browser console. You should no longer see the MIME type error. Instead, the service worker should register successfully.

To verify:
1. Open your deployed site
2. Open browser DevTools (F12)
3. Go to Console tab
4. You should NOT see any "unsupported MIME type" errors
5. Go to Application tab → Service Workers
6. You should see your service worker registered and activated

## Troubleshooting

### If you still see the error:

1. **Clear Firebase Hosting Cache:**
   - Wait a few minutes for CDN to update
   - Or use incognito/private browsing mode
   - Or hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

2. **Verify build output:**
   ```bash
   ls -la dist/sw.js
   ```
   Make sure the file exists and has content

3. **Check Firebase Hosting:**
   ```bash
   firebase serve
   ```
   Test locally before deploying

4. **Verify firebase.json:**
   Make sure the headers configuration is present

## Alternative: Disable Service Worker (Not Recommended)

If you want to temporarily disable the service worker, comment out the registration in `index.tsx`:

```typescript
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js').catch(err => {
//       console.error('ServiceWorker registration failed: ', err);
//     });
//   });
// }
```

However, this is NOT recommended as the service worker provides:
- Offline functionality
- Faster subsequent page loads
- Better user experience

## Summary

The issue has been fixed. Just rebuild and redeploy:
```bash
npm run build
firebase deploy
```

The service worker will now be served correctly with the proper MIME type and register successfully!
