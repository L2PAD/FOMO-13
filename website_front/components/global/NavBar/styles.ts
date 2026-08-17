import styled, { keyframes } from "styled-components";
import { mainGlobalDark, mainGlobalDarkBorder } from "../../../styles/mainGlobalDark";

const loadingTicker = keyframes`
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
`;

export const NavBarWrapper = styled.div`
  width: 100%;
  background: ${mainGlobalDark.background};
  display: flex;
  align-items: center;
  padding: 8px 0px;
  box-shadow: 0px 1px 5px 2px #0005300f;

  @media (max-width: 768px) {
    display: flex;
    min-height: 36px;
    padding: 6px 0;
  }
`;

export const DataWrapper = styled.div`
  width: 100%;
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;
  overflow: hidden;

  & .nav-swiper {
    padding-bottom: 0px !important;
  }

  & .swiper-slide {
    display: flex;
    justify-content: center;
  }

  @media (max-width: 1360px) {
    gap: 10px;
  }

  @media (max-width: 1024px) {
    gap: 12px;
  }

  `

export const LoadingMarquee = styled.div`
  width: 100%;
  overflow: hidden;
  position: relative;
`;

export const LoadingTrack = styled.div`
  display: flex;
  align-items: center;
  width: max-content;
  min-width: 100%;
  animation: ${loadingTicker} 28s linear infinite;
  will-change: transform;
`;

export const LoadingItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 24px;
  padding: 0 20px;
  border-left: ${mainGlobalDarkBorder()};
  white-space: nowrap;
  flex-shrink: 0;

  @media (max-width: 768px) {
    min-height: 20px;
    padding: 0 12px;
  }
`;
export const Title = styled.div`
  color: ${mainGlobalDark.textMuted};
  font-size: 14px;
  line-height: 14px;
  font-weight: var(--font-weight-regular);
  display: inline-flex;
  align-items: center;
  text-align: center;
  min-height: 24px;
  padding: 0 20px 0 20px;
  gap:4px;
  border-left: ${mainGlobalDarkBorder()};
  white-space: nowrap;

  @media (max-width: 1425px) {
    font-size: 13px;
  }

  @media (max-width: 1024px) {
    font-size: 12px;
  }

  @media (max-width: 768px) {
    min-height: 20px;
    padding: 0 12px;
  }
`;
export const Price = styled.span`
  color: ${mainGlobalDark.text};
  font-size: 14px;
  line-height: 14px;
  font-weight: var(--font-weight-regular);

  @media (max-width: 1024px) {
    font-size: 12px;
  }
`;
export const Percentage = styled.span<{ amount: number }>`
  color: ${({ amount }) =>
    amount > 0 ? mainGlobalDark.positive : "var(--color-danger)"};
  font-size: 14px;
  line-height: 14px;
  font-weight: var(--font-weight-regular);

  @media (max-width: 1024px) {
    font-size: 12px;
  }
`;

export const LeftWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 0;

  @media (max-width: 768px) {
    gap:10px;
  }
`
