import styled from "styled-components";

export const CalendarRoot = styled.div`
  width: 100%;
  margin-top: 8px;
`;

/* ── top controls ─────────────────────────────────────────── */
export const ControlsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
`;

export const FilterPills = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const Pill = styled.button<{ isActive: boolean }>`
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid
    ${({ isActive }) => (isActive ? "#04a584" : "var(--color-border-subtle, #eef1f5)")};
  background: ${({ isActive }) => (isActive ? "#04a584" : "#ffffff")};
  color: ${({ isActive }) => (isActive ? "#ffffff" : "#4a5567")};
  font-size: 13px;
  font-weight: var(--font-weight-semibold, 600);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #04a584;
    color: ${({ isActive }) => (isActive ? "#ffffff" : "#04a584")};
  }
`;

export const ViewControls = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

export const ModeToggle = styled.div`
  display: flex;
  gap: 4px;
  padding: 4px;
  background: #f4f5f7;
  border-radius: 8px;
`;

export const ModeBtn = styled.button<{ isActive: boolean }>`
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: var(--font-weight-semibold, 600);
  color: ${({ isActive }) => (isActive ? "#04a584" : "#738094")};
  background: ${({ isActive }) => (isActive ? "#ffffff" : "transparent")};
  box-shadow: ${({ isActive }) => (isActive ? "0 1px 2px rgba(16,24,40,0.06)" : "none")};
  cursor: pointer;
  transition: all 0.15s ease;
`;

export const NavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    border: 1px solid var(--color-border-subtle, #eef1f5);
    background: #ffffff;
    color: #4a5567;
    cursor: pointer;
    transition: all 0.15s ease;

    &:hover {
      border-color: #04a584;
      color: #04a584;
    }
  }

  .today-btn {
    width: auto;
    padding: 0 14px;
    font-size: 13px;
    font-weight: var(--font-weight-semibold, 600);
  }
`;

export const MonthTitle = styled.h2`
  font-size: 22px;
  font-weight: var(--font-weight-semibold, 600);
  color: #070b35;
  margin: 0 8px 0 0;

  span {
    font-weight: var(--font-weight-regular, 400);
    color: #738094;
    margin-left: 6px;
  }
`;

/* ── main layout: grid + aside ────────────────────────────── */
export const Body = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 20px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

export const CalendarPanel = styled.div`
  background: #ffffff;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  border-radius: 14px;
  overflow: hidden;
`;

export const HeaderBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-border-subtle, #eef1f5);
`;

/* month grid */
export const WeekHeaderRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);

  div {
    text-align: center;
    font-size: 12px;
    font-weight: var(--font-weight-medium, 500);
    color: #738094;
    padding: 12px 4px;
    background: #f9fafb;
    border-bottom: 1px solid var(--color-border-subtle, #eef1f5);
  }
`;

export const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
`;

export const DayCell = styled.div<{ dim?: boolean; isToday?: boolean }>`
  min-height: 116px;
  min-width: 0;
  overflow: hidden;
  padding: 8px 8px 6px;
  border-right: 1px solid var(--color-border-subtle, #eef1f5);
  border-bottom: 1px solid var(--color-border-subtle, #eef1f5);
  background: ${({ dim }) => (dim ? "#fbfbfc" : "#ffffff")};
  display: flex;
  flex-direction: column;
  gap: 4px;

  &:nth-child(7n) {
    border-right: none;
  }
`;

export const DayNum = styled.div<{ dim?: boolean; isToday?: boolean }>`
  align-self: flex-end;
  font-size: 12px;
  font-weight: ${({ isToday }) => (isToday ? 600 : 400)};
  color: ${({ isToday, dim }) =>
    isToday ? "#ffffff" : dim ? "#c0ccd0" : "#4a5567"};
  width: ${({ isToday }) => (isToday ? "20px" : "auto")};
  height: ${({ isToday }) => (isToday ? "20px" : "auto")};
  border-radius: 50%;
  background: ${({ isToday }) => (isToday ? "#070b35" : "transparent")};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Chip = styled.button<{ accent: string; bg: string; fg: string }>`
  position: relative;
  width: 100%;
  text-align: left;
  padding: 4px 6px 4px 10px;
  border-radius: 5px;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  font-size: 11px;
  font-weight: var(--font-weight-semibold, 600);
  line-height: 14px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.15s ease;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background: ${({ accent }) => accent};
    border-radius: 3px 0 0 3px;
  }

  &:hover {
    opacity: 0.82;
  }
`;

export const MoreLink = styled.button`
  border: none;
  background: none;
  text-align: left;
  font-size: 11px;
  font-weight: var(--font-weight-semibold, 600);
  color: #04a584;
  cursor: pointer;
  padding: 0 6px;
`;

/* week + day list */
export const DayListPanel = styled.div`
  padding: 8px 4px;
`;

export const WeekGridWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
`;

export const WeekCol = styled.div`
  border-right: 1px solid var(--color-border-subtle, #eef1f5);
  min-height: 320px;
  min-width: 0;
  overflow: hidden;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;

  &:last-child {
    border-right: none;
  }
`;

export const WeekColHead = styled.div<{ isToday?: boolean }>`
  text-align: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-subtle, #eef1f5);
  margin-bottom: 4px;

  .dow {
    font-size: 11px;
    color: #738094;
    text-transform: uppercase;
  }
  .num {
    font-size: 16px;
    font-weight: var(--font-weight-semibold, 600);
    color: ${({ isToday }) => (isToday ? "#04a584" : "#070b35")};
  }
`;

/* ── aside: upcoming ──────────────────────────────────────── */
export const Aside = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const AsideCard = styled.div`
  background: #ffffff;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  border-radius: 14px;
  padding: 18px;
`;

export const AsideTitle = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold, 600);
  color: #070b35;
  margin: 0 0 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  small {
    font-size: 12px;
    font-weight: var(--font-weight-regular, 400);
    color: #738094;
  }
`;

export const UpcomingItem = styled.button`
  width: 100%;
  text-align: left;
  display: flex;
  gap: 12px;
  padding: 10px 0;
  border: none;
  background: none;
  border-bottom: 1px solid #f2f4f7;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover .u-title {
    color: #04a584;
  }
`;

export const UpcomingDate = styled.div<{ accent: string }>`
  flex-shrink: 0;
  width: 46px;
  text-align: center;
  border-left: 3px solid ${({ accent }) => accent};
  padding-left: 8px;

  .mon {
    font-size: 10px;
    text-transform: uppercase;
    color: #738094;
    font-weight: var(--font-weight-semibold, 600);
  }
  .day {
    font-size: 18px;
    font-weight: var(--font-weight-semibold, 600);
    color: #070b35;
    line-height: 20px;
  }
`;

export const UpcomingBody = styled.div`
  min-width: 0;

  .u-title {
    font-size: 13px;
    font-weight: var(--font-weight-semibold, 600);
    color: #070b35;
    margin: 0 0 3px;
    transition: color 0.15s ease;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .u-meta {
    font-size: 12px;
    color: #738094;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }
`;

export const TypeBadge = styled.span<{ accent: string; bg: string }>`
  display: inline-flex;
  align-items: center;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: var(--font-weight-semibold, 600);
  color: ${({ accent }) => accent};
  background: ${({ bg }) => bg};
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

export const EmptyState = styled.div`
  padding: 40px 16px;
  text-align: center;
  color: #738094;
  font-size: 14px;
`;

/* ── detail modal ─────────────────────────────────────────── */
export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(7, 11, 53, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
`;

export const ModalCard = styled.div`
  width: 100%;
  max-width: 440px;
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  position: relative;
  box-shadow: 0 20px 48px rgba(16, 24, 40, 0.18);

  .close {
    position: absolute;
    top: 16px;
    right: 16px;
    border: none;
    background: none;
    color: #98a2b3;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
  }

  h3 {
    font-size: 20px;
    font-weight: var(--font-weight-semibold, 600);
    color: #070b35;
    margin: 14px 0 6px;
    padding-right: 24px;
  }

  .m-date {
    font-size: 13px;
    color: #04a584;
    font-weight: var(--font-weight-semibold, 600);
    margin-bottom: 14px;
  }

  .m-desc {
    font-size: 14px;
    line-height: 20px;
    color: #4a5567;
    margin-bottom: 16px;
  }
`;

export const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 16px;
  margin-bottom: 18px;

  .k {
    font-size: 11px;
    text-transform: uppercase;
    color: #98a2b3;
    letter-spacing: 0.03em;
  }
  .v {
    font-size: 14px;
    font-weight: var(--font-weight-semibold, 600);
    color: #070b35;
  }
`;

export const CtaButton = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;
  height: 44px;
  border-radius: 10px;
  background: #04a584;
  color: #ffffff;
  font-size: 14px;
  font-weight: var(--font-weight-semibold, 600);
  cursor: pointer;
  text-decoration: none;
  transition: opacity 0.15s ease;

  &:hover {
    opacity: 0.9;
  }
`;


/* ── modal header with project logo ───────────────────────── */
export const ModalHead = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

export const ProjectLogo = styled.div<{ accent?: string }>`
  width: 46px;
  height: 46px;
  min-width: 46px;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ accent }) => (accent ? `${accent}1A` : "#f2f4f7")};
  color: ${({ accent }) => accent || "#667085"};
  font-weight: 700;
  font-size: 18px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const CtaRow = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

export const CtaSecondary = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 44px;
  padding: 0 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  color: #4a5567;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: border-color 0.15s ease, color 0.15s ease;

  &:hover {
    border-color: #04a584;
    color: #04a584;
  }
`;

/* ── digests panel ────────────────────────────────────────── */
export const DigestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const DigestCard = styled.button`
  text-align: left;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  border-radius: 12px;
  background: #ffffff;
  padding: 12px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: border-color 0.15s ease, transform 0.15s ease;

  &:hover {
    border-color: #04a584;
    transform: translateY(-1px);
  }
`;

export const DigestCover = styled.div<{ src?: string }>`
  width: 100%;
  height: 96px;
  border-radius: 8px;
  background: ${({ src }) =>
    src
      ? `#eef1f5 url(${src}) center/cover no-repeat`
      : "linear-gradient(135deg, #04a58422, #6172f322)"};
`;

export const DigestBadge = styled.span<{ outlook?: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: ${({ outlook }) =>
    outlook === "BULLISH" ? "#067647" : outlook === "BEARISH" ? "#B42318" : outlook === "MIXED" ? "#B54708" : "#475467"};
  background: ${({ outlook }) =>
    outlook === "BULLISH" ? "#DCFAE6" : outlook === "BEARISH" ? "#FEE4E2" : outlook === "MIXED" ? "#FEF0C7" : "#F2F4F7"};
`;

export const DigestTitle = styled.p`
  font-size: 14px;
  font-weight: 700;
  color: #070b35;
  margin: 0;
  line-height: 19px;
`;

export const DigestMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #98a2b3;
`;

export const DigestSummary = styled.p`
  font-size: 12.5px;
  color: #667085;
  line-height: 18px;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

/* digest reader modal */
export const ReaderCard = styled(ModalCard)`
  max-width: 760px;
  max-height: 86vh;
  overflow-y: auto;
`;

export const ReaderCover = styled.div<{ src?: string }>`
  width: 100%;
  height: 200px;
  border-radius: 12px;
  margin-bottom: 16px;
  background: ${({ src }) =>
    src
      ? `#eef1f5 url(${src}) center/cover no-repeat`
      : "linear-gradient(135deg, #04a58422, #6172f322)"};
`;

export const ReaderBody = styled.div`
  font-size: 15px;
  line-height: 24px;
  color: #344054;

  h3 { font-size: 18px; font-weight: 700; color: #070b35; margin: 18px 0 8px; }
  h4 { font-size: 15px; font-weight: 700; color: #070b35; margin: 14px 0 6px; }
  p { margin: 0 0 12px; }
  ul, ol { margin: 0 0 12px 18px; }
  li { margin-bottom: 6px; }
  a { color: #04a584; text-decoration: underline; }
  img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
  iframe { max-width: 100%; border-radius: 8px; }
`;
