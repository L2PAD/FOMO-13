import styled, { css, keyframes } from 'styled-components';

export const PageWrapper = styled.div`
  width: min(1480px, calc(100% - 32px));
  margin: 19px auto 48px;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 16px 0;

  @media(max-width: 768px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const PageTitle = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 40px;
  line-height: 48px;
`;

export const PageSubtitle = styled.p`
  margin-top: 4px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-medium);
  font-size: 13px;
`;

export const SearchWrapper = styled.form`
  display: flex;
  align-items: center;
  gap: 8px;

  @media(max-width: 768px) {
    width: 100%;
  }
`;

export const SearchInput = styled.input`
  width: 320px;
  height: 40px;
  border: 1px solid rgba(83, 98, 124, 0.16);
  border-radius: 8px;
  padding: 0 14px;
  font-weight: var(--font-weight-medium);
  font-size: 14px;
  color: var(--color-text-primary);
  outline: none;

  &:focus { border-color: var(--color-primary); }
  @media(max-width: 768px) { width: 100%; }
`;

export const SearchButton = styled.button`
  height: 40px;
  border: none;
  border-radius: 8px;
  padding: 0 18px;
  background: var(--color-primary);
  color: var(--color-white);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  cursor: pointer;
`;

export const CountTabs = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  margin: 12px 0;
  padding-bottom: 2px;
`;

export const CountTab = styled.button<{ $active?: boolean }>`
  flex: 0 0 auto;
  height: 36px;
  border: 1px solid ${({ $active }) => ($active ? 'var(--color-primary)' : 'rgba(83, 98, 124, 0.14)')};
  border-radius: 18px;
  padding: 0 14px;
  background: ${({ $active }) => ($active ? 'rgba(4, 165, 132, 0.09)' : 'var(--color-white)')};
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text-primary)')};
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
`;

export const FiltersCard = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr)) auto auto;
  gap: 10px;
  align-items: end;
  margin-bottom: 18px;
  padding: 14px;
  border: 1px solid rgba(83, 98, 124, 0.08);
  border-radius: 8px;
  background: var(--color-white);

  @media(max-width: 900px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media(max-width: 560px) { grid-template-columns: 1fr; }
`;

export const TableWrapper = styled.div`width: 100%;`;

export const HeaderRow = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1.7fr) 125px 115px 105px 100px 125px 110px 80px;
  gap: 10px;
  padding: 8px 16px;

  div {
    font-weight: var(--font-weight-regular);
    font-size: 12px;
    line-height: 14px;
    color: var(--color-text-muted);
  }

  @media(max-width: 1080px) { display: none; }
`;

export const ActivityRow = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1.7fr) 125px 115px 105px 100px 125px 110px 80px;
  gap: 10px;
  align-items: center;
  min-height: 72px;
  padding: 10px 16px;
  margin-bottom: 10px;
  background: var(--color-white);
  border: 1px solid rgba(83, 98, 124, 0.07);
  box-shadow: 4px 4px 0 #EEEEEE;
  border-radius: 8px;

  @media(max-width: 1080px) {
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
  }
`;

export const ProjectCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

export const Logo = styled.div`
  width: 40px;
  min-width: 40px;
  height: 40px;
  border-radius: 100px;
  overflow: hidden;
  background: var(--color-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  font-size: 13px;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const ProjectTitle = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 18px;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProjectMeta = styled.p`
  margin-top: 2px;
  font-weight: var(--font-weight-medium);
  font-size: 12px;
  line-height: 15px;
  color: var(--color-text-muted);
`;

export const Cell = styled.div`
  min-width: 0;
  font-weight: var(--font-weight-semibold);
  font-size: 13px;
  line-height: 18px;
  color: var(--color-text-primary);
`;

export const MutedText = styled.span`color: var(--color-text-muted);`;

const badgeColors: Record<string, { color: string; background: string }> = {
  green: { color: '#027E66', background: 'rgba(4, 165, 132, 0.11)' },
  yellow: { color: '#9B7300', background: 'rgba(255, 199, 4, 0.17)' },
  red: { color: '#C43249', background: 'rgba(221, 66, 90, 0.11)' },
  blue: { color: '#3568C7', background: 'rgba(65, 115, 210, 0.10)' },
  gray: { color: '#657189', background: 'rgba(83, 98, 124, 0.09)' },
};

export const StatusBadge = styled.span<{ $tone?: string }>`
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  max-width: 100%;
  border-radius: 13px;
  padding: 4px 9px;
  color: ${({ $tone = 'gray' }) => (badgeColors[$tone] || badgeColors.gray).color};
  background: ${({ $tone = 'gray' }) => (badgeColors[$tone] || badgeColors.gray).background};
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 14px;
  text-transform: capitalize;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const OpenButton = styled.button`
  height: 32px;
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  padding: 0 12px;
  background: var(--color-white);
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 13px;
  cursor: pointer;
`;

export const PaginationWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 14px;
`;

export const PaginationButton = styled.button`
  height: 36px;
  border: 1px solid rgba(83, 98, 124, 0.16);
  border-radius: 8px;
  padding: 0 14px;
  background: var(--color-white);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;

  &:disabled { opacity: 0.45; cursor: not-allowed; }
`;

export const EmptyText = styled.p`
  padding: 24px 16px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
`;

export const ErrorText = styled.p`
  margin-bottom: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #C43249;
  background: rgba(221, 66, 90, 0.08);
  font-weight: var(--font-weight-semibold);
`;

export const BackButton = styled.button`
  border: none;
  padding: 0;
  background: transparent;
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
`;

export const EditorHeader = styled.div`
  margin: 14px 0 14px;
  padding: 22px;
  border: 1px solid rgba(83, 98, 124, 0.10);
  border-radius: 18px;
  background:
    radial-gradient(circle at 88% 0%, rgba(4, 165, 132, 0.11), transparent 32%),
    linear-gradient(135deg, #FFFFFF 0%, #FBFDFC 100%);
  box-shadow: 0 16px 40px rgba(7, 11, 53, 0.07);
`;

export const EditorHeaderTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;

  @media(max-width: 760px) { flex-direction: column; }
`;

export const EditorIdentity = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
`;

export const EditorLogo = styled.div`
  position: relative;
  display: flex;
  flex: 0 0 64px;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border: 1px solid rgba(83, 98, 124, 0.10);
  border-radius: 16px;
  background: linear-gradient(145deg, rgba(4, 165, 132, 0.11), rgba(65, 115, 210, 0.08));
  color: var(--color-primary);
  font-size: 18px;
  font-weight: var(--font-weight-semibold);

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: var(--color-white);
  }

  @media(max-width: 560px) {
    flex-basis: 52px;
    width: 52px;
    height: 52px;
    border-radius: 13px;
  }
`;

export const EditorHeaderActions = styled.div`
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
`;

export const EditorExternalLink = styled.a`
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  border: 1px solid rgba(83, 98, 124, 0.16);
  border-radius: 8px;
  padding: 0 12px;
  background: var(--color-white);
  color: var(--color-text-primary);
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  text-decoration: none;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }
`;

export const EditorTitleRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
`;

export const EditorStatusRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  gap: 7px;
  margin-top: 10px;
`;

export const EditorSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(83, 98, 124, 0.08);

  @media(max-width: 1180px) { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  @media(max-width: 680px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

export const EditorSummaryItem = styled.div`
  min-width: 0;
  padding: 2px 16px;
  border-left: 1px solid rgba(83, 98, 124, 0.08);

  &:first-child { border-left: none; padding-left: 0; }

  @media(max-width: 1180px) {
    padding-top: 9px;
    padding-bottom: 9px;
    &:nth-child(4) { border-left: none; padding-left: 0; }
  }

  @media(max-width: 680px) {
    &:nth-child(3), &:nth-child(5) { border-left: none; padding-left: 0; }
    &:nth-child(4) { border-left: 1px solid rgba(83, 98, 124, 0.08); padding-left: 16px; }
  }
`;

export const EditorSummaryLabel = styled.span`
  display: block;
  margin-bottom: 5px;
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.06em;
  line-height: 13px;
  text-transform: uppercase;
`;

export const EditorSummaryValue = styled.span`
  display: block;
  overflow: hidden;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const EditorWorkspace = styled.div`
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr);
  gap: 20px;
  align-items: start;

  @media(max-width: 1220px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionNavigation = styled.nav`
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border: 1px solid rgba(83, 98, 124, 0.09);
  border-radius: 14px;
  background: var(--color-white);
  box-shadow: 0 8px 24px rgba(7, 11, 53, 0.045);

  @media(max-width: 1220px) {
    position: static;
    flex-direction: row;
    overflow-x: auto;
    padding: 8px;
    scrollbar-width: thin;
  }
`;

export const SectionNavigationCaption = styled.p`
  margin: 2px 8px 8px;
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;

  @media(max-width: 1220px) { display: none; }
`;

export const SectionNavigationButton = styled.button<{ $active?: boolean }>`
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 56px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(4, 165, 132, 0.24)' : 'transparent')};
  border-radius: 10px;
  padding: 8px 10px;
  background: ${({ $active }) => ($active ? 'rgba(4, 165, 132, 0.08)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text-primary)')};
  text-align: left;
  cursor: pointer;

  &:hover,
  &:focus-visible {
    border-color: rgba(4, 165, 132, 0.22);
    background: rgba(4, 165, 132, 0.055);
    color: var(--color-primary);
    outline: none;
  }

  @media(max-width: 1220px) {
    flex: 0 0 176px;
    min-height: 50px;
  }
`;

export const SectionNavigationIndex = styled.span<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: ${({ $active }) => ($active ? 'var(--color-primary)' : 'rgba(83, 98, 124, 0.08)')};
  color: ${({ $active }) => ($active ? '#FFFFFF' : 'var(--color-text-muted)')};
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
`;

export const SectionNavigationText = styled.span`
  display: block;
  min-width: 0;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
`;

export const SectionNavigationHint = styled.span`
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  line-height: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const EditorGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 20px;
  align-items: start;

  @media(max-width: 960px) { grid-template-columns: 1fr; }
`;

export const EditorColumn = styled.div<{ $sticky?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  ${({ $sticky }) => ($sticky ? `
    position: sticky;
    top: 16px;
    max-height: calc(100vh - 32px);
    overflow-y: auto;
    padding-right: 4px;
    scrollbar-width: thin;
  ` : '')}

  @media(max-width: 960px) {
    position: static;
    max-height: none;
    overflow: visible;
    padding-right: 0;
  }
`;

export const SectionCard = styled.section`
  scroll-margin-top: 20px;
  border: 1px solid rgba(83, 98, 124, 0.09);
  border-radius: 14px;
  padding: 22px;
  background: var(--color-white);
  box-shadow: 0 8px 24px rgba(7, 11, 53, 0.04);

  @media(max-width: 560px) { padding: 16px; }
`;

export const EditorSectionStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

export const SectionHero = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 92px;
  padding: 19px 21px;
  border: 1px solid rgba(4, 165, 132, 0.13);
  border-radius: 14px;
  background:
    radial-gradient(circle at 96% 0%, rgba(65, 115, 210, 0.12), transparent 38%),
    linear-gradient(135deg, rgba(4, 165, 132, 0.10), rgba(4, 165, 132, 0.035));
`;

export const SectionHeroIndex = styled.span`
  display: inline-flex;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: var(--color-primary);
  box-shadow: 0 8px 18px rgba(4, 165, 132, 0.20);
  color: #FFFFFF;
  font-size: 15px;
  font-weight: var(--font-weight-semibold);
`;

export const SectionHeroKicker = styled.span`
  display: block;
  margin-bottom: 3px;
  color: var(--color-primary);
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const SectionHeroTitle = styled.h1`
  color: var(--color-text-primary);
  font-size: 22px;
  font-weight: var(--font-weight-semibold);
  line-height: 27px;
`;

export const SectionPager = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 2px;

  @media(max-width: 560px) { align-items: stretch; flex-direction: column; }
`;

export const SectionPagerStatus = styled.span`
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const SectionPagerActions = styled.div`
  display: flex;
  gap: 8px;
`;

export const SectionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
`;

export const SectionTitle = styled.h2`
  color: var(--color-text-primary);
  font-size: 17px;
  line-height: 22px;
  font-weight: var(--font-weight-semibold);
`;

export const SectionHint = styled.p`
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 17px;
`;

export const FieldsGrid = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $columns = 2 }) => $columns}, minmax(0, 1fr));
  gap: 15px 13px;

  @media(max-width: 680px) { grid-template-columns: 1fr; }
`;

export const Field = styled.label<{ $full?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  ${({ $full }) => ($full ? 'grid-column: 1 / -1;' : '')}
`;

export const FieldLabel = styled.span`
  color: var(--color-text-muted);
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
`;

const controlCss = css`
  width: 100%;
  border: 1px solid rgba(83, 98, 124, 0.16);
  border-radius: 8px;
  background: var(--color-white);
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  outline: none;

  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;

  &:hover:not(:disabled) { border-color: rgba(4, 165, 132, 0.42); }
  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(4, 165, 132, 0.10);
  }
  &:disabled { background: rgba(83, 98, 124, 0.05); cursor: not-allowed; }
`;

export const Input = styled.input`
  ${controlCss}
  height: 40px;
  padding: 0 12px;
`;

export const Select = styled.select`
  ${controlCss}
  height: 40px;
  padding: 0 10px;
`;

export const Textarea = styled.textarea<{ $large?: boolean }>`
  ${controlCss}
  min-height: ${({ $large }) => ($large ? '170px' : '96px')};
  padding: 11px 12px;
  line-height: 20px;
  resize: vertical;
`;

export const HtmlPair = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  grid-column: 1 / -1;

  @media(max-width: 760px) { grid-template-columns: 1fr; }
`;

export const HtmlPreview = styled.iframe`
  width: 100%;
  min-height: 170px;
  border: 1px solid rgba(83, 98, 124, 0.16);
  border-radius: 8px;
  background: var(--color-white);
`;

export const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 42px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(83, 98, 124, 0.07);

  &:last-child { border-bottom: none; }
`;

export const InlineRow = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;

  > :first-child { flex: 1; }
`;

export const SmallButton = styled.button<{ $danger?: boolean }>`
  min-height: 34px;
  border: 1px solid ${({ $danger }) => ($danger ? 'rgba(221, 66, 90, 0.28)' : 'rgba(83, 98, 124, 0.16)')};
  border-radius: 8px;
  padding: 0 11px;
  background: var(--color-white);
  color: ${({ $danger }) => ($danger ? '#C43249' : 'var(--color-text-primary)')};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const StepCard = styled.div`
  margin-top: 12px;
  padding: 14px;
  border: 1px solid rgba(83, 98, 124, 0.11);
  border-radius: 8px;
  background: rgba(83, 98, 124, 0.025);
`;

export const AdvancedDetails = styled.details`
  border: 1px dashed rgba(83, 98, 124, 0.20);
  border-radius: 12px;
  background: rgba(83, 98, 124, 0.025);

  & + & { margin-top: 10px; }

  &[open] > summary::after { transform: rotate(180deg); }
`;

export const AdvancedSummary = styled.summary`
  position: relative;
  padding: 15px 44px 15px 16px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  list-style: none;
  cursor: pointer;

  &::-webkit-details-marker { display: none; }
  &::after {
    position: absolute;
    top: 17px;
    right: 17px;
    color: var(--color-text-muted);
    content: '⌄';
    transition: transform 0.18s ease;
  }
`;

export const AdvancedSummaryHint = styled.span`
  display: block;
  margin-top: 3px;
  color: var(--color-text-muted);
  font-size: 11px;
  font-weight: var(--font-weight-medium);
`;

export const AdvancedBody = styled.div`
  padding: 2px 16px 16px;
`;

export const CandidateCard = styled.div<{ $selected?: boolean }>`
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid ${({ $selected }) => ($selected ? 'var(--color-primary)' : 'rgba(83, 98, 124, 0.12)')};
  border-radius: 8px;
  background: ${({ $selected }) => ($selected ? 'rgba(4, 165, 132, 0.04)' : 'var(--color-white)')};
`;

export const CandidateTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
`;

export const CandidateMeta = styled.p`
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: 11px;
  line-height: 16px;
  overflow-wrap: anywhere;
`;

export const AiChange = styled.label`
  display: grid;
  grid-template-columns: 20px minmax(0, 1fr);
  gap: 8px;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid rgba(83, 98, 124, 0.10);
  border-radius: 8px;
  cursor: pointer;
`;

export const CodeValue = styled.pre`
  max-height: 130px;
  overflow: auto;
  margin-top: 5px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(83, 98, 124, 0.06);
  color: var(--color-text-primary);
  font-size: 11px;
  line-height: 15px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const ActionBar = styled.div`
  position: sticky;
  bottom: 10px;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-top: 20px;
  padding: 12px 14px;
  border: 1px solid rgba(83, 98, 124, 0.12);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 12px 38px rgba(7, 11, 53, 0.14);
  backdrop-filter: blur(10px);

  @media(max-width: 900px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const ActionBarStatus = styled.div<{ $dirty?: boolean }>`
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 150px;
  color: ${({ $dirty }) => ($dirty ? '#B78300' : 'var(--color-primary)')};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);

  &::before {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
    content: '';
  }
`;

export const ActionBarActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  @media(max-width: 900px) { justify-content: flex-start; }
`;

export const ActionBarDivider = styled.span`
  width: 1px;
  height: 28px;
  margin: 0 2px;
  background: rgba(83, 98, 124, 0.12);

  @media(max-width: 680px) { display: none; }
`;

type ActionTone = 'primary' | 'success' | 'danger' | 'warning' | 'neutral';

const actionTone = (tone: ActionTone) => {
  if (tone === 'success') return { bg: '#04A584', border: '#04A584', color: '#fff' };
  if (tone === 'danger') return { bg: '#fff', border: '#DD425A', color: '#C43249' };
  if (tone === 'warning') return { bg: '#fff', border: '#D79B00', color: '#9B7300' };
  if (tone === 'neutral') return { bg: '#fff', border: 'rgba(83, 98, 124, 0.18)', color: 'var(--color-text-primary)' };
  return { bg: 'var(--color-primary)', border: 'var(--color-primary)', color: '#fff' };
};

export const ActionButton = styled.button<{ $tone?: ActionTone }>`
  height: 40px;
  border: 1px solid ${({ $tone = 'primary' }) => actionTone($tone).border};
  border-radius: 8px;
  padding: 0 15px;
  background: ${({ $tone = 'primary' }) => actionTone($tone).bg};
  color: ${({ $tone = 'primary' }) => actionTone($tone).color};
  font-weight: var(--font-weight-semibold);
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const JsonError = styled.p`
  margin-top: 5px;
  color: #C43249;
  font-size: 11px;
`;

export const AiAssistantHero = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  padding: 13px;
  border: 1px solid rgba(65, 115, 210, 0.13);
  border-radius: 11px;
  background: linear-gradient(135deg, rgba(65, 115, 210, 0.09), rgba(4, 165, 132, 0.055));
`;

export const AiAssistantIcon = styled.span`
  display: inline-flex;
  flex: 0 0 36px;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 11px;
  background: linear-gradient(135deg, #3568C7, #04A584);
  color: #FFFFFF;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
`;

export const AiAssistantTitle = styled.p`
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  line-height: 17px;
`;

export const AiAssistantActions = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  @media(max-width: 960px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
`;

export const AiReviewButton = styled.button<{ $primary?: boolean }>`
  min-height: 38px;
  border: 1px solid ${({ $primary }) => ($primary ? 'var(--color-primary)' : 'rgba(83, 98, 124, 0.16)')};
  border-radius: 9px;
  padding: 0 12px;
  background: ${({ $primary }) => ($primary ? 'var(--color-primary)' : '#FFFFFF')};
  color: ${({ $primary }) => ($primary ? '#FFFFFF' : 'var(--color-text-primary)')};
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export const AiModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99999999999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(8, 16, 34, 0.64);
  backdrop-filter: blur(7px);

  @media(max-width: 720px) { padding: 0; }
`;

export const AiModalDialog = styled.div`
  display: flex;
  flex-direction: column;
  width: min(1460px, 100%);
  height: min(900px, calc(100vh - 40px));
  overflow: hidden;
  border: 1px solid rgba(83, 98, 124, 0.13);
  border-radius: 18px;
  background: #F7F9FC;
  box-shadow: 0 28px 90px rgba(5, 13, 33, 0.34);

  @media(max-width: 720px) {
    height: 100vh;
    border: none;
    border-radius: 0;
  }
`;

export const AiModalHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px 18px;
  border-bottom: 1px solid rgba(83, 98, 124, 0.10);
  background:
    radial-gradient(circle at 88% 0%, rgba(4, 165, 132, 0.13), transparent 36%),
    #FFFFFF;
`;

export const AiModalHeading = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 13px;
  min-width: 0;
`;

export const AiModalTitle = styled.h2`
  color: var(--color-text-primary);
  font-size: 23px;
  font-weight: var(--font-weight-semibold);
  line-height: 28px;
`;

export const AiModalSubtitle = styled.p`
  max-width: 820px;
  margin-top: 4px;
  color: var(--color-text-muted);
  font-size: 12px;
  line-height: 17px;
`;

export const AiModalClose = styled.button`
  display: inline-flex;
  flex: 0 0 38px;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(83, 98, 124, 0.14);
  border-radius: 10px;
  background: #FFFFFF;
  color: var(--color-text-primary);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
`;

export const AiModalMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 10px;
`;

export const AiModalToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 24px;
  border-bottom: 1px solid rgba(83, 98, 124, 0.09);
  background: #FFFFFF;

  @media(max-width: 720px) { align-items: flex-start; flex-direction: column; padding: 12px 16px; }
`;

export const AiModalToolbarGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

export const AiToolbarButton = styled.button<{ $active?: boolean }>`
  min-height: 32px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(4, 165, 132, 0.34)' : 'rgba(83, 98, 124, 0.14)')};
  border-radius: 8px;
  padding: 0 10px;
  background: ${({ $active }) => ($active ? 'rgba(4, 165, 132, 0.08)' : '#FFFFFF')};
  color: ${({ $active }) => ($active ? 'var(--color-primary)' : 'var(--color-text-primary)')};
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
`;

const aiNoticeMarquee = keyframes`
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
`;

export const AiNoticeBar = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  min-height: 42px;
  border-bottom: 1px solid rgba(215, 155, 0, 0.15);
  background: rgba(255, 199, 4, 0.075);
`;

export const AiNoticeLabel = styled.span`
  position: relative;
  z-index: 1;
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  padding: 0 14px 0 24px;
  border-right: 1px solid rgba(215, 155, 0, 0.16);
  background: #FFF9E8;
  color: #876606;
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.06em;
  white-space: nowrap;

  @media(max-width: 720px) { padding-left: 14px; }
`;

export const AiNoticeViewport = styled.div`
  min-width: 0;
  overflow: hidden;
  mask-image: linear-gradient(to right, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%);

  &:hover > div,
  &:focus-within > div { animation-play-state: paused; }

  @media(prefers-reduced-motion: reduce) {
    overflow-x: auto;
    mask-image: none;
    scrollbar-width: thin;
  }
`;

export const AiNoticeTrack = styled.div`
  display: flex;
  width: max-content;
  animation: ${aiNoticeMarquee} 34s linear infinite;
  will-change: transform;

  @media(prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
    will-change: auto;
  }
`;

export const AiNoticeGroup = styled.div<{ $duplicate?: boolean }>`
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 32px 0 18px;

  @media(prefers-reduced-motion: reduce) {
    ${({ $duplicate }) => ($duplicate ? 'display: none;' : '')}
  }
`;

export const AiNoticeItem = styled.span<{ $summary?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 720px;
  color: ${({ $summary }) => ($summary ? 'var(--color-text-primary)' : '#7D6106')};
  font-size: 11px;
  font-weight: ${({ $summary }) => ($summary ? 'var(--font-weight-medium)' : 'var(--font-weight-semibold)')};
  line-height: 16px;
  white-space: nowrap;
`;

export const AiBlockingNotice = styled.div`
  min-height: 36px;
  padding: 9px 24px;
  border-bottom: 1px solid rgba(196, 50, 73, 0.14);
  background: rgba(221, 66, 90, 0.07);
  color: #A72E42;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;

  @media(max-width: 720px) { padding-inline: 14px; }
`;

export const AiModalScroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 24px 24px;
  scrollbar-width: thin;

  @media(max-width: 720px) { padding: 12px 12px 20px; }
`;

export const AiCompareHeader = styled.div`
  position: sticky;
  top: -16px;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(210px, 260px) minmax(0, 1fr) 34px minmax(0, 1fr);
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid rgba(83, 98, 124, 0.09);
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 7px 18px rgba(7, 11, 53, 0.055);

  @media(max-width: 880px) { display: none; }
`;

export const AiCompareHeaderLabel = styled.span<{ $tone?: 'before' | 'after' }>`
  color: ${({ $tone }) => ($tone === 'after' ? '#027E66' : $tone === 'before' ? '#8A5360' : 'var(--color-text-muted)')};
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

export const AiGroupTitle = styled.h3`
  margin: 22px 2px 4px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  line-height: 19px;

  &:first-of-type { margin-top: 14px; }
`;

export const AiChangeRow = styled.div<{ $selected?: boolean }>`
  display: grid;
  grid-template-columns: minmax(210px, 260px) minmax(0, 1fr) 34px minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
  margin-top: 10px;
  padding: 12px;
  border: 1px solid ${({ $selected }) => ($selected ? 'rgba(4, 165, 132, 0.27)' : 'rgba(83, 98, 124, 0.10)')};
  border-radius: 12px;
  background: ${({ $selected }) => ($selected ? 'rgba(4, 165, 132, 0.025)' : '#FFFFFF')};

  @media(max-width: 880px) {
    grid-template-columns: 1fr;
    padding: 13px;
  }
`;

export const AiChangeInfo = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
  padding: 5px 4px;
`;

export const AiChangeCheckbox = styled.input`
  flex: 0 0 auto;
  width: 17px;
  height: 17px;
  margin-top: 1px;
  accent-color: var(--color-primary);
  cursor: pointer;
`;

export const AiChangePath = styled.code`
  display: block;
  overflow-wrap: anywhere;
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  line-height: 16px;
`;

export const AiChangeReason = styled.p`
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: 10px;
  line-height: 14px;
`;

export const AiValueCard = styled.div<{ $tone: 'before' | 'after' }>`
  min-width: 0;
  min-height: 86px;
  padding: 11px 12px;
  border: 1px solid ${({ $tone }) => ($tone === 'after' ? 'rgba(4, 165, 132, 0.18)' : 'rgba(196, 50, 73, 0.10)')};
  border-radius: 9px;
  background: ${({ $tone }) => ($tone === 'after' ? 'rgba(4, 165, 132, 0.055)' : 'rgba(196, 50, 73, 0.035)')};
`;

export const AiValueLabel = styled.span<{ $tone: 'before' | 'after' }>`
  display: none;
  margin-bottom: 7px;
  color: ${({ $tone }) => ($tone === 'after' ? '#027E66' : '#8A5360')};
  font-size: 10px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.06em;
  text-transform: uppercase;

  @media(max-width: 880px) { display: block; }
`;

export const AiValue = styled.pre`
  max-height: 260px;
  overflow: auto;
  color: var(--color-text-primary);
  font-family: inherit;
  font-size: 12px;
  font-weight: var(--font-weight-medium);
  line-height: 18px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
`;

export const AiCompareArrow = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 19px;
  font-weight: var(--font-weight-semibold);

  @media(max-width: 880px) { display: none; }
`;

export const AiEmptyState = styled.div`
  padding: 54px 20px;
  border: 1px dashed rgba(83, 98, 124, 0.18);
  border-radius: 12px;
  background: #FFFFFF;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  text-align: center;
`;

export const AiModalFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 24px;
  border-top: 1px solid rgba(83, 98, 124, 0.10);
  background: #FFFFFF;
  box-shadow: 0 -8px 22px rgba(7, 11, 53, 0.045);

  @media(max-width: 720px) { align-items: stretch; flex-direction: column; padding: 12px 16px; }
`;

export const AiModalFooterActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;

  @media(max-width: 720px) {
    display: grid;
    grid-template-columns: 1fr 1fr;

    > :last-child { grid-column: 1 / -1; }
  }
`;

export const AiRejectPanel = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: min(620px, 100%);

  textarea {
    min-height: 64px;
  }

  @media(max-width: 720px) {
    align-items: stretch;
    flex-direction: column;
    width: 100%;
  }
`;
