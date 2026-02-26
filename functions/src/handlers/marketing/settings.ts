import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTIONS, getMarketingAdminEmails } from '../../shared/constants';

const db = getFirestore();
const SETTINGS_DOC = 'global';

function requireMarketingAdmin(email?: string): void {
  if (!email || !getMarketingAdminEmails().includes(email.toLowerCase())) {
    throw new HttpsError('permission-denied', 'Not authorized for marketing');
  }
}

export const getMarketingSettings = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  const doc = await db.collection(COLLECTIONS.marketingSettings).doc(SETTINGS_DOC).get();
  if (!doc.exists) {
    return { autoApprove: false };
  }
  return { autoApprove: doc.data()?.autoApprove ?? false };
});

export const updateMarketingSettings = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Must be signed in');
  requireMarketingAdmin(request.auth.token.email);

  const { autoApprove } = request.data ?? {};
  if (typeof autoApprove !== 'boolean') {
    throw new HttpsError('invalid-argument', 'autoApprove must be a boolean');
  }

  await db.collection(COLLECTIONS.marketingSettings).doc(SETTINGS_DOC).set(
    { autoApprove },
    { merge: true },
  );

  return { success: true };
});
