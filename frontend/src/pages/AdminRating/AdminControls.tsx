import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

/* ============================ tokens ============================ */
const C = {
  primary: "#00C099",
  primarySoft: "rgba(0,192,153,0.12)",
  primaryText: "#017a63",
  border: "#D8E1EB",
  borderHover: "#00C099",
  text: "#2B3648",
  muted: "#7A879A",
  bg: "#FFFFFF",
  bgSoft: "#F5F8FB",
  danger: "#E5484D",
  radius: 10,
  z: 1000000000000,
};

const baseField: React.CSSProperties = {
  width: "100%",
  height: 42,
  boxSizing: "border-box",
  padding: "0 12px",
  border: `1px solid ${C.border}`,
  borderRadius: C.radius,
  background: C.bg,
  color: C.text,
  fontSize: 13.5,
  outline: "none",
  transition: "border-color 160ms ease, box-shadow 160ms ease",
};

/* ============================ Portal ============================ */
export const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [el] = useState(() => {
    const d = document.createElement("div");
    d.setAttribute("data-admin-portal", "");
    return d;
  });
  useEffect(() => {
    document.body.appendChild(el);
    return () => {
      if (el.parentNode) el.parentNode.removeChild(el);
    };
  }, [el]);
  return createPortal(children, el);
};

/* ================= anchored floating positioning ================= */
type Coords = { left: number; top: number; width: number; placement: "bottom" | "top" };

const useAnchored = (
  anchorRef: React.RefObject<HTMLElement>,
  open: boolean,
  opts: { matchWidth?: boolean; maxHeight?: number } = {}
): Coords => {
  const [coords, setCoords] = useState<Coords>({ left: 0, top: 0, width: 0, placement: "bottom" });
  const compute = useCallback(() => {
    const a = anchorRef.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const vh = window.innerHeight;
    const spaceBelow = vh - r.bottom;
    const need = opts.maxHeight ?? 280;
    const placement: "bottom" | "top" = spaceBelow < need && r.top > spaceBelow ? "top" : "bottom";
    setCoords({
      left: r.left,
      top: placement === "bottom" ? r.bottom + 6 : r.top - 6,
      width: r.width,
      placement,
    });
  }, [anchorRef, opts.maxHeight]);

  useLayoutEffect(() => {
    if (!open) return;
    compute();
    const onScroll = () => compute();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, compute]);

  return coords;
};

const useOutside = (
  refs: React.RefObject<HTMLElement>[],
  open: boolean,
  close: () => void
) => {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (refs.every((r) => r.current && !r.current.contains(e.target as Node))) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [refs, open, close]);
};

/* ============================ InfoTip ============================ */
export const InfoTip = ({
  title,
  meaning,
  formula,
  source,
  missing,
  example,
  testid,
}: {
  title: string;
  meaning: string;
  formula?: string;
  source?: string;
  missing?: string;
  example?: string;
  testid?: string;
}) => {
  const [open, setOpen] = useState(false);
  const iconRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const coords = useAnchored(iconRef, open, { maxHeight: 320 });
  useOutside([iconRef, popRef], open, () => setOpen(false));

  const row = (label: string, value?: React.ReactNode) =>
    value ? (
      <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: "17px", color: C.text }}>
        <span style={{ color: C.muted }}>{label}: </span>
        {value}
      </div>
    ) : null;

  return (
    <>
      <span
        ref={iconRef}
        data-testid={testid}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: 999,
          border: `1px solid ${C.border}`,
          color: C.muted,
          fontSize: 11,
          fontWeight: 700,
          cursor: "help",
          userSelect: "none",
        }}
      >
        ?
      </span>
      {open ? (
        <Portal>
          <div
            ref={popRef}
            role="tooltip"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            style={{
              position: "fixed",
              left: Math.max(8, Math.min(coords.left, window.innerWidth - 340)),
              top: coords.placement === "bottom" ? coords.top : undefined,
              bottom: coords.placement === "top" ? window.innerHeight - coords.top : undefined,
              width: 320,
              zIndex: C.z + 100,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              boxShadow: "0 12px 36px rgba(20,30,55,0.18)",
              padding: 14,
            }}
          >
            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text }}>{title}</div>
            <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: "17px", color: C.text }}>
              {meaning}
            </div>
            {row("Как рассчитывается", formula ? <code style={{ fontSize: 11.5 }}>{formula}</code> : undefined)}
            {row("Источник данных", source)}
            {row("Если данных нет", missing)}
            {row("Пример", example)}
          </div>
        </Portal>
      ) : null}
    </>
  );
};

/* ============================ AdminSelect ============================ */
export interface Option {
  value: string;
  label: string;
}

export const AdminSelect = ({
  value,
  options,
  onChange,
  placeholder = "— выберите —",
  searchable,
  disabled,
  testid,
  ariaLabel,
}: {
  value?: string;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  searchable?: boolean;
  disabled?: boolean;
  testid?: string;
  ariaLabel?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const coords = useAnchored(btnRef, open, { matchWidth: true });
  useOutside([btnRef, menuRef], open, () => setOpen(false));

  const current = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    if (!searchable || !q.trim()) return options;
    const s = q.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s));
  }, [options, q, searchable]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        data-testid={testid}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onClick={() => !disabled && setOpen((v) => !v)}
        style={{
          ...baseField,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          opacity: disabled ? 0.6 : 1,
          borderColor: open || focused ? C.primary : C.border,
          boxShadow: open || focused ? `0 0 0 3px ${C.primarySoft}` : "none",
        }}
      >
        <span style={{ color: current ? C.text : C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current ? current.label : placeholder}
        </span>
        <span style={{ color: C.muted, transform: open ? "rotate(180deg)" : "none", transition: "transform 160ms" }}>▾</span>
      </button>
      {open ? (
        <Portal>
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              left: coords.left,
              top: coords.placement === "bottom" ? coords.top : undefined,
              bottom: coords.placement === "top" ? window.innerHeight - coords.top : undefined,
              width: coords.width,
              maxHeight: 300,
              overflowY: "auto",
              zIndex: C.z,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: C.radius,
              boxShadow: "0 12px 32px rgba(20,30,55,0.16)",
              padding: 6,
            }}
          >
            {searchable ? (
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Поиск…"
                style={{ ...baseField, height: 36, marginBottom: 6 }}
              />
            ) : null}
            {filtered.map((o) => {
              const active = o.value === value;
              return (
                <div
                  key={o.value}
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                    setQ("");
                  }}
                  style={{
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 13.5,
                    cursor: "pointer",
                    color: active ? C.primaryText : C.text,
                    background: active ? C.primarySoft : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = C.bgSoft; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {o.label}
                </div>
              );
            })}
            {!filtered.length ? <div style={{ padding: 10, color: C.muted, fontSize: 13 }}>Ничего не найдено</div> : null}
          </div>
        </Portal>
      ) : null}
    </>
  );
};

/* ============================ AdminMultiSelect ============================ */
export const AdminMultiSelect = ({
  values,
  options,
  onChange,
  placeholder = "— выберите —",
  testid,
}: {
  values: string[];
  options: Option[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  testid?: string;
}) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const coords = useAnchored(btnRef, open, { matchWidth: true });
  useOutside([btnRef, menuRef], open, () => setOpen(false));
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const selected = options.filter((o) => values.includes(o.value));

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-testid={testid}
        onClick={() => setOpen((v) => !v)}
        style={{
          ...baseField,
          height: "auto",
          minHeight: 42,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          alignItems: "center",
          padding: 6,
          cursor: "pointer",
          borderColor: open ? C.primary : C.border,
          boxShadow: open ? `0 0 0 3px ${C.primarySoft}` : "none",
        }}
      >
        {selected.length ? (
          selected.map((o) => (
            <span key={o.value} style={{ background: C.primarySoft, color: C.primaryText, borderRadius: 999, padding: "3px 10px", fontSize: 12.5 }}>
              {o.label}
            </span>
          ))
        ) : (
          <span style={{ color: C.muted, padding: "0 6px" }}>{placeholder}</span>
        )}
      </button>
      {open ? (
        <Portal>
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: coords.left,
              top: coords.placement === "bottom" ? coords.top : undefined,
              bottom: coords.placement === "top" ? window.innerHeight - coords.top : undefined,
              width: coords.width,
              maxHeight: 280,
              overflowY: "auto",
              zIndex: C.z,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: C.radius,
              boxShadow: "0 12px 32px rgba(20,30,55,0.16)",
              padding: 6,
            }}
          >
            {options.map((o) => {
              const active = values.includes(o.value);
              return (
                <label key={o.value} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13.5, color: C.text }}>
                  <input type="checkbox" checked={active} onChange={() => toggle(o.value)} />
                  {o.label}
                </label>
              );
            })}
          </div>
        </Portal>
      ) : null}
    </>
  );
};

/* ============================ AdminDatePicker ============================ */
export const AdminDatePicker = ({
  value,
  onChange,
  testid,
  placeholder,
}: {
  value?: string;
  onChange: (v: string) => void;
  testid?: string;
  placeholder?: string;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type="date"
      data-testid={testid}
      value={value ? value.slice(0, 10) : ""}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...baseField,
        colorScheme: "light",
        borderColor: focused ? C.primary : C.border,
        boxShadow: focused ? `0 0 0 3px ${C.primarySoft}` : "none",
      }}
    />
  );
};

/* ============================ AdminEntitySearch ============================ */
export interface EntityHit {
  id: string;
  label: string;
  score?: number | null;
}

export const AdminEntitySearch = ({
  onSearch,
  onSelect,
  selectedLabel,
  placeholder = "Поиск по названию / email / username",
  testid,
}: {
  onSearch: (q: string) => Promise<EntityHit[]>;
  onSelect: (hit: EntityHit) => void;
  selectedLabel?: string;
  placeholder?: string;
  testid?: string;
}) => {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<EntityHit[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const coords = useAnchored(inputRef, open, { matchWidth: true });
  useOutside([wrapRef, menuRef], open, () => setOpen(false));

  useEffect(() => {
    if (!q.trim()) { setHits([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await onSearch(q.trim());
        setHits(res || []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, onSearch]);

  const [focused, setFocused] = useState(false);
  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      <input
        ref={inputRef}
        data-testid={testid}
        value={q}
        placeholder={selectedLabel ? `Выбрано: ${selectedLabel}` : placeholder}
        onFocus={() => { setFocused(true); if (hits.length) setOpen(true); }}
        onBlur={() => setFocused(false)}
        onChange={(e) => setQ(e.target.value)}
        style={{ ...baseField, borderColor: focused ? C.primary : C.border, boxShadow: focused ? `0 0 0 3px ${C.primarySoft}` : "none" }}
      />
      {open ? (
        <Portal>
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              left: coords.left,
              top: coords.placement === "bottom" ? coords.top : undefined,
              bottom: coords.placement === "top" ? window.innerHeight - coords.top : undefined,
              width: coords.width,
              maxHeight: 300,
              overflowY: "auto",
              zIndex: C.z,
              background: C.bg,
              border: `1px solid ${C.border}`,
              borderRadius: C.radius,
              boxShadow: "0 12px 32px rgba(20,30,55,0.16)",
              padding: 6,
            }}
          >
            {loading ? <div style={{ padding: 10, color: C.muted, fontSize: 13 }}>Поиск…</div> : null}
            {!loading && !hits.length ? <div style={{ padding: 10, color: C.muted, fontSize: 13 }}>Ничего не найдено</div> : null}
            {hits.map((h) => (
              <div
                key={h.id}
                data-testid="entity-hit"
                onClick={() => { onSelect(h); setOpen(false); setQ(""); }}
                style={{ padding: "9px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13.5, color: C.text, display: "flex", justifyContent: "space-between", gap: 10 }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = C.bgSoft)}
                onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = "transparent")}
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.label}</span>
                <small style={{ color: C.muted, flexShrink: 0 }}>рейтинг: {h.score ?? "—"}</small>
              </div>
            ))}
          </div>
        </Portal>
      ) : null}
    </div>
  );
};
