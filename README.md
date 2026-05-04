# Lunara v6 Firebase

A React + Firebase social web app prototype combining Facebook, Messenger, TikTok, and Instagram-inspired features.

## Run locally

```bash
npm install
npm run dev
```

## GitHub Pages

This package includes:
- vite.config.js with base `/lunara-react/`
- .github/workflows/deploy.yml

Enable:
Settings > Pages > Source > GitHub Actions

## Firebase setup needed

Enable:
- Authentication > Email/Password
- Firestore Database
- Storage

For development, use test rules temporarily, then secure them before launch.
