import { safeStorage } from "./safe-storage";

// Remembered logins for the account switcher — lets a user hold multiple
// signed-in accounts on one device and swap the active Supabase session
// without re-entering credentials each time. Supabase's client only ever
// holds one active session, so "switching" is really: persist the session
// you're leaving, then call setSession() with the one you're moving to.

const KEY = "ef_saved_accounts";

export interface SavedAccount {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string;
}

function readAll(): SavedAccount[] {
  try {
    const raw = safeStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedAccount[]) : [];
  } catch {
    return [];
  }
}

function writeAll(accounts: SavedAccount[]): void {
  safeStorage.setItem(KEY, JSON.stringify(accounts));
}

export function listSavedAccounts(): SavedAccount[] {
  return readAll();
}

export function saveAccount(account: SavedAccount): void {
  const accounts = readAll();
  const idx = accounts.findIndex((a) => a.id === account.id);
  if (idx >= 0) accounts[idx] = account;
  else accounts.push(account);
  writeAll(accounts);
}

export function forgetAccount(id: string): void {
  writeAll(readAll().filter((a) => a.id !== id));
}
