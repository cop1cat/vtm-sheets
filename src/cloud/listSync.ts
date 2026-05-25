// On sign-in / tab focus, reconcile the local character list with Firestore so
// devices converge: pull newer remote docs, and remove local characters that
// were deleted on another device. A local char is only removed if we'd
// previously confirmed it in the cloud (isSynced) — so a freshly-created,
// not-yet-pushed local character is never wiped. One-shot read, no subscription.
import { isCloudConfigured } from './config';
import { listRemote } from './firebase';
import { listCharacters, loadCharacter, putCharacter, deleteCharacter, markSynced, isSynced } from '@/store/characters';

export async function pullList(uid: string): Promise<boolean> {
  if (!isCloudConfigured()) return false;
  const remote = await listRemote(uid);
  const remoteIds = new Set(remote.map((r) => r.id));
  let changed = false;

  // Add / update from remote (remote wins only when strictly newer).
  for (const r of remote) {
    const local = loadCharacter(r.id);
    if (!local || (r.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
      putCharacter(r);
      changed = true;
    }
    markSynced(r.id);
  }

  // Remove local characters deleted elsewhere — but only ones we know were
  // synced (never wipe a local-only character that hasn't been pushed yet).
  for (const sum of listCharacters()) {
    if (!remoteIds.has(sum.id) && isSynced(sum.id)) {
      deleteCharacter(sum.id); // local-only delete; it's already gone in the cloud
      changed = true;
    }
  }

  return changed;
}
