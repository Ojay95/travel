import { db } from './db';
import { saveUserPlan, deleteUserPlan } from './firestoreService';

let isSyncing = false;

/**
 * Synchronize any local IndexedDB plan changes that are pending upload.
 */
export async function syncPlans(): Promise<void> {
  // Guard if offline, already syncing, or if window isn't defined
  if (typeof window === 'undefined' || !navigator.onLine || isSyncing) {
    return;
  }

  isSyncing = true;
  console.log('[SyncService] Starting synchronization loop...');

  try {
    // Find all plans that are not marked 'synced'
    const pendingPlans = await db.plans
      .where('syncStatus')
      .anyOf(['pending-save', 'pending-delete'])
      .toArray();

    if (pendingPlans.length === 0) {
      console.log('[SyncService] No pending changes to synchronize.');
      isSyncing = false;
      return;
    }

    console.log(`[SyncService] Found ${pendingPlans.length} pending plan changes to sync.`);

    for (const plan of pendingPlans) {
      try {
        if (plan.syncStatus === 'pending-save') {
          console.log(`[SyncService] Uploading plan "${plan.title}" (${plan.id}) to Firestore...`);
          // Save to firestore
          await saveUserPlan(plan.userId || '', plan.userEmail || '', plan);
          // Mark as synced locally
          await db.plans.update(plan.id, {
            syncStatus: 'synced',
            localUpdatedAt: Date.now()
          });
          console.log(`[SyncService] Plan "${plan.title}" successfully synced.`);
        } else if (plan.syncStatus === 'pending-delete') {
          console.log(`[SyncService] Propagating deletion of plan ${plan.id} to Firestore...`);
          // Delete from firestore
          await deleteUserPlan(plan.id);
          // Delete locally
          await db.plans.delete(plan.id);
          console.log(`[SyncService] Plan ${plan.id} successfully deleted from both Firestore and IndexedDB.`);
        }
      } catch (err) {
        console.error(`[SyncService] Failed to sync plan "${plan.title || plan.id}":`, err);
        // We do not throw or stop the loop to allow other plans to attempt syncing
      }
    }
  } catch (err) {
    console.error('[SyncService] Error in background sync loop:', err);
  } finally {
    isSyncing = false;
    console.log('[SyncService] Synchronization loop finished.');
  }
}

// Bind to online connectivity event automatically
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[SyncService] Browser connection re-established. Triggering sync...');
    syncPlans().catch(console.error);
  });
}
