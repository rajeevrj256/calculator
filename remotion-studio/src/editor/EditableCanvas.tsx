import React, {createContext, useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {getRemotionEnvironment, useVideoConfig} from 'remotion';
import {clearAll, clearValue, setValue, useEditorValue} from './store';
import {DEFAULT_LOOK, Look, normaliseLook} from '../effects/look';
import {FORMAT_IDS} from '../formats';
import {EditorPanel} from './EditorPanel';

/**
 * The click / drag / resize / delete canvas editor, shared by every
 * composition in this project, current or future.
 *
 * Remotion has no generic "make any element draggable" API — only `Img` and
 * `Video` get built-in drag handling — so this is a from-scratch overlay.
 * Click *Edit layout* in the panel, click an element to select it, drag its
 * body to move or a handle to resize, press Delete to remove it. Everything
 * is written through src/editor/store.ts to layout.json, which Remotion's
 * file-watcher hot-reloads like any other source change, and which a render
 * reads back so what you arrange is what you export.
 *
 * Usage — no props needed, it identifies itself from the composition:
 *
 *   <EditableCanvas>
 *     <EditableBox id="scene1.title" rect={{x: 100, y: 100, width: 800, height: 200}}>
 *       ...content...
 *     </EditableBox>
 *   </EditableCanvas>
 *
 * `id` only needs to be unique within one composition; keys are namespaced as
 * `${compositionId}.${id}` under the hood, so two videos can both use
 * "scene1.title" without colliding in the one shared layout.json. Because
 * each delivery format is its own composition, each format also keeps its own
 * saved arrangement — reframing 9:16 doesn't disturb the 16:9 cut.
 */

export type Rect = {x: number; y: number; width: number; height: number};

/**
 * Strip the format suffix so all shapes of one video share a colour grade.
 * Position is per-format (a landscape cut is arranged differently), but a
 * look is a property of the video itself — you grade once and publish
 * everywhere.
 */
export const baseCompositionId = (id: string) => {
  for (const f of FORMAT_IDS) {
    if (id.endsWith(`-${f}`)) return id.slice(0, -(f.length + 1));
  }
  return id;
};

const DELETED = 'deleted' as const;

type CtxValue = {
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  selectedId: string | null;
  select: (id: string | null) => void;
  setRect: (id: string, rect: Rect) => void;
  registered: {id: string; key: string}[];
  getScale: () => number;
  namespace: (id: string) => string;
};

const EditCtx = createContext<CtxValue | null>(null);

/** The saved look for this video, shared across its formats. */
export const useLook = (): Look => {
  const {id} = useVideoConfig();
  const raw = useEditorValue<unknown>(`${baseCompositionId(id)}.__look`, DEFAULT_LOOK);
  return useMemo(() => normaliseLook(raw), [raw]);
};

export const useLookKey = () => {
  const {id} = useVideoConfig();
  return `${baseCompositionId(id)}.__look`;
};

export const EditableCanvas: React.FC<{
  /** Defaults to the composition's own id — pass one only to override. */
  compositionId?: string;
  /** Defaults to the composition's own width. */
  compositionWidth?: number;
  children: React.ReactNode;
}> = ({compositionId, compositionWidth, children}) => {
  const config = useVideoConfig();
  const cid = compositionId ?? config.id;
  const cWidth = compositionWidth ?? config.width;

  // Editor chrome is a Studio-only authoring aid. In a render there is nobody
  // to click anything and anything drawn here would be burned into the export,
  // so every control is gated on this. The saved layout still applies when
  // rendering — only the buttons, outlines and handles disappear.
  const {isStudio} = getRemotionEnvironment();

  const [editModeRequested, setEditMode] = useState(false);
  const editMode = editModeRequested && isStudio;
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement | null>(null);

  const namespace = useCallback((id: string) => `${cid}.${id}`, [cid]);

  // Measure how much the Studio has visually shrunk the composition.
  //
  // This canvas always *lays out* at the composition's real size; Studio
  // scales it to fit the pane with a `transform: scale()` on an ancestor.
  // getBoundingClientRect() sees through that transform, so it's the right
  // way to measure — but a ResizeObserver is the wrong way to watch it,
  // because a transform never changes an element's layout box, so the
  // observer fires once at mount (before the pane is sized, giving 0) and
  // then never again. That stale value fed straight into the drag maths as
  // `delta / scale`, which is how dragging ended up doing nothing.
  const measureScale = useCallback(() => {
    const el = rootRef.current;
    if (!el) return 1;
    const measured = el.getBoundingClientRect().width / cWidth;
    return measured > 0 ? measured : 1;
  }, [cWidth]);

  // Nothing needs the scale as *state* any more: the control panel is
  // portalled outside the composition so it isn't affected by the zoom, and a
  // drag reads the scale fresh at pointer-down. Keeping a requestAnimationFrame
  // loop just to mirror it into state would be a setState every frame for no
  // reader.
  const registerRootRef = useCallback((el: HTMLDivElement | null) => {
    rootRef.current = el;
  }, []);

  // Boxes announce themselves so the panel can list them by name, including
  // ones currently deleted (which render nothing and so can't be clicked).
  const registeredRef = useRef<Map<string, string>>(new Map());
  const [registered, setRegistered] = useState<{id: string; key: string}[]>([]);
  const registerBox = useCallback((id: string, key: string) => {
    if (registeredRef.current.get(id) === key) return;
    registeredRef.current.set(id, key);
    setRegistered([...registeredRef.current].map(([i, k]) => ({id: i, key: k})));
  }, []);

  const setRect = useCallback(
    (id: string, rect: Rect) => setValue(namespace(id), rect),
    [namespace],
  );

  useEffect(() => {
    if (!editMode || !selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        // selectedId is already namespaced; strip the prefix back off.
        setValue(selectedId, DELETED);
        setSelectedId(null);
      }
      if (e.key === 'Escape') setSelectedId(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [editMode, selectedId]);

  const ctx = useMemo<CtxValue>(
    () => ({
      editMode,
      setEditMode,
      selectedId,
      select: setSelectedId,
      setRect,
      registered,
      getScale: measureScale,
      namespace,
    }),
    [editMode, selectedId, setRect, registered, measureScale, namespace],
  );

  return (
    <EditCtx.Provider value={ctx}>
      <RegisterCtx.Provider value={registerBox}>
        <div
          ref={registerRootRef}
          style={{position: 'absolute', inset: 0}}
          onClick={(e) => {
            if (editMode && e.target === e.currentTarget) setSelectedId(null);
          }}
        >
          {children}

          {isStudio ? (
            <EditorPanel
              compositionId={cid}
              editMode={editMode}
              onToggleEditMode={() => setEditMode(!editModeRequested)}
              selectedId={selectedId}
              registered={registered}
              onSelect={setSelectedId}
            />
          ) : null}
        </div>
      </RegisterCtx.Provider>
    </EditCtx.Provider>
  );
};

const RegisterCtx = createContext<((id: string, key: string) => void) | null>(null);

const useEditCtx = () => {
  const ctx = useContext(EditCtx);
  if (!ctx) throw new Error('EditableBox must be used inside an EditableCanvas');
  return ctx;
};

const HANDLES = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
type Handle = (typeof HANDLES)[number];

const cursorFor: Record<Handle, string> = {
  nw: 'nwse-resize',
  n: 'ns-resize',
  ne: 'nesw-resize',
  e: 'ew-resize',
  se: 'nwse-resize',
  s: 'ns-resize',
  sw: 'nesw-resize',
  w: 'ew-resize',
};

const handlePos: Record<Handle, React.CSSProperties> = {
  nw: {top: -6, left: -6},
  n: {top: -6, left: '50%', transform: 'translateX(-50%)'},
  ne: {top: -6, right: -6},
  e: {top: '50%', right: -6, transform: 'translateY(-50%)'},
  se: {bottom: -6, right: -6},
  s: {bottom: -6, left: '50%', transform: 'translateX(-50%)'},
  sw: {bottom: -6, left: -6},
  w: {top: '50%', left: -6, transform: 'translateY(-50%)'},
};

/**
 * Wraps one editable element. `rect` is the design-time default; once the
 * element has been moved or resized, the saved override takes over.
 */
export const EditableBox: React.FC<{
  id: string;
  rect: Rect;
  children: React.ReactNode;
  style?: React.CSSProperties;
  /** Human-readable name for the panel's element list. */
  label?: string;
}> = ({id, rect: defaultRect, children, style, label}) => {
  const {editMode, selectedId, select, setRect, getScale, namespace} = useEditCtx();
  const register = useContext(RegisterCtx);
  const key = namespace(id);

  const stored = useEditorValue<Rect | typeof DELETED | undefined>(key, undefined);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    rect: Rect;
    handle: Handle | 'move';
    // Captured once per drag: the zoom can't change mid-gesture, and reading
    // it here means the gesture never depends on React having re-rendered.
    scale: number;
  } | null>(null);
  // The value onPointerUp must persist. A plain state variable isn't safe to
  // read there: on a very fast pointerdown -> move -> up sequence, onPointerUp
  // can still be running the closure from *before* the pointermove's setState
  // committed, so it would read a stale null and silently skip the save. A ref
  // is always current regardless of render timing.
  const liveRectRef = useRef<Rect | null>(null);
  const [liveRect, setLiveRect] = useState<Rect | null>(null);

  useEffect(() => {
    register?.(id, key);
  }, [register, id, key]);

  const deleted = stored === DELETED;
  const savedRect = stored && stored !== DELETED ? stored : defaultRect;
  const rect = liveRect ?? savedRect;
  const selected = selectedId === key;

  if (deleted) return null;

  const onPointerDown = (e: React.PointerEvent, handle: Handle | 'move') => {
    if (!editMode) return;
    e.stopPropagation();
    e.preventDefault();
    select(key);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      rect,
      handle,
      scale: getScale(),
    };
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      // Thrown for a pointerId the platform doesn't recognise as an active
      // pointer (e.g. a programmatically dispatched event in a test) — safe
      // to ignore, since we dispatch move/up on the same element anyway.
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const {rect: start, handle, scale} = dragRef.current;
    const dx = (e.clientX - dragRef.current.startX) / scale;
    const dy = (e.clientY - dragRef.current.startY) / scale;
    const next: Rect = {...start};

    if (handle === 'move') {
      next.x = start.x + dx;
      next.y = start.y + dy;
    } else {
      if (handle.includes('e')) next.width = Math.max(20, start.width + dx);
      if (handle.includes('s')) next.height = Math.max(20, start.height + dy);
      if (handle.includes('w')) {
        next.width = Math.max(20, start.width - dx);
        next.x = start.x + dx;
      }
      if (handle.includes('n')) {
        next.height = Math.max(20, start.height - dy);
        next.y = start.y + dy;
      }
    }
    liveRectRef.current = next;
    setLiveRect(next);
  };

  const onPointerUp = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (liveRectRef.current) {
      setRect(id, liveRectRef.current);
      liveRectRef.current = null;
      setLiveRect(null);
    }
  };

  return (
    <div
      // Stable handle for finding a specific box in DevTools or a test.
      data-editable-id={key}
      data-editable-label={label ?? id}
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        cursor: editMode ? 'move' : 'default',
        outline: selected ? '2px solid #4f7cf7' : editMode ? '1px dashed rgba(79,124,247,0.5)' : 'none',
        outlineOffset: 2,
        ...style,
      }}
      onClick={(e) => {
        if (editMode) {
          e.stopPropagation();
          select(key);
        }
      }}
      onPointerDown={(e) => onPointerDown(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {children}

      {editMode && selected
        ? HANDLES.map((h) => (
            <div
              key={h}
              onPointerDown={(e) => onPointerDown(e, h)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              style={{
                position: 'absolute',
                width: 12,
                height: 12,
                background: '#4f7cf7',
                border: '2px solid #fff',
                borderRadius: 3,
                cursor: cursorFor[h],
                zIndex: 10000,
                ...handlePos[h],
              }}
            />
          ))
        : null}
    </div>
  );
};

export {clearAll, clearValue};
