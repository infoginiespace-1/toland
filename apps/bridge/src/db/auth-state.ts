import {
  AuthenticationCreds,
  AuthenticationState,
  BufferJSON,
  initAuthCreds,
  proto,
  SignalDataTypeMap,
} from '@whiskeysockets/baileys';
import { query } from './pool';

export async function usePostgresAuthState(sessionId: string = 'default'): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clearCreds: () => Promise<void>;
}> {
  // Helper to read a key from wa_auth_keys
  const readData = async (keyId: string): Promise<any> => {
    try {
      const res = await query(
        'SELECT value FROM public.wa_auth_keys WHERE session_id = $1 AND key_id = $2',
        [sessionId, keyId]
      );
      if (res.rows.length === 0) return null;
      const raw = res.rows[0].value;
      const jsonStr = typeof raw === 'string' ? raw : JSON.stringify(raw);
      return JSON.parse(jsonStr, BufferJSON.reviver);
    } catch (err) {
      console.error(`[AuthState] Error reading key ${keyId}:`, err);
      return null;
    }
  };

  // Helper to write a key into wa_auth_keys
  const writeData = async (keyId: string, data: any): Promise<void> => {
    try {
      const jsonStr = JSON.stringify(data, BufferJSON.replacer);
      await query(
        `INSERT INTO public.wa_auth_keys (session_id, key_id, value, updated_at)
         VALUES ($1, $2, $3::jsonb, NOW())
         ON CONFLICT (session_id, key_id)
         DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [sessionId, keyId, jsonStr]
      );
    } catch (err) {
      console.error(`[AuthState] Error writing key ${keyId}:`, err);
    }
  };

  // Helper to remove a key from wa_auth_keys
  const removeData = async (keyId: string): Promise<void> => {
    try {
      await query(
        'DELETE FROM public.wa_auth_keys WHERE session_id = $1 AND key_id = $2',
        [sessionId, keyId]
      );
    } catch (err) {
      console.error(`[AuthState] Error removing key ${keyId}:`, err);
    }
  };

  // Helper to clear all session credentials on logout
  const clearCreds = async (): Promise<void> => {
    try {
      await query('DELETE FROM public.wa_auth_keys WHERE session_id = $1', [sessionId]);
      console.log(`[AuthState] Cleared all auth keys for session ${sessionId}`);
    } catch (err) {
      console.error(`[AuthState] Error clearing creds for session ${sessionId}:`, err);
    }
  };

  // 1. Load or initialize credentials
  const existingCreds = await readData('creds');
  const creds: AuthenticationCreds = existingCreds || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [key: string]: any } = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === 'app-state-sync-key' && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            })
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category of Object.keys(data)) {
            const cat = category as keyof SignalDataTypeMap;
            const items = data[cat];
            if (!items) continue;
            for (const id of Object.keys(items)) {
              const value = items[id];
              const keyId = `${cat}-${id}`;
              if (value) {
                tasks.push(writeData(keyId, value));
              } else {
                tasks.push(removeData(keyId));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData('creds', creds),
    clearCreds,
  };
}
