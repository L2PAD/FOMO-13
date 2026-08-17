import styled, { keyframes } from "styled-components";
import Link from "next/link";
import LaunchpadPlacementBanner from "../../../../global/LaunchpadPlacementBanner";

const smoothGradientFlow = keyframes`
  0%, 100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
`;

const promotedDetailsReveal = keyframes`
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

export const Wrapper = styled.div`
  display: flex;
  align-items: stretch;
  max-width: 300px;
  margin-left: 4px;

  @media (max-width: 767px) {
    display: none;
  }
`;

export const AdLabel = styled.button<{ isVisible: boolean }>`
  min-width: 50px;
  max-width: 50px;
  text-align: center;
  background: linear-gradient(
    90deg,
    #0fa4e9,
    #20a7eb,
    #38adee,
    #48b0ee,
    #5ab8f0,
    #7478ef,
    #6266f1,
    #696ef3,
    #38adee,
    #20a7eb,
    #0fa4e9
  );
  background-size: 400% 400%;
  border-radius: 8px;
  border-top-right-radius: ${({ isVisible }) => (isVisible ? "0" : "8px")};
  border-bottom-right-radius: ${({ isVisible }) => (isVisible ? "0" : "8px")};
  padding: 4px 12px;
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  line-height: 20px;
  color: var(--color-white);
  user-select: none;
  border: none;
  cursor: pointer;
  animation: ${smoothGradientFlow} 10s ease infinite;
  display: flex;
  align-items: center;
  justify-content: center;

  .ad-text {
    padding: 2px 6px;
    border-radius: 6px;
    background: var(--color-white)33;
  }
`;

export const Items = styled.div<{ isVisible?: boolean }>`
  position: relative;
  min-width: 0;
  width: ${({ isVisible = true }) => (isVisible ? "220px" : "0")};
  max-width: ${({ isVisible = true }) => (isVisible ? "220px" : "0")};
  overflow: ${({ isVisible = true }) => (isVisible ? "visible" : "hidden")};
  transition:
    width 0.3s ease,
    max-width 0.3s ease;
`;

export const Card = styled(Link)`
  padding: 3px 6px;
  border-radius: 0 8px 8px 0;
  background: var(--color-white);
  border: 1px solid var(--main-blue);
  display: flex;
  align-items: center;
  box-sizing: border-box;
  transition: all 0.3s ease;
  height: 38px;
  color: inherit;
  text-decoration: none;

  &:hover {
    box-shadow: 2px 2px 8px 0 #00053014;
  }
`;

export const CardContent = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  width: 100%;

  .project-logo {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    flex-shrink: 0;
    object-fit: cover;
    background: #050716;
    border: 1px solid #11184a;
  }

  .project-logo-fallback {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #050716;
    color: var(--color-white);
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
  }

  .project-main {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .project-name {
    font-size: 13px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
    color: #000530;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 118px;
  }

  .project-meta {
    display: none;
  }

  .project-badge {
    margin-left: auto;
    flex-shrink: 0;
    padding: 5px 10px;
    border-radius: 4px;
    background: var(--color-primary-soft);
    color: var(--main-green);
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
    white-space: nowrap;
  }
`;

export const PromotedBanner = styled(LaunchpadPlacementBanner)`
  display: block;
  width: 42px;
  height: 30px;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 5px;
  background: #edf0f5;

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

export const PlacementState = styled.div`
  min-width: 220px;
  min-height: 38px;
  padding: 6px 10px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  line-height: 16px;
`;

export const PlacementStateButton = styled.button`
  padding: 4px 7px;
  border: 0;
  border-radius: 6px;
  background: var(--color-primary-soft);
  color: var(--main-green);
  cursor: pointer;
  font-size: 12px;
`;

export const HoverCard = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 400px;
  max-width: calc(100vw - 32px);
  padding: 18px;
  border-radius: 12px;
  background: var(--color-white);
  border: 1px solid #eaeaea;
  box-shadow: 2px 4px 16px 4px rgba(0, 5, 48, 0.15);
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};
  z-index: 1000;
  margin-top: 45px;
  transform-origin: top left;
  transform: ${({ isVisible }) =>
    isVisible ? "translateY(0) scale(1)" : "translateY(-6px) scale(0.98)"};
  transition:
    opacity 0.16s ease,
    transform 0.16s ease;
  animation: ${({ isVisible }) =>
    isVisible ? promotedDetailsReveal : "none"} 0.16s ease;

  .hover-content {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .hover-header,
  .hover-description,
  .hover-metrics {
    display: none !important;
  }

  .deal-content {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .deal-header,
  .deal-row,
  .deal-project {
    display: flex;
    align-items: center;
  }

  .deal-header {
    justify-content: space-between;
    gap: 16px;
  }

  .deal-header h4 {
    margin: 0;
    font-size: 15px;
    font-weight: var(--font-weight-semibold);
    line-height: 20px;
    color: #000530;
  }

  .deal-header span {
    flex-shrink: 0;
    padding: 5px 10px;
    border-radius: 4px;
    background: var(--color-primary-soft);
    color: var(--main-green);
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
  }

  .deal-divider {
    width: 100%;
    height: 1px;
    background: #edf0f5;
  }

  .deal-details {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .deal-row {
    justify-content: space-between;
    gap: 18px;
    min-height: 16px;
  }

  .deal-row span {
    color: var(--color-text-muted);
    font-size: 13px;
    font-weight: var(--font-weight-regular);
    line-height: 17px;
  }

  .deal-row strong {
    min-width: 0;
    color: #000530;
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    line-height: 17px;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .deal-row strong.investors {
    color: var(--main-green);
    max-width: 260px;
  }

  .deal-description {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 13px;
    font-weight: var(--font-weight-regular);
    line-height: 17px;
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .deal-description strong {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
  }

  .deal-project {
    gap: 12px;
  }

  .deal-logo,
  .deal-logo-fallback {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .deal-logo {
    object-fit: cover;
    background: #f5f7fb;
    border: 1px solid #edf0f5;
  }

  .deal-logo-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #000530;
    color: var(--color-white);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  .deal-project-info {
    min-width: 0;
  }

  .deal-project-info h5 {
    margin: 0;
    color: #000530;
    font-size: 15px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .deal-project-info p {
    margin: 3px 0 0;
    color: var(--color-text-muted);
    font-size: 13px;
    font-weight: var(--font-weight-regular);
    line-height: 17px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .deal-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 30px;
    border-radius: 8px;
    background: var(--main-green);
    color: var(--color-white);
    text-decoration: none;
    font-size: 13px;
    font-weight: var(--font-weight-medium);
    line-height: 16px;
    transition: background 0.2s ease;
  }

  .deal-action:hover {
    background: var(--color-primary-hover);
  }

  .deal-action span {
    line-height: 1;
  }

  .hover-header {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .hover-logo,
  .hover-logo-fallback {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .hover-logo {
    object-fit: cover;
    border: 1px solid #edf0f5;
  }

  .hover-logo-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #eef8f6;
    color: var(--main-green);
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
  }

  .hover-title {
    min-width: 0;
  }

  h4 {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    line-height: 18px;
    color: var(--main-black);
    margin: 0;
  }

  .hover-subtitle {
    font-size: 12px;
    line-height: 16px;
    color: var(--main-gray);
    margin-top: 2px;
  }

  .hover-description {
    font-size: 12px;
    line-height: 17px;
    color: var(--main-gray);
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .hover-metrics {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }

  .hover-metric {
    min-width: 0;
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--color-surface-subtle);
    border: 1px solid #edf0f5;
  }

  .hover-metric span {
    display: block;
    font-size: 10px;
    font-weight: var(--font-weight-semibold);
    line-height: 13px;
    color: var(--main-gray);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hover-metric strong {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    font-weight: var(--font-weight-semibold);
    line-height: 16px;
    color: var(--main-black);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hover-tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .hover-tag {
    padding: 3px 7px;
    border-radius: 999px;
    background: #f5f7fb;
    color: var(--main-gray);
    font-size: 11px;
    font-weight: var(--font-weight-semibold);
    line-height: 14px;
  }

  .hover-tag.green {
    background: var(--color-primary-soft);
    color: var(--main-green);
  }
`;
