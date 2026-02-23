import { onSchedule } from 'firebase-functions/v2/scheduler';
import { db } from '../../utils/firebase';
import { logger } from '../../utils/logger';
import { sendSms } from '../../services/twilio.service';
import { COLLECTIONS, SMS_TEMPLATES, Tenant, Organization, Unit } from '../../shared';

export const rentReminders = onSchedule(
  { schedule: '0 10 * * *', timeZone: 'America/New_York' },
  async () => {
    logger.info('Running rent reminders');

    const orgsSnap = await db
      .collection(COLLECTIONS.organizations)
      .where('settings.aiEnabled', '==', true)
      .get();

    for (const orgDoc of orgsSnap.docs) {
      const org = { id: orgDoc.id, ...orgDoc.data() } as Organization;
      const reminderDays = org.settings.rentReminderDaysBefore;

      const tenantsSnap = await db
        .collection(COLLECTIONS.tenants)
        .where('organizationId', '==', org.id)
        .where('status', '==', 'active')
        .get();

      for (const tenantDoc of tenantsSnap.docs) {
        const tenant = { id: tenantDoc.id, ...tenantDoc.data() } as Tenant;

        // Skip opted-out tenants (TCPA compliance)
        if (tenant.smsOptedOut === true) {
          logger.info('Skipping rent reminder for opted-out tenant', { tenantId: tenant.id });
          continue;
        }

        // Get unit for rent due day
        const unitDoc = await db.collection(COLLECTIONS.units).doc(tenant.unitId).get();
        if (!unitDoc.exists) continue;
        const unit = unitDoc.data() as Unit;

        const today = new Date();
        const dueDay = unit.rentDueDay;
        const currentDay = today.getDate();

        // Calculate days until due
        let daysUntilDue: number;
        if (dueDay >= currentDay) {
          daysUntilDue = dueDay - currentDay;
        } else {
          // Due date is next month
          const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
          daysUntilDue = daysInMonth - currentDay + dueDay;
        }

        if (reminderDays.includes(daysUntilDue)) {
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() + daysUntilDue);
          const dueDateStr = dueDate.toLocaleDateString('en-US', {
            month: 'long', day: 'numeric',
          });

          try {
            await sendSms(
              tenant.phone,
              SMS_TEMPLATES.rentReminder(tenant.firstName, tenant.rentAmount, dueDateStr),
            );
            logger.info('Rent reminder sent', { tenantId: tenant.id, daysUntilDue });
          } catch (error) {
            logger.error('Failed to send rent reminder', { tenantId: tenant.id, error });
          }
        }

        // Check for overdue rent
        if (tenant.balance > 0 && currentDay > dueDay) {
          const daysPastDue = currentDay - dueDay;
          if (daysPastDue === 1 || daysPastDue === 5 || daysPastDue === 10) {
            try {
              await sendSms(
                tenant.phone,
                SMS_TEMPLATES.rentOverdue(tenant.firstName, tenant.balance, daysPastDue),
              );
              logger.info('Overdue reminder sent', { tenantId: tenant.id, daysPastDue });
            } catch (error) {
              logger.error('Failed to send overdue reminder', { tenantId: tenant.id, error });
            }
          }
        }
      }
    }
  },
);
