import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { sendSms } from '../../services/twilio.service';
import { COLLECTIONS, SMS_TEMPLATES } from '../../shared';

export const onTenantCreated = onDocumentCreated(
  `${COLLECTIONS.tenants}/{tenantId}`,
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const tenant = snap.data();
    logger.info('Tenant created', { id: snap.id, name: `${tenant.firstName} ${tenant.lastName}` });

    try {
      const orgDoc = await db.collection(COLLECTIONS.organizations).doc(tenant.organizationId).get();
      if (!orgDoc.exists) return;
      const org = orgDoc.data()!;

      // Skip opted-out tenants (TCPA compliance)
      if (tenant.smsOptedOut === true) {
        logger.info('Skipping welcome SMS for opted-out tenant', { tenantId: snap.id });
        return;
      }

      if (org.settings.aiEnabled) {
        await sendSms(
          tenant.phone,
          SMS_TEMPLATES.welcomeTenant(tenant.firstName, org.name),
        );
        logger.info('Welcome SMS sent', { tenantId: snap.id });
      }
    } catch (error) {
      logger.error('Failed to send welcome SMS', { error });
    }
  },
);
