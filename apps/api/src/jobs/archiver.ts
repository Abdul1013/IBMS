import cron from 'node-cron';
import { Announcement } from '../models/Announcement.model';
import { AuditLog } from '../models/AuditLog.model';

/**
 * Runs at midnight every day.
 * Archives PUBLISHED announcements whose expiresAt has passed.
 */
export const startArchiverJob = (): void => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();
      const expired = await Announcement.find({
        status: 'PUBLISHED',
        expiresAt: { $lte: now },
        deletedAt: null,
      }).select('_id');

      if (expired.length === 0) return;

      const ids = expired.map(a => a._id);
      await Announcement.updateMany({ _id: { $in: ids } }, { status: 'ARCHIVED' });

      await AuditLog.insertMany(
        ids.map(id => ({
          actorId: null,
          action: 'STATUS_ARCHIVED',
          targetType: 'Announcement',
          targetId: id,
          metadata: { reason: 'auto-expired' },
        }))
      );

      console.warn(`[archiver] Archived ${ids.length} expired announcement(s)`);
    } catch (err) {
      console.error('[archiver] Error during archival job:', err);
    }
  });

  console.warn('[archiver] Scheduled archiver job at midnight');
};
