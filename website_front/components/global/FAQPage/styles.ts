import styled from "styled-components";

export const Page = styled.main`
  min-height: 720px;
  padding: 48px 36px 88px;

  @media (max-width: 1204px) {
    padding: 40px 24px 72px;
  }

  @media (max-width: 768px) {
    padding: 20px 16px 48px;
  }
`;

export const PageInner = styled.div`
  width: 100%;
  margin: 0 auto;
`;

export const Hero = styled.header`
  position: relative;
  isolation: isolate;
  min-height: 292px;
  margin-bottom: 28px;
  padding: 42px 46px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background:
    radial-gradient(circle at 84% 12%, rgba(4, 165, 132, 0.44), transparent 28%),
    linear-gradient(135deg, #0c1a2b 0%, #102b35 55%, #0b4137 100%);
  box-shadow: 0 24px 60px rgba(7, 24, 44, 0.16);
  color: var(--color-white);

  &::after {
    content: "";
    position: absolute;
    z-index: -1;
    right: -72px;
    bottom: -150px;
    width: 350px;
    height: 350px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 50%;
    box-shadow:
      0 0 0 48px rgba(255, 255, 255, 0.025),
      0 0 0 96px rgba(255, 255, 255, 0.018);
  }

  @media (max-width: 768px) {
    min-height: 0;
    margin-bottom: 18px;
    padding: 28px 22px 24px;
    border-radius: 16px;
  }
`;

export const HeroContent = styled.div`
  position: relative;
  z-index: 1;
  max-width: 760px;

  h1 {
    margin: 12px 0 10px;
    color: var(--color-white);
    font-size: clamp(36px, 5vw, 54px);
    font-weight: var(--font-weight-semibold);
    line-height: 1.04;
    letter-spacing: -0.03em;
  }

  > p {
    max-width: 660px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 17px;
    line-height: 1.55;
  }

  @media (max-width: 768px) {
    h1 {
      font-size: 35px;
    }

    > p {
      font-size: 15px;
    }
  }
`;

export const HeroBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #7ce6cf;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const HeroStats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-top: 22px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: rgba(255, 255, 255, 0.78);
    font-size: 13px;
  }
`;

export const HeroIcon = styled.div`
  position: absolute;
  right: 70px;
  top: 44%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 112px;
  height: 112px;
  transform: translateY(-50%) rotate(5deg);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.08);
  color: #7ce6cf;
  backdrop-filter: blur(8px);

  @media (max-width: 920px) {
    display: none;
  }
`;

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  align-items: start;
  gap: 24px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const CategoryNav = styled.nav`
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: var(--color-white);
  box-shadow: 0 8px 26px rgba(7, 11, 53, 0.055);

  > span {
    padding: 7px 9px 9px;
    color: var(--color-text-soft);
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  @media (max-width: 960px) {
    position: static;
    flex-direction: row;
    overflow-x: auto;

    > span {
      display: none;
    }
  }
`;

export const CategoryLink = styled.a`
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 8px 9px;
  border-radius: 8px;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  line-height: 1.3;

  > span {
    color: var(--color-primary);
    font-size: 10px;
    font-weight: var(--font-weight-semibold);
  }

  &:hover {
    background: var(--color-primary-soft);
    color: var(--color-primary-dark);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  @media (max-width: 960px) {
    flex: 0 0 auto;
    white-space: nowrap;
  }
`;

export const Sections = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

export const ResultsBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 48px;
  padding: 8px 4px;

  strong {
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  span {
    color: var(--color-text-muted);
    font-size: 13px;
  }
`;

export const ToggleAllButton = styled.button`
  flex: 0 0 auto;
  padding: 8px 11px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  color: var(--color-primary-dark);
  font-size: 12px;
  font-weight: var(--font-weight-semibold);

  &:hover {
    border-color: var(--color-primary);
    background: var(--color-primary-soft);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
  }
`;

export const Section = styled.section`
  scroll-margin-top: 24px;
  overflow: hidden;
  border: 1px solid var(--color-border-subtle);
  border-radius: 17px;
  background: var(--color-white);
  box-shadow: 0 14px 38px rgba(7, 11, 53, 0.06);

  @media (max-width: 768px) {
    border-radius: 14px;
  }
`;

export const SectionHeader = styled.header`
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: start;
  gap: 13px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface-raised);

  > span:last-child {
    min-width: 26px;
    padding: 5px 8px;
    border-radius: 999px;
    background: var(--color-primary-soft);
    color: var(--color-primary-dark);
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    text-align: center;
  }

  @media (max-width: 640px) {
    grid-template-columns: 34px minmax(0, 1fr) auto;
    gap: 10px;
    padding: 18px 16px;
  }
`;

export const SectionIndex = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-primary-soft);
  color: var(--color-primary-dark);
  font-size: 12px;
  font-weight: var(--font-weight-semibold);

  @media (max-width: 640px) {
    width: 32px;
    height: 32px;
  }
`;

export const SectionTitle = styled.h2`
  color: var(--color-text-primary);
  font-size: 21px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.25;

  @media (max-width: 640px) {
    font-size: 18px;
  }
`;

export const SectionDescription = styled.p`
  margin-top: 5px;
  color: var(--color-text-muted);
  font-size: 13px;
  line-height: 1.5;
`;

export const FaqList = styled.div`
  padding: 8px 22px 16px;

  @media (max-width: 640px) {
    padding: 5px 14px 11px;
  }
`;

export const FaqItem = styled.div<{ $open: boolean }>`
  border-bottom: 1px solid var(--color-border-subtle);

  &:last-child {
    border-bottom: 0;
  }
`;

export const QuestionButton = styled.button<{ $open: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  min-height: 64px;
  padding: 15px 5px;
  color: var(--color-text-primary);
  text-align: left;

  > span {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.4;
  }

  > svg {
    flex: 0 0 20px;
    color: var(--color-text-muted);
    transform: rotate(${({ $open }) => ($open ? "180deg" : "0deg")});
    transition: transform 0.22s ease, color 0.2s ease;
  }

  &:hover {
    color: var(--color-primary-dark);

    > svg {
      color: var(--color-primary);
    }
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: -2px;
    border-radius: 8px;
  }

  @media (max-width: 640px) {
    min-height: 58px;

    > span {
      font-size: 15px;
    }
  }
`;

export const Answer = styled.div<{ $open: boolean }>`
  display: grid;
  grid-template-rows: ${({ $open }) => ($open ? "1fr" : "0fr")};
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transition: grid-template-rows 0.24s ease, opacity 0.2s ease;

  > div {
    min-height: 0;
    overflow: hidden;
  }

  p {
    padding: 0 42px 20px 5px;
    color: var(--color-text-secondary);
    font-size: 14px;
    line-height: 1.65;
    white-space: pre-line;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  padding: 44px 20px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  background: var(--color-surface-raised);
  text-align: center;

  > svg {
    margin-bottom: 13px;
    color: var(--color-primary);
  }

  h2 {
    color: var(--color-text-primary);
    font-size: 21px;
    font-weight: var(--font-weight-semibold);
  }

  p {
    margin-top: 7px;
    color: var(--color-text-muted);
    font-size: 14px;
  }

`;
