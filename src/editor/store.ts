import {useCallback, useSyncExternalStore} from 'react';
import savedData from './layout.json';

/**
 * The one place edited-on-canvas state lives.
 *
 * It has to be a module-level store rather than React context because the
 * things that read it aren't in one subtree: element rectangles are read by
 * `EditableBox` deep inside a scene, while the colour grade is read by the
 * `<Look>` wrapper *around* every scene, and the editor panel that writes
 * both sits somewhere else again. A context would have to wrap all three and
 * thread through components that don't care.
 *
 * Initial state is imported from layout.json, so a render — where there's no
 * server and no editor — still gets exactly what was last saved.
 */

export type StoreValue = unknown;

let state: Record<string, StoreValue> = {...(savedData as Record<string, StoreValue>)};
const listeners = new Set<() => void>();

const SAVE_SERVER = 'http://localhost:3999';

const emit = () => {
  for (const l of listeners) l();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Writes are debounced per key.
 *
 * Every save rewrites layout.json, which Remotion's file-watcher notices and
 * hot-reloads — that's what makes an edit survive a refresh. But dragging a
 * slider fires a change per pixel, and reloading the whole composition on each
 * one makes the control unusable. Coalescing to one write per key after the
 * value settles keeps the live preview instant (state updates immediately)
 * while the disk only sees the result.
 */
const PERSIST_DELAY_MS = 350;
const pending = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * Fire-and-forget: if the save server isn't running (a real render, or the
 * Studio started without `npm run layout-server`) the on-screen change still
 * applies for this session, it just won't survive a reload.
 */
const persist = (key: string, value: StoreValue) => {
  const existing = pending.get(key);
  if (existing) clearTimeout(existing);

  pending.set(
    key,
    setTimeout(() => {
      pending.delete(key);
      fetch(`${SAVE_SERVER}/layout`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: key, rect: value}),
      }).catch(() => {
        /* no server — see above */
      });
    }, PERSIST_DELAY_MS),
  );
};

export const getValue = <T,>(key: string, fallback: T): T => {
  const v = state[key];
  return v === undefined ? fallback : (v as T);
};

export const setValue = (key: string, value: StoreValue) => {
  if (state[key] === value) return;
  state = {...state, [key]: value};
  emit();
  persist(key, value);
};

/** Drop an override so the component's own design-time default applies again. */
export const clearValue = (key: string) => {
  if (!(key in state)) return;
  const next = {...state};
  delete next[key];
  state = next;
  emit();
  // `null` is the server's "forget this key" signal, distinct from a value.
  persist(key, null);
};

/** Every key currently overridden — used by the editor's reset button. */
export const overriddenKeys = (prefix: string) =>
  Object.keys(state).filter((k) => k.startsWith(prefix));

export const clearAll = (prefix: string) => {
  for (const k of overriddenKeys(prefix)) clearValue(k);
};

const getSnapshot = () => state;

/** Subscribe to the whole store. Returns the raw record. */
export const useEditorStore = () => useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/**
 * Read one key reactively, with a fallback used when nothing is saved.
 *
 * The fallback is deliberately not memoised into the store — an object
 * fallback would otherwise be a new reference every render and defeat
 * useSyncExternalStore's equality check. Callers pass stable values.
 */
export const useEditorValue = <T,>(key: string, fallback: T): T => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const v = snapshot[key];
  return v === undefined ? fallback : (v as T);
};

/** Read/write one key, in the shape of useState. */
export const useEditorState = <T,>(key: string, fallback: T): [T, (next: T) => void] => {
  const value = useEditorValue<T>(key, fallback);
  const set = useCallback((next: T) => setValue(key, next), [key]);
  return [value, set];
};
