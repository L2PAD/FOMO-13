import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { createUseStyles } from "react-jss";
import { createPortal } from "react-dom";
import { InfoTip as RatingInfoTip } from "./AdminControls";

/**
 * Shared, design-consistent primitives for the XP admin (styled dropdown + tooltip)
 * plus human-readable Russian labels for XP events, groups, sources and statuses.
 * No developer artefacts (raw event codes, versions, English) are shown to admins.
 */

const useUiStyles = createUseStyles({
  ddWrap: { position: "relative", display: "inline-block", minWidth: 150 },
  ddButton: {
    width: "100%",
    height: 38,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    border: "1px solid #D8E1EB",
    borderRadius: 10,
    background: "#fff",
    color: "#1D2939",
    padding: "0 12px",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    transition: "border-color 160ms ease, box-shadow 160ms ease",
    "&:hover": { borderColor: "#00C099" },
    "&:focus-visible": { outline: "none", borderColor: "#00C099", boxShadow: "0 0 0 3px rgba(0,192,153,0.14)" },
  },
  ddButtonOpen: { borderColor: "#00C099", boxShadow: "0 0 0 3px rgba(0,192,153,0.14)" },
  ddChevron: { transition: "transform 160ms ease", flexShrink: 0, color: "#7B8AA0" },
  ddChevronOpen: { transform: "rotate(180deg)" },
  ddMenu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    minWidth: "100%",
    background: "#fff",
    border: "1px solid #E4EAF1",
    borderRadius: 12,
    boxShadow: "0 12px 28px rgba(16,24,40,0.14)",
    padding: 6,
    zIndex: 200,
    maxHeight: 260,
    overflowY: "auto",
  },
  ddItem: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 10px",
    borderRadius: 8,
    fontSize: 13,
    color: "#1D2939",
    cursor: "pointer",
    whiteSpace: "nowrap",
    transition: "background 140ms ease, color 140ms ease",
    "&:hover": { background: "#F2FBF8" },
  },
  ddItemActive: { background: "rgba(0,192,153,0.12)", color: "#00815F", fontWeight: 700 },
  ddCheck: { marginLeft: "auto", color: "#00C099", fontWeight: 800 },

  tipWrap: { position: "relative", display: "inline-flex", alignItems: "center" },
  tipIcon: {
    width: 15,
    height: 15,
    borderRadius: "50%",
    border: "1.4px solid #B6C2D2",
    color: "#8A98AC",
    fontSize: 10,
    fontWeight: 800,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "help",
    marginLeft: 6,
    lineHeight: 1,
  },
  tipBubble: {
    position: "absolute",
    bottom: "calc(100% + 8px)",
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1D2939",
    color: "#fff",
    padding: "8px 11px",
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 500,
    lineHeight: 1.5,
    width: 240,
    textAlign: "left",
    boxShadow: "0 8px 20px rgba(16,24,40,0.28)",
    zIndex: 300,
    pointerEvents: "none",
    whiteSpace: "normal",
    letterSpacing: 0.1,
  },
});

export interface DdOption {
  value: string;
  label: string;
}

export const Dropdown: React.FC<{
  value: string;
  options: DdOption[];
  onChange: (v: string) => void;
  testid?: string;
  minWidth?: number;
}> = ({ value, options, onChange, testid, minWidth }) => {
  const c = useUiStyles();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number; width: number }>({ left: 0, top: 0, width: 0 });

  const compute = useCallback(() => {
    const b = btnRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    setCoords({ left: r.left, top: r.bottom + 6, width: r.width });
  }, []);
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
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(e.target as Node) && menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const current = options.find((o) => o.value === value);
  return (
    <div className={c.ddWrap} style={minWidth ? { minWidth } : undefined}>
      <button
        type="button" ref={btnRef} data-testid={testid}
        className={`${c.ddButton} ${open ? c.ddButtonOpen : ""}`}
        onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}
      >
        <span>{current?.label ?? "—"}</span>
        <svg className={`${c.ddChevron} ${open ? c.ddChevronOpen : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && createPortal(
        <div ref={menuRef} className={c.ddMenu} role="listbox" style={{ position: "fixed", left: coords.left, top: coords.top, minWidth: Math.max(coords.width, minWidth || 0) }}>
          {options.map((o) => (
            <div
              key={o.value} role="option" aria-selected={o.value === value}
              className={`${c.ddItem} ${o.value === value ? c.ddItemActive : ""}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span>{o.label}</span>
              {o.value === value ? <span className={c.ddCheck}>✓</span> : null}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export const InfoTip: React.FC<{ text: string; title?: string; source?: string }> = ({ text, title, source }) => (
  <RatingInfoTip title={title || "Подсказка"} meaning={text} source={source} />
);

/* ---- Human-readable dictionaries (no raw codes / English shown to admins) ---- */

export const EVENT_META: Record<string, { label: string; hint: string }> = {
  twitter_action: { label: "Действие в Twitter", hint: "Начисляется за подтверждённое действие в Twitter. Дедупликация по заданию и аккаунту, чтобы одно и то же действие не засчитывалось повторно." },
  chat_message: { label: "Сообщение в чате", hint: "Начисляется за сообщение в чате. Есть дневной лимит и задержка между начислениями для защиты от спама." },
  comment_created: { label: "Комментарий", hint: "Начисляется за комментарий. Дневной лимит и задержка защищают от накрутки." },
  contribution_verified: { label: "Подтверждённый вклад", hint: "Начисляется за подтверждённый полезный вклад: флаг, отчёт, исправление данных или источник. Требует проверки модератором." },
  earlyland_task: { label: "Задание EarlyLand", hint: "Начисляется за выполненное задание кампании EarlyLand. Значение XP берётся из настроек задания." },
  referral_l1: { label: "Активный реферал 1-го уровня", hint: "Начисляется за квалифицированного реферала первой линии. Один раз на приглашённого пользователя." },
  referral_l2: { label: "Активный реферал 2-го уровня", hint: "Начисляется за квалифицированного реферала второй линии. Один раз на приглашённого пользователя." },
  legacy_balance_migration: { label: "Начальный перенос баланса", hint: "Служебная запись: перенос текущего баланса XP в журнал начислений, чтобы история сходилась с балансом." },
  spaceport_reward: { label: "Награда Spaceport", hint: "Начисляется при получении подтверждённой награды Spaceport. Стейкинг влияет на XP, но не задаёт ранг пользователя." },
  spaceport_stake_started: { label: "Начало стейкинга NFT", hint: "Событие старта стейкинга NFT. Само по себе XP не приносит — фиксируется для истории." },
  spaceport_staking_milestone: { label: "Веха стейкинга NFT", hint: "Разовое начисление за достигнутую веху по совокупным дням стейкинга (30, 60, 90, 180, 365 дней). Учитывается один раз." },
  spaceport_staking_continuous_30d: { label: "Бонус за непрерывный стейкинг", hint: "Небольшой бонус за каждые полные 30 дней непрерывного стейкинга сверх первого месяца. Есть ограничение за период." },
  spaceport_level_unlocked: { label: "Новый уровень Spaceport", hint: "Разовый бонус за открытие уровня Spaceport. Уровень — это статус стейкинга, а не ранг пользователя." },
  spaceport_badge_unlocked: { label: "Бейдж Spaceport", hint: "Разовый бонус за полученный бейдж или достижение Spaceport." },
  spaceport_stake_broken: { label: "Стейкинг прерван", hint: "Событие прерывания стейкинга. Останавливает будущие вехи, но не забирает уже начисленный XP." },
  spaceport_nft_unstaked: { label: "NFT снят со стейкинга", hint: "Событие снятия NFT со стейкинга. XP не приносит и не забирает." },
};

export const eventLabel = (eventType: string): string =>
  EVENT_META[eventType]?.label || eventType.replace(/_/g, " ");
export const eventHint = (eventType: string): string =>
  EVENT_META[eventType]?.hint || "Событие начисления XP.";

export const GROUP_LABEL: Record<string, string> = {
  activity: "Активность",
  content: "Контент",
  earlyland: "EarlyLand",
  contribution: "Вклад",
  referral: "Рефералы",
  spaceport: "Spaceport",
};

export const SOURCE_LABEL: Record<string, string> = {
  "demo-seed": "Демо-данные",
  "legacy-migration": "Перенос баланса",
  system: "Система",
  admin: "Администратор",
};
export const sourceLabel = (s: string): string => SOURCE_LABEL[s] || s;

export const STATUS_META: Record<string, { label: string; hint: string }> = {
  awarded: { label: "Начислено", hint: "XP начислен и учтён в балансе." },
  pending: { label: "Ожидает", hint: "Начисление ожидает подтверждения. В баланс пока не входит." },
  rejected: { label: "Отклонено", hint: "Начисление отклонено. В баланс не входит." },
  reversed: { label: "Отменено", hint: "Начисление отменено компенсирующей записью. История сохраняется." },
};

export const UNIQUE_OPTIONS: DdOption[] = [
  { value: "none", label: "Нет" },
  { value: "source", label: "По источнику" },
  { value: "entity", label: "По сущности" },
  { value: "day", label: "По дню" },
];

/** Format dates with the single system font (no monospace) in ru-RU. */
export const formatDateTime = (d?: string | null): string =>
  d ? new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
