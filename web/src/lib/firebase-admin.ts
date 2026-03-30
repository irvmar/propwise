import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App;

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    let serviceAccount: Parameters<typeof cert>[0];
    try {
      serviceAccount = JSON.parse(serviceAccountKey);
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON');
    }
    app = initializeApp({ credential: cert(serviceAccount) });
  } else {
    // Falls back to Application Default Credentials (works in GCP environments)
    app = initializeApp();
  }

  return app;
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}
