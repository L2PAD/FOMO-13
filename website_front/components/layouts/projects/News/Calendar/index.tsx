import React, { FC, useMemo, useState } from "react";
import moment from "moment";
import { useRouter } from "next/router";
import { useQuery } from "react-query";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Newspaper,
  ArrowRight,
} from "lucide-react";
import {
  fetchPublicCalendarEvents,
  IPublicCalendarEvent,
} from "../../../../../http/calendar/publicCalendar";
import {
  CalendarRoot,
  ControlsRow,
  FilterPills,
  Pill,
  ViewControls,
  ModeToggle,
  ModeBtn,
  NavGroup,
  Body,
  CalendarPanel,
  HeaderBar,
  MonthTitle,
  WeekHeaderRow,
  MonthGrid,
  DayCell,
  DayNum,
  Chip,
  MoreLink,
  WeekGridWrap,
  WeekCol,
  WeekColHead,
  DayListPanel,
  Aside,
  AsideCard,
  AsideTitle,
  UpcomingItem,
  UpcomingDate,
  UpcomingBody,
  TypeBadge,
  EmptyState,
  ModalOverlay,
  ModalCard,
  MetaGrid,
  CtaButton,
  ModalHead,
  ProjectLogo,
  CtaRow,
  CtaSecondary,
} from "./styles";

type Mode = "Today" | "Week" | "Month";

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface ICategory {
  key: string;
  label: string;
  types: string[];
}

// Public BUZZ calendar categories -> Unified Calendar eventType groups.
const CATEGORIES: ICategory[] = [
  { key: "all", label: "All", types: [] },
  { key: "unlocks", label: "Unlocks", types: ["TOKEN_UNLOCK"] },
  {
    key: "projects",
    label: "Projects",
    types: ["PROJECT_UPDATE", "MAINNET", "TESTNET", "LISTING"],
  },
  { key: "launches", label: "Launches", types: ["LAUNCHPAD", "TGE"] },
  { key: "drops", label: "Drops", types: ["NFT_MINT", "NFT_REVEAL", "AIRDROP"] },
  { key: "market", label: "Market", types: ["NEWS", "LISTING"] },
  {
    key: "fomo",
    label: "FOMO",
    types: ["FOMO_UPDATE", "MAINTENANCE", "ACTIVITY", "DEADLINE"],
  },
];

type Swatch = { accent: string; bg: string; fg: string };

const PALETTE: Record<string, Swatch> = {
  green: { accent: "#17B26A", bg: "#DCFAE6", fg: "#067647" },
  orange: { accent: "#F79009", bg: "#FEF0C7", fg: "#B54708" },
  blue: { accent: "#2970FF", bg: "#D1E0FF", fg: "#004EEB" },
  purple: { accent: "#9E77ED", bg: "#EBE9FE", fg: "#6941C6" },
  red: { accent: "#F04438", bg: "#FEE4E2", fg: "#B42318" },
  teal: { accent: "#15B79E", bg: "#CCFBEF", fg: "#107569" },
  pink: { accent: "#EE46BC", bg: "#FCE7F6", fg: "#C11574" },
  indigo: { accent: "#6172F3", bg: "#E0EAFF", fg: "#3538CD" },
  gray: { accent: "#667085", bg: "#F2F4F7", fg: "#475467" },
};

const swatch = (colorKey?: string): Swatch =>
  PALETTE[(colorKey || "gray") as string] || PALETTE.gray;

const prettyType = (t?: string) =>
  (t || "EVENT").replace(/_/g, " ").toLowerCase();

const compact = (n?: number): string => {
  if (!n && n !== 0) return "";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
};

/* ── event detail modal ─────────────────────────────────────── */
const EventModal: FC<{
  event: IPublicCalendarEvent;
  section: string;
  onClose: () => void;
  onOpenArticle: (articleId: string) => void;
}> = ({ event, section, onClose, onOpenArticle }) => {
  const sw = swatch(event.colorKey);
  const externalUrl = event.ctaUrl || event.sourceUrl;
  const meta: Array<[string, string]> = [];
  if (event.projectName) meta.push(["Project", event.projectName]);
  if (event.tokenSymbol) meta.push(["Token", event.tokenSymbol]);
  if (event.unlockAmount)
    meta.push([
      "Unlock",
      `${compact(event.unlockAmount)}${
        event.tokenSymbol ? ` ${event.tokenSymbol}` : ""
      }`,
    ]);
  if (event.unlockPercent) meta.push(["Supply", `${event.unlockPercent}%`]);
  if (event.unlockValueUsd)
    meta.push(["Value", `$${compact(event.unlockValueUsd)}`]);

  const logoSrc = event.image || event.icon;
  const initial = (event.projectName || event.title || "?").trim().charAt(0).toUpperCase();

  return (
    <ModalOverlay onClick={onClose}>
      <ModalCard onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <ModalHead>
          <ProjectLogo accent={sw.accent}>
            {logoSrc ? <img src={logoSrc} alt={event.projectName || event.title} /> : initial}
          </ProjectLogo>
          <div style={{ minWidth: 0 }}>
            <TypeBadge accent={sw.fg} bg={sw.bg}>
              {prettyType(event.eventType)}
            </TypeBadge>
            {event.projectName ? (
              <div style={{ fontSize: 12, color: "#98a2b3", marginTop: 4 }}>
                {event.projectName}
              </div>
            ) : null}
          </div>
        </ModalHead>
        <h3>{event.title}</h3>
        <div className="m-date">
          {moment(event.startAt).format("dddd, MMMM D, YYYY")}
          {!event.allDay ? ` · ${moment(event.startAt).format("HH:mm")} UTC` : ""}
        </div>
        {(event.description || event.shortDescription) && (
          <p className="m-desc">
            {event.description || event.shortDescription}
          </p>
        )}
        {meta.length > 0 && (
          <MetaGrid>
            {meta.map(([k, v]) => (
              <div key={k}>
                <div className="k">{k}</div>
                <div className="v">{v}</div>
              </div>
            ))}
          </MetaGrid>
        )}
        <CtaRow>
          {event.relatedArticleId ? (
            <CtaButton
              as="button"
              onClick={() => onOpenArticle(event.relatedArticleId as string)}
            >
              <Newspaper size={16} />
              {event.ctaLabel || "Read news"}
              <ArrowRight size={14} />
            </CtaButton>
          ) : externalUrl ? (
            <CtaButton href={externalUrl} target="_blank" rel="noopener noreferrer">
              <Newspaper size={16} />
              {event.ctaLabel || "Read news"}
              <ExternalLink size={14} />
            </CtaButton>
          ) : null}
          {event.relatedArticleId && externalUrl ? (
            <CtaSecondary href={externalUrl} target="_blank" rel="noopener noreferrer">
              Source <ExternalLink size={13} />
            </CtaSecondary>
          ) : null}
        </CtaRow>
      </ModalCard>
    </ModalOverlay>
  );
};

/* ── main component ─────────────────────────────────────────── */
const BuzzCalendar: FC = () => {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("Month");
  const [category, setCategory] = useState<string>("all");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [selected, setSelected] = useState<IPublicCalendarEvent | null>(null);

  // section prefix for in-app news deep-link (e.g. /utility/news/:id)
  const section = useMemo(() => {
    const seg = (router?.asPath || "/crypto").split("?")[0].split("/").filter(Boolean)[0];
    return seg || "crypto";
  }, [router?.asPath]);

  const openArticle = (articleId: string) => {
    setSelected(null);
    router.push(`/${section}/news/${articleId}`);
  };

  const { data: allEvents = [], isLoading } = useQuery(
    ["buzz-calendar-events"],
    () => fetchPublicCalendarEvents({}),
    { staleTime: 60_000 }
  );

  const activeTypes = useMemo(
    () => CATEGORIES.find((c) => c.key === category)?.types || [],
    [category]
  );

  const events = useMemo(() => {
    if (!activeTypes.length) return allEvents;
    const set = new Set(activeTypes);
    return allEvents.filter((e) => set.has((e.eventType || "").toUpperCase()));
  }, [allEvents, activeTypes]);

  const eventsByDay = (day: moment.Moment): IPublicCalendarEvent[] =>
    events
      .filter((e) => moment(e.startAt).isSame(day, "day"))
      .sort((a, b) => moment(a.startAt).diff(moment(b.startAt)));

  // Upcoming (from now forward), respects category filter.
  const upcoming = useMemo(() => {
    const now = moment().startOf("day");
    return events
      .filter((e) => moment(e.startAt).isSameOrAfter(now, "day"))
      .sort((a, b) => moment(a.startAt).diff(moment(b.startAt)))
      .slice(0, 8);
  }, [events]);

  const shift = (dir: number) => {
    const unit = mode === "Month" ? "month" : mode === "Week" ? "week" : "day";
    setAnchor(moment(anchor).add(dir, unit).toDate());
  };

  /* ── grid cells for Month ── */
  const monthCells = useMemo(() => {
    const start = moment(anchor).startOf("month").startOf("week");
    return Array.from({ length: 42 }, (_, i) => start.clone().add(i, "days"));
  }, [anchor]);

  const weekCells = useMemo(() => {
    const start = moment(anchor).startOf("week");
    return Array.from({ length: 7 }, (_, i) => start.clone().add(i, "days"));
  }, [anchor]);

  const headerLabel =
    mode === "Month"
      ? moment(anchor).format("MMMM")
      : mode === "Week"
      ? `${moment(anchor).startOf("week").format("MMM D")} – ${moment(anchor)
          .endOf("week")
          .format("MMM D")}`
      : moment(anchor).format("MMMM D");

  const renderChip = (ev: IPublicCalendarEvent) => {
    const sw = swatch(ev.colorKey);
    return (
      <Chip
        key={ev.id}
        accent={sw.accent}
        bg={sw.bg}
        fg={sw.fg}
        title={ev.title}
        onClick={() => setSelected(ev)}
      >
        {ev.title}
      </Chip>
    );
  };

  const renderMonth = () => (
    <>
      <WeekHeaderRow>
        {WEEK_DAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </WeekHeaderRow>
      <MonthGrid>
        {monthCells.map((day, i) => {
          const dim = day.month() !== moment(anchor).month();
          const isToday = day.isSame(moment(), "day");
          const dayEvents = eventsByDay(day);
          const shown = dayEvents.slice(0, 3);
          const extra = dayEvents.length - shown.length;
          return (
            <DayCell key={i} dim={dim} isToday={isToday}>
              <DayNum dim={dim} isToday={isToday}>
                {day.date()}
              </DayNum>
              {shown.map(renderChip)}
              {extra > 0 && (
                <MoreLink
                  onClick={() => {
                    setAnchor(day.toDate());
                    setMode("Today");
                  }}
                >
                  +{extra} more
                </MoreLink>
              )}
            </DayCell>
          );
        })}
      </MonthGrid>
    </>
  );

  const renderWeek = () => (
    <WeekGridWrap>
      {weekCells.map((day, i) => {
        const isToday = day.isSame(moment(), "day");
        const dayEvents = eventsByDay(day);
        return (
          <WeekCol key={i}>
            <WeekColHead isToday={isToday}>
              <div className="dow">{WEEK_DAYS[day.day()]}</div>
              <div className="num">{day.date()}</div>
            </WeekColHead>
            {dayEvents.map(renderChip)}
          </WeekCol>
        );
      })}
    </WeekGridWrap>
  );

  const renderDay = () => {
    const dayEvents = eventsByDay(moment(anchor));
    if (!dayEvents.length) {
      return (
        <EmptyState>No events on {moment(anchor).format("MMMM D, YYYY")}.</EmptyState>
      );
    }
    return (
      <DayListPanel>
        {dayEvents.map((ev) => {
          const sw = swatch(ev.colorKey);
          return (
            <UpcomingItem key={ev.id} onClick={() => setSelected(ev)}>
              <UpcomingDate accent={sw.accent}>
                <div className="mon">{moment(ev.startAt).format("MMM")}</div>
                <div className="day">{moment(ev.startAt).format("D")}</div>
              </UpcomingDate>
              <UpcomingBody>
                <p className="u-title">{ev.title}</p>
                <div className="u-meta">
                  <TypeBadge accent={sw.fg} bg={sw.bg}>
                    {prettyType(ev.eventType)}
                  </TypeBadge>
                  {ev.shortDescription ? <span>{ev.shortDescription}</span> : null}
                </div>
              </UpcomingBody>
            </UpcomingItem>
          );
        })}
      </DayListPanel>
    );
  };

  return (
    <CalendarRoot>
      <ControlsRow>
        <FilterPills>
          {CATEGORIES.map((c) => (
            <Pill
              key={c.key}
              isActive={category === c.key}
              onClick={() => setCategory(c.key)}
            >
              {c.label}
            </Pill>
          ))}
        </FilterPills>
        <ViewControls>
          <ModeToggle>
            {(["Today", "Week", "Month"] as Mode[]).map((m) => (
              <ModeBtn
                key={m}
                isActive={mode === m}
                onClick={() => {
                  if (m === "Today") setAnchor(new Date());
                  setMode(m);
                }}
              >
                {m}
              </ModeBtn>
            ))}
          </ModeToggle>
          <NavGroup>
            <button onClick={() => shift(-1)} aria-label="Previous">
              <ChevronLeft size={18} />
            </button>
            <button className="today-btn" onClick={() => setAnchor(new Date())}>
              Today
            </button>
            <button onClick={() => shift(1)} aria-label="Next">
              <ChevronRight size={18} />
            </button>
          </NavGroup>
        </ViewControls>
      </ControlsRow>

      <Body>
        <CalendarPanel>
          <HeaderBar>
            <MonthTitle>
              {headerLabel} <span>{moment(anchor).format("YYYY")}</span>
            </MonthTitle>
          </HeaderBar>
          {isLoading ? (
            <EmptyState>Loading events…</EmptyState>
          ) : mode === "Month" ? (
            renderMonth()
          ) : mode === "Week" ? (
            renderWeek()
          ) : (
            renderDay()
          )}
        </CalendarPanel>

        <Aside>
          <AsideCard>
            <AsideTitle>
              Upcoming <small>next events</small>
            </AsideTitle>
            {upcoming.length === 0 ? (
              <EmptyState>No upcoming events.</EmptyState>
            ) : (
              upcoming.map((ev) => {
                const sw = swatch(ev.colorKey);
                const metaBits: string[] = [];
                if (ev.unlockAmount)
                  metaBits.push(
                    `${compact(ev.unlockAmount)}${
                      ev.tokenSymbol ? ` ${ev.tokenSymbol}` : ""
                    }`
                  );
                if (ev.unlockPercent) metaBits.push(`${ev.unlockPercent}%`);
                if (!metaBits.length && ev.projectName)
                  metaBits.push(ev.projectName);
                return (
                  <UpcomingItem key={ev.id} onClick={() => setSelected(ev)}>
                    <UpcomingDate accent={sw.accent}>
                      <div className="mon">
                        {moment(ev.startAt).format("MMM")}
                      </div>
                      <div className="day">
                        {moment(ev.startAt).format("D")}
                      </div>
                    </UpcomingDate>
                    <UpcomingBody>
                      <p className="u-title">{ev.title}</p>
                      <div className="u-meta">
                        <TypeBadge accent={sw.fg} bg={sw.bg}>
                          {prettyType(ev.eventType)}
                        </TypeBadge>
                        {metaBits.length ? <span>{metaBits.join(" · ")}</span> : null}
                      </div>
                    </UpcomingBody>
                  </UpcomingItem>
                );
              })
            )}
          </AsideCard>
        </Aside>
      </Body>

      {selected && (
        <EventModal
          event={selected}
          section={section}
          onClose={() => setSelected(null)}
          onOpenArticle={openArticle}
        />
      )}
    </CalendarRoot>
  );
};

export default BuzzCalendar;
