import React, {useEffect, useState} from 'react';
import {createPortal} from 'react-dom';
import {useVideoConfig} from 'remotion';
import {DEFAULT_LOOK, GRADES, GRADE_IDS, GradeId, Look, normaliseLook} from '../effects/look';
import {FORMATS, FORMAT_IDS, formatForSize} from '../formats';
import {clearAll, setValue, useEditorValue} from './store';
import {baseCompositionId} from './EditableCanvas';

/**
 * The editor's control panel, docked to the right edge of the window.
 *
 * It is portalled to <body> rather than rendered where it sits in the tree.
 * Inside the composition it would be subject to two things that make it
 * unusable: the Studio scales the whole frame to fit the pane (so a 13px
 * label renders at about 3px and has to be counter-scaled back up), and —
 * worse — a panel wide enough to hold sliders covers most of a 9:16 preview,
 * hiding the very thing being edited. Outside the composition it is plain
 * screen pixels at the edge of the window, clear of the video at any zoom.
 */

const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';

/**
 * useState that survives the hot-reload caused by saving. Every access is
 * guarded: localStorage throws in a private window or with site data blocked,
 * and the panel must still work when it does.
 */
const usePersistentState = <T,>(key: string, fallback: T): [T, (v: T) => void] => {
  const [value, setRaw] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  });
  const set = (v: T) => {
    setRaw(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* not persisted this session — harmless */
    }
  };
  return [value, set];
};

/**
 * Render into <body> so the panel escapes the composition's transform.
 * Guarded: there is no document during a render, where this never mounts
 * anyway, and returning null is safer than throwing if that ever changes.
 */
const portal = (node: React.ReactNode) =>
  typeof document === 'undefined' ? null : createPortal(node, document.body);

const PANEL_W = 300;
const PANEL_BG = 'rgba(17,21,28,0.96)';

const headerBtn: React.CSSProperties = {
  background: 'rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.7)',
  border: 'none',
  borderRadius: 6,
  width: 22,
  height: 22,
  fontSize: 12,
  cursor: 'pointer',
  lineHeight: 1,
  flexShrink: 0,
};
const BORDER = '1px solid rgba(255,255,255,0.12)';
const ACCENT = '#4f7cf7';

type Tab = 'layout' | 'look' | 'crop' | 'frame';

const Label: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div
    style={{
      color: 'rgba(255,255,255,0.45)',
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

const Slider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (v: number) => void;
}> = ({label, value, min, max, step, suffix = '', onChange}) => (
  <div style={{marginBottom: 10}}>
    <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 3}}>
      <span style={{color: 'rgba(255,255,255,0.78)', fontSize: 11.5, fontWeight: 600}}>{label}</span>
      <span style={{color: 'rgba(255,255,255,0.5)', fontSize: 11, fontVariantNumeric: 'tabular-nums'}}>
        {value.toFixed(step < 0.1 ? 2 : 1)}
        {suffix}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{width: '100%', accentColor: ACCENT, height: 14, cursor: 'pointer'}}
    />
  </div>
);

const TabButton: React.FC<{active: boolean; onClick: () => void; children: React.ReactNode}> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      flex: 1,
      background: active ? 'rgba(79,124,247,0.18)' : 'transparent',
      color: active ? '#dce6ff' : 'rgba(255,255,255,0.55)',
      border: 'none',
      borderBottom: active ? `2px solid ${ACCENT}` : '2px solid transparent',
      padding: '8px 0',
      fontFamily: FONT,
      fontSize: 11.5,
      fontWeight: 700,
      letterSpacing: 0.3,
      cursor: 'pointer',
    }}
  >
    {children}
  </button>
);

export const EditorPanel: React.FC<{
  compositionId: string;
  editMode: boolean;
  onToggleEditMode: () => void;
  selectedId: string | null;
  registered: {id: string; key: string}[];
  onSelect: (key: string | null) => void;
}> = ({compositionId, editMode, onToggleEditMode, selectedId, registered, onSelect}) => {
  const {width, height} = useVideoConfig();
  const format = formatForSize(width, height);
  // Saving a value rewrites layout.json, which Remotion hot-reloads — which
  // remounts this panel. Without persisting which tab was open and whether the
  // panel was expanded, every slider nudge would snap the panel shut. This is
  // per-viewer UI state, not project data, so localStorage is the right home
  // for it; a failure to read or write it must never break the panel.
  const [tab, setTab] = usePersistentState<Tab>('remotion.editorPanel.tab', 'layout');
  const [open, setOpen] = usePersistentState<boolean>('remotion.editorPanel.open', false);

  // Where the panel sits, in viewport pixels.
  //
  // It has to be movable rather than pinned: the Studio's own Inspector docks
  // to the right edge too, so a fixed panel there covers the props you're
  // trying to edit — and which sidebars are open, and how wide the window is,
  // differ per person and per moment. Dragging puts that under the user's
  // control instead of guessing, and the position is remembered.
  const [pos, setPos] = usePersistentState<{x: number; y: number} | null>(
    'remotion.editorPanel.pos',
    null,
  );

  const dragRef = React.useRef<{dx: number; dy: number} | null>(null);

  // A saved position can end up off-screen — the window was resized, or the
  // panel was dragged on a bigger monitor. Clamp so it can never be stranded
  // somewhere unreachable with no way to get it back.
  const clamp = (p: {x: number; y: number}) => ({
    x: Math.max(0, Math.min(p.x, window.innerWidth - PANEL_W)),
    y: Math.max(0, Math.min(p.y, window.innerHeight - 80)),
  });

  const dockRight = () => setPos(clamp({x: window.innerWidth - PANEL_W, y: 0}));
  const dockLeft = () => setPos(clamp({x: 0, y: 0}));

  // Clamping at drag time isn't enough on its own: the stored position is read
  // straight back from localStorage on mount, so one saved on a larger monitor
  // — or left behind when the window shrinks — renders completely off-screen
  // with no handle left to drag it back. Re-clamp whenever the position or the
  // window changes. clamp() is idempotent, so this settles in one extra pass
  // rather than looping.
  useEffect(() => {
    if (!pos) return;
    const fix = () => {
      const c = clamp(pos);
      if (c.x !== pos.x || c.y !== pos.y) setPos(c);
    };
    fix();
    window.addEventListener('resize', fix);
    return () => window.removeEventListener('resize', fix);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pos?.x, pos?.y]);

  const onHeaderPointerDown = (e: React.PointerEvent) => {
    // Ignore drags that start on the header's own buttons.
    if ((e.target as HTMLElement).closest('button')) return;
    const box = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!box) return;
    dragRef.current = {dx: e.clientX - box.left, dy: e.clientY - box.top};
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  };

  const onHeaderPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPos(clamp({x: e.clientX - dragRef.current.dx, y: e.clientY - dragRef.current.dy}));
  };

  const onHeaderPointerUp = () => {
    dragRef.current = null;
  };

  const lookKey = `${baseCompositionId(compositionId)}.__look`;
  const look = normaliseLook(useEditorValue<unknown>(lookKey, DEFAULT_LOOK));
  const patchLook = (patch: Partial<Look>) => setValue(lookKey, {...look, ...patch});

  // Remotion Studio's "Outlines" overlay draws an SVG polygon over every
  // element it can map to source, with pointerEvents: 'all'. While it's on,
  // that polygon sits above this canvas and eats every click — selecting and
  // dragging silently do nothing, and a double-click gets read as "open this
  // element's source file" instead. It's rendered by the Studio chrome,
  // outside this React tree, so it can't be out-ranked from here; the only
  // fix is to turn it off. Studio persists the toggle in localStorage and the
  // composition runs in the same document, so we can read it and say so
  // plainly rather than letting the editor look broken.
  const [outlinesBlocking, setOutlinesBlocking] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        setOutlinesBlocking(localStorage.getItem('remotion.editorShowOutlines') !== 'false');
      } catch {
        setOutlinesBlocking(false);
      }
    };
    read();
    // Studio writes the key directly; a same-document write fires no 'storage'
    // event, so poll rather than listen.
    const t = setInterval(read, 1000);
    return () => clearInterval(t);
  }, []);

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  if (!open) {
    return portal(
      <div
        style={{
          position: 'fixed',
          top: '50%',
          right: 0,
          transform: 'translateY(-50%)',
          zIndex: 2147483000,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {outlinesBlocking ? (
          <div
            style={{
              background: 'rgba(220,82,74,0.96)',
              color: '#fff',
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 700,
              padding: '7px 10px',
              borderRadius: 7,
              whiteSpace: 'nowrap',
            }}
          >
            Turn off “Outlines” to edit
          </div>
        ) : null}
        <button
          type="button"
          onPointerDown={stop}
          onClick={(e) => {
            stop(e);
            setOpen(true);
          }}
          style={{
            background: ACCENT,
            color: '#fff',
            fontFamily: FONT,
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: 'nowrap',
            padding: '12px 14px',
            // Rounded on the inner side only — it reads as a tab pulled out
            // from the edge rather than a pill someone dropped there.
            borderRadius: '10px 0 0 10px',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '-4px 0 18px rgba(0,0,0,0.45)',
          }}
        >
          ⚙ Editor
        </button>
      </div>,
    );
  }

  return portal(
    <div
      onPointerDown={stop}
      onClick={stop}
      style={{
        position: 'fixed',
        // Default to the right edge; once dragged, the saved position wins.
        ...(pos ? {left: pos.x, top: pos.y} : {right: 0, top: 0}),
        zIndex: 2147483000,
        width: PANEL_W,
        // Capped rather than full-height, so it reads as a movable window and
        // never blankets a whole column of the Studio.
        maxHeight: 'min(78vh, 560px)',
        display: 'flex',
        flexDirection: 'column',
        background: PANEL_BG,
        backdropFilter: 'blur(14px)',
        border: BORDER,
        borderRadius: 12,
        boxShadow: '0 18px 50px rgba(0,0,0,0.55)',
        fontFamily: FONT,
        overflow: 'hidden',
      }}
    >
      {/* Header — also the drag handle */}
      <div
        onPointerDown={onHeaderPointerDown}
        onPointerMove={onHeaderPointerMove}
        onPointerUp={onHeaderPointerUp}
        onPointerCancel={onHeaderPointerUp}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 12px',
          borderBottom: BORDER,
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        }}
      >
        <div style={{flex: 1, minWidth: 0}}>
          <div
            style={{
              color: '#fff',
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: 0.2,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{color: 'rgba(255,255,255,0.35)', fontSize: 13, lineHeight: 1}}>⠿</span>
            Canvas Editor
          </div>
          <div
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 10.5,
              marginTop: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {format.aspectLabel} · {width}×{height} · {format.platforms[0]}
          </div>
        </div>
        {/* Snap to either edge in one click, for when dragging is more
            fiddling than it's worth. */}
        <button type="button" title="Dock left" onClick={dockLeft} style={headerBtn}>
          ⇤
        </button>
        <button type="button" title="Dock right" onClick={dockRight} style={headerBtn}>
          ⇥
        </button>
        <button type="button" title="Collapse" onClick={() => setOpen(false)} style={headerBtn}>
          ×
        </button>
      </div>

      {outlinesBlocking ? (
        <div
          style={{
            background: 'rgba(220,82,74,0.92)',
            color: '#fff',
            fontSize: 10.5,
            fontWeight: 600,
            lineHeight: 1.4,
            padding: '7px 12px',
          }}
        >
          Dragging is blocked — turn off <strong>Outlines</strong> in the toolbar above the canvas.
        </div>
      ) : null}

      <div style={{display: 'flex', borderBottom: BORDER}}>
        <TabButton active={tab === 'layout'} onClick={() => setTab('layout')}>
          Layout
        </TabButton>
        <TabButton active={tab === 'look'} onClick={() => setTab('look')}>
          Look
        </TabButton>
        <TabButton active={tab === 'crop'} onClick={() => setTab('crop')}>
          Crop
        </TabButton>
        <TabButton active={tab === 'frame'} onClick={() => setTab('frame')}>
          Sizes
        </TabButton>
      </div>

      <div style={{padding: 12, overflowY: 'auto', flex: 1}}>
        {tab === 'layout' ? (
          <>
            <button
              type="button"
              onClick={onToggleEditMode}
              style={{
                width: '100%',
                background: editMode ? '#dc524a' : ACCENT,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 0',
                fontFamily: FONT,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                marginBottom: 10,
              }}
            >
              {editMode ? '✕ Exit edit mode' : '✏ Enter edit mode'}
            </button>

            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 10.5,
                lineHeight: 1.45,
                marginBottom: 12,
              }}
            >
              {editMode
                ? 'Click an element, then drag it or its handles. Delete removes it, Esc deselects.'
                : 'Turn on edit mode to move, resize or delete anything on screen.'}
            </div>

            <Label>Elements in this scene</Label>
            {registered.length === 0 ? (
              <div style={{color: 'rgba(255,255,255,0.35)', fontSize: 11}}>
                Nothing editable at this frame.
              </div>
            ) : (
              registered.map(({id, key}) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelect(key)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: selectedId === key ? 'rgba(79,124,247,0.2)' : 'rgba(255,255,255,0.04)',
                    color: selectedId === key ? '#dce6ff' : 'rgba(255,255,255,0.7)',
                    border: selectedId === key ? `1px solid ${ACCENT}` : '1px solid transparent',
                    borderRadius: 7,
                    padding: '6px 9px',
                    fontFamily: FONT,
                    fontSize: 11,
                    marginBottom: 4,
                    cursor: 'pointer',
                  }}
                >
                  {id}
                </button>
              ))
            )}

            <button
              type="button"
              onClick={() => clearAll(`${compositionId}.`)}
              style={{
                width: '100%',
                marginTop: 10,
                background: 'transparent',
                color: 'rgba(255,255,255,0.55)',
                border: BORDER,
                borderRadius: 8,
                padding: '7px 0',
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset layout for this format
            </button>
          </>
        ) : null}

        {tab === 'look' ? (
          <>
            <Label>Grade</Label>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 12}}>
              {GRADE_IDS.map((gid: GradeId) => {
                const g = GRADES[gid];
                const active = look.grade === gid;
                return (
                  <button
                    key={gid}
                    type="button"
                    onClick={() => patchLook({grade: gid})}
                    title={g.note}
                    style={{
                      background: active ? 'rgba(79,124,247,0.22)' : 'rgba(255,255,255,0.05)',
                      color: active ? '#dce6ff' : 'rgba(255,255,255,0.72)',
                      border: active ? `1px solid ${ACCENT}` : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 7,
                      padding: '7px 6px',
                      fontFamily: FONT,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            <Label>Adjust</Label>
            <Slider
              label="Brightness"
              value={look.brightness}
              min={0.6}
              max={1.5}
              step={0.01}
              onChange={(v) => patchLook({brightness: v})}
            />
            <Slider
              label="Contrast"
              value={look.contrast}
              min={0.6}
              max={1.8}
              step={0.01}
              onChange={(v) => patchLook({contrast: v})}
            />
            <Slider
              label="Saturation"
              value={look.saturate}
              min={0}
              max={2}
              step={0.01}
              onChange={(v) => patchLook({saturate: v})}
            />
            <Slider
              label="Blur"
              value={look.blur}
              min={0}
              max={12}
              step={0.5}
              suffix="px"
              onChange={(v) => patchLook({blur: v})}
            />
            <Slider
              label="Vignette"
              value={look.vignette}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => patchLook({vignette: v})}
            />
            <Slider
              label="Grain"
              value={look.grain}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => patchLook({grain: v})}
            />

            <button
              type="button"
              onClick={() => setValue(lookKey, DEFAULT_LOOK)}
              style={{
                width: '100%',
                marginTop: 4,
                background: 'transparent',
                color: 'rgba(255,255,255,0.55)',
                border: BORDER,
                borderRadius: 8,
                padding: '7px 0',
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset look
            </button>
            <div
              style={{
                color: 'rgba(255,255,255,0.35)',
                fontSize: 10,
                lineHeight: 1.45,
                marginTop: 8,
              }}
            >
              The grade is shared by every format of this video, so you colour once and
              export everywhere.
            </div>
          </>
        ) : null}

        {tab === 'crop' ? (
          <>
            <Label>Reframe</Label>
            <div
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 10.5,
                lineHeight: 1.45,
                marginBottom: 10,
              }}
            >
              Push in and slide the picture — use it when the subject doesn&apos;t land in
              the middle of this shape.
            </div>
            <Slider
              label="Zoom"
              value={look.zoom}
              min={1}
              max={2.5}
              step={0.01}
              suffix="×"
              onChange={(v) => patchLook({zoom: v})}
            />
            <Slider
              label="Pan X"
              value={look.panX}
              min={-50}
              max={50}
              step={0.5}
              suffix="%"
              onChange={(v) => patchLook({panX: v})}
            />
            <Slider
              label="Pan Y"
              value={look.panY}
              min={-50}
              max={50}
              step={0.5}
              suffix="%"
              onChange={(v) => patchLook({panY: v})}
            />
            <button
              type="button"
              onClick={() => patchLook({zoom: 1, panX: 0, panY: 0})}
              style={{
                width: '100%',
                marginTop: 4,
                background: 'transparent',
                color: 'rgba(255,255,255,0.55)',
                border: BORDER,
                borderRadius: 8,
                padding: '7px 0',
                fontFamily: FONT,
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reset crop
            </button>
          </>
        ) : null}

        {tab === 'frame' ? (
          <>
            <Label>This video, every shape</Label>
            {FORMAT_IDS.map((fid) => {
              const f = FORMATS[fid];
              const isCurrent = f.width === width && f.height === height;
              return (
                <div
                  key={fid}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    background: isCurrent ? 'rgba(79,124,247,0.16)' : 'rgba(255,255,255,0.04)',
                    border: isCurrent ? `1px solid ${ACCENT}` : '1px solid transparent',
                    borderRadius: 8,
                    padding: '7px 9px',
                    marginBottom: 5,
                  }}
                >
                  {/* Proportional thumbnail of the shape */}
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: f.width >= f.height ? 24 : (24 * f.width) / f.height,
                        height: f.height >= f.width ? 24 : (24 * f.height) / f.width,
                        border: `1.5px solid ${isCurrent ? ACCENT : 'rgba(255,255,255,0.35)'}`,
                        borderRadius: 3,
                      }}
                    />
                  </div>
                  <div style={{minWidth: 0, flex: 1}}>
                    <div style={{color: '#fff', fontSize: 11.5, fontWeight: 700}}>
                      {f.aspectLabel} · {f.width}×{f.height}
                    </div>
                    <div
                      style={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: 10,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {f.platforms.join(' · ')}
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              style={{
                color: 'rgba(255,255,255,0.4)',
                fontSize: 10,
                lineHeight: 1.5,
                marginTop: 8,
              }}
            >
              Switch shape from the composition list on the left — each one keeps its own
              arrangement, so reframing 9:16 never disturbs the 16:9 cut.
              <br />
              <br />
              Export all four with <code style={{color: 'rgba(255,255,255,0.7)'}}>npm run render:all</code>.
            </div>
          </>
        ) : null}
      </div>
    </div>,
  );
};
