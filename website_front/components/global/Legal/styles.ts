import Link from "next/link";
import styled, { css, keyframes } from "styled-components";

export const Page = styled.main`
  min-height: 720px;
  padding: 48px 36px 88px;

  @media (max-width: 1204px) {
    padding: 40px 24px 72px;
  }

  @media (max-width: 768px) {
    padding: 20px 16px 48px;
  }

  @media print {
    min-height: 0;
    padding: 0;
    background: #fff;

    .legal-print,
    .legal-sidebar {
      display: none !important;
    }

    .legal-layout {
      display: block;
    }

    .legal-hero {
      min-height: 0;
      margin-bottom: 24px;
      padding: 0 0 20px;
      border-bottom: 1px solid #dde6ee;
      border-radius: 0;
      background: #fff;
      box-shadow: none;
      color: var(--color-text-primary);

      h1,
      p {
        color: inherit;
      }
    }

    .legal-content {
      border: 0;
      box-shadow: none;
    }
  }
`;

export const PageInner = styled.div`
  width: 100%;
  margin: 0 auto;
`;

export const Hero = styled.header`
  position: relative;
  isolation: isolate;
  min-height: 238px;
  margin-bottom: 28px;
  padding: 42px 46px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  background:
    radial-gradient(circle at 82% 16%, rgba(4, 165, 132, 0.42), transparent 27%),
    linear-gradient(135deg, #0c1a2b 0%, #102b35 54%, #0b4137 100%);
  box-shadow: 0 24px 60px rgba(7, 24, 44, 0.16);
  color: var(--color-white);

  &::after {
    content: "";
    position: absolute;
    z-index: -1;
    right: -76px;
    bottom: -138px;
    width: 330px;
    height: 330px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 50%;
    box-shadow:
      0 0 0 44px rgba(255, 255, 255, 0.025),
      0 0 0 88px rgba(255, 255, 255, 0.018);
  }

  @media (max-width: 768px) {
    min-height: 0;
    margin-bottom: 18px;
    padding: 28px 22px 24px;
    border-radius: 16px;
  }
`;

export const HeroCopy = styled.div`
  position: relative;
  z-index: 1;
  max-width: 720px;

  h1 {
    max-width: 650px;
    margin: 12px 0 10px;
    color: var(--color-white);
    font-size: clamp(34px, 5vw, 52px);
    font-weight: var(--font-weight-semibold);
    line-height: 1.05;
    letter-spacing: -0.025em;
  }

  > p {
    max-width: 630px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 17px;
    line-height: 1.55;
  }

  @media (max-width: 768px) {
    h1 {
      margin-top: 10px;
      font-size: 34px;
    }

    > p {
      font-size: 15px;
    }
  }
`;

export const HeroEyebrow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #7ce6cf;
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

export const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
  margin-top: 24px;

  span {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: rgba(255, 255, 255, 0.78);
    font-size: 13px;
    line-height: 18px;
  }
`;

export const HeroIcon = styled.div`
  position: absolute;
  right: 68px;
  top: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 104px;
  height: 104px;
  transform: translateY(-50%) rotate(4deg);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
  color: #7ce6cf;
  backdrop-filter: blur(8px);

  @media (max-width: 900px) {
    display: none;
  }
`;

export const PrintButton = styled.button`
  position: absolute;
  right: 22px;
  bottom: 20px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.86);
  font-size: 13px;
  font-weight: var(--font-weight-medium);
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.26);
    background: rgba(255, 255, 255, 0.14);
  }

  &:focus-visible {
    outline: 2px solid #7ce6cf;
    outline-offset: 2px;
  }

  @media (max-width: 768px) {
    position: static;
    margin-top: 22px;
  }
`;

export const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: 244px minmax(0, 1fr);
  align-items: start;
  gap: 24px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.aside`
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;

  @media (max-width: 960px) {
    position: static;
  }
`;

const sidebarCard = css`
  padding: 10px;
  border: 1px solid var(--color-border-subtle);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 8px 26px rgba(7, 11, 53, 0.055);

  > span:first-child {
    display: block;
    padding: 7px 9px 9px;
    color: var(--color-text-soft);
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }
`;

export const DocumentNav = styled.nav`
  ${sidebarCard};
  display: flex;
  flex-direction: column;
  gap: 3px;

  @media (max-width: 960px) {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));

    > span:first-child {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 560px) {
    padding: 7px;

    > span:first-child {
      display: none;
    }
  }
`;

export const DocumentLink = styled(Link)<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 9px 10px;
  border-radius: 9px;
  background: ${({ $active }) => ($active ? "var(--color-primary-soft)" : "transparent")};
  color: ${({ $active }) =>
    $active ? "var(--color-primary-dark)" : "var(--color-text-secondary)"};
  font-size: 14px;
  font-weight: ${({ $active }) =>
    $active ? "var(--font-weight-semibold)" : "var(--font-weight-medium)"};
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--color-surface-muted);
    color: var(--color-primary-dark);
  }

  &:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 1px;
  }

  @media (max-width: 560px) {
    justify-content: center;
    gap: 6px;
    min-width: 0;
    padding: 9px 6px;
    font-size: 13px;
  }
`;

export const Outline = styled.nav`
  ${sidebarCard};
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: calc(100vh - 260px);
  overflow-y: auto;

  @media (max-width: 960px) {
    display: none;
  }
`;

export const OutlineLink = styled.a<{ $active: boolean; $nested: boolean }>`
  position: relative;
  display: block;
  padding: 7px 9px 7px ${({ $nested }) => ($nested ? "23px" : "13px")};
  border-radius: 7px;
  color: ${({ $active }) =>
    ($active ? "var(--color-primary-dark)" : "var(--color-text-muted)")};
  font-size: ${({ $nested }) => ($nested ? "12px" : "13px")};
  font-weight: ${({ $active }) =>
    ($active ? "var(--font-weight-semibold)" : "var(--font-weight-regular)")};
  line-height: 1.35;
  transition: color 0.2s ease, background 0.2s ease;

  &::before {
    content: "";
    position: absolute;
    left: 5px;
    top: 8px;
    bottom: 8px;
    width: 2px;
    border-radius: 2px;
    background: ${({ $active }) => ($active ? "var(--color-primary)" : "transparent")};
  }

  &:hover {
    background: var(--color-surface-subtle);
    color: var(--color-text-primary);
  }
`;

export const ContentCard = styled.article`
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--color-border-subtle);
  border-radius: 18px;
  background: var(--color-white);
  box-shadow: 0 16px 46px rgba(7, 11, 53, 0.07);

  @media (max-width: 768px) {
    border-radius: 14px;
  }
`;

export const ContentTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: 58px;
  padding: 14px 30px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-surface-raised);

  @media (max-width: 768px) {
    padding: 13px 20px;
  }
`;

export const ContentHeading = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);

  svg {
    color: var(--color-primary);
  }
`;

export const ContentMeta = styled.span`
  color: var(--color-text-soft);
  font-size: 12px;

  @media (max-width: 640px) {
    display: none;
  }
`;

export const Content = styled.div`
  padding: 40px 46px 52px;
  color: var(--color-text-secondary);
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: 1.75;
  overflow-wrap: anywhere;

  > :first-child {
    margin-top: 0 !important;
  }

  > :last-child {
    margin-bottom: 0 !important;
  }

  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    scroll-margin-top: 28px;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    letter-spacing: -0.012em;

    span {
      color: inherit !important;
      font-size: inherit !important;
      font-weight: inherit !important;
      line-height: inherit !important;
    }
  }

  h1 {
    margin: 0 0 24px;
    font-size: 34px;
    line-height: 1.18;
  }

  h2 {
    margin: 40px 0 14px;
    padding-top: 4px;
    font-size: 25px;
    line-height: 1.25;
  }

  h3 {
    margin: 30px 0 11px;
    font-size: 20px;
    line-height: 1.3;
  }

  h4,
  h5,
  h6 {
    margin: 24px 0 9px;
    font-size: 17px;
    line-height: 1.35;
  }

  p,
  ul,
  ol,
  blockquote,
  pre,
  table,
  img,
  hr {
    margin: 0 0 18px;
  }

  p:empty {
    display: none;
  }

  ul,
  ol {
    padding-left: 26px;
  }

  li {
    padding-left: 4px;
  }

  li + li {
    margin-top: 8px;
  }

  li::marker {
    color: var(--color-primary);
    font-weight: var(--font-weight-semibold);
  }

  a {
    color: var(--color-primary-dark);
    font-weight: var(--font-weight-medium);
    text-decoration: underline;
    text-decoration-color: rgba(4, 165, 132, 0.36);
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    transition: color 0.2s ease, text-decoration-color 0.2s ease;

    &:hover {
      color: var(--color-primary-hover);
      text-decoration-color: currentColor;
    }
  }

  blockquote {
    padding: 18px 20px;
    border-left: 4px solid var(--color-primary);
    border-radius: 0 10px 10px 0;
    background: var(--color-primary-soft);
    color: var(--color-text-primary);
  }

  hr {
    height: 1px;
    margin-top: 32px;
    margin-bottom: 32px;
    border: 0;
    background: var(--color-border);
  }

  strong,
  b {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }

  code {
    padding: 2px 6px;
    border-radius: 5px;
    background: var(--color-surface-muted);
    color: var(--color-primary-dark);
    font-family: Consolas, Monaco, monospace;
    font-size: 0.88em;
  }

  pre {
    max-width: 100%;
    padding: 18px;
    overflow-x: auto;
    border-radius: 10px;
    background: #0c1a2b;
    color: #e6edf3;

    code {
      padding: 0;
      background: transparent;
      color: inherit;
    }
  }

  table {
    display: block;
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    border-spacing: 0;
    border-collapse: separate;
    border: 1px solid var(--color-border);
    border-radius: 10px;
  }

  th,
  td {
    min-width: 130px;
    padding: 11px 13px;
    border-right: 1px solid var(--color-border);
    border-bottom: 1px solid var(--color-border);
    text-align: left;
    vertical-align: top;
  }

  th {
    background: var(--color-surface-muted);
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }

  tr:last-child td {
    border-bottom: 0;
  }

  th:last-child,
  td:last-child {
    border-right: 0;
  }

  img {
    display: block;
    max-width: 100%;
    height: auto;
    border-radius: 10px;
  }

  .ql-align-center {
    text-align: center;
  }

  .ql-align-right {
    text-align: right;
  }

  .ql-align-justify {
    text-align: justify;
  }

  .ql-size-small {
    font-size: 0.85em;
  }

  .ql-size-large {
    font-size: 1.25em;
  }

  .ql-size-huge {
    font-size: 1.6em;
  }

  .ql-indent-1 {
    padding-left: 2.5em;
  }

  .ql-indent-2 {
    padding-left: 5em;
  }

  .ql-indent-3 {
    padding-left: 7.5em;
  }

  @media (max-width: 768px) {
    padding: 28px 20px 36px;
    font-size: 15px;
    line-height: 1.7;

    h1 {
      font-size: 28px;
    }

    h2 {
      margin-top: 32px;
      font-size: 22px;
    }

    h3 {
      font-size: 18px;
    }

    .ql-indent-2,
    .ql-indent-3 {
      padding-left: 2.5em;
    }
  }
`;

const shimmer = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`;

export const Skeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 420px;
  padding: 42px 46px;

  span {
    height: 16px;
    border-radius: 6px;
    background: linear-gradient(90deg, #eef3f7 25%, #f8fafc 50%, #eef3f7 75%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.4s ease-in-out infinite;
  }

  span:first-child {
    width: 52%;
    height: 32px;
    margin-bottom: 8px;
  }

  span:nth-child(2) {
    width: 100%;
  }

  span:nth-child(3) {
    width: 94%;
  }

  span:nth-child(4) {
    width: 76%;
  }

  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
    }
  }

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  padding: 48px 24px;
  text-align: center;

  > svg {
    margin-bottom: 14px;
    color: var(--color-primary);
  }

  h2 {
    margin-bottom: 8px;
    color: var(--color-text-primary);
    font-size: 22px;
    font-weight: var(--font-weight-semibold);
  }

  p {
    max-width: 430px;
    color: var(--color-text-muted);
    font-size: 14px;
    line-height: 1.55;
  }

  a {
    margin-top: 20px;
    padding: 10px 15px;
    border-radius: 8px;
    background: var(--color-primary);
    color: var(--color-white);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }
`;
