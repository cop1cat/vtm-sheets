// On sign-in, pull the user's characters from Firestore into the local index so
// the dashboard shows them on a fresh device. One-shot read (N docs), merged by
// updatedAt — remote wins only when strictly newer. Cheap and read-only.
import { isCloudConfigured } from './config';
import { listRemote } from './firebase';
import { loadCharacter, putCharacter } from '@/store/characters';

export async function pullList(uid: string): Promise<number> {
  if (!isCloudConfigured()) return 0;
  const remote = await listRemote(uid);
  let merged = 0;
  for (const r of remote) {
    const local = loadCharacter(r.id);
    if (!local || (r.updatedAt ?? 0) > (local.updatedAt ?? 0)) {
      putCharacter(r); // preserve remote updatedAt (no restamp)
      merged += 1;
    }
  }
  return merged;
}
