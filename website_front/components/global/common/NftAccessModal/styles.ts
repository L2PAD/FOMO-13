import styled, { css } from "styled-components";

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(123, 92, 255, 0.12), transparent 32%),
    rgba(8, 12, 26, 0.58);
  backdrop-filter: blur(10px);

  @media (max-width: 640px) {
    padding: 16px;
    align-items: flex-end;
  }
`;

export const ModalCard = styled.div`
  width: 100%;
  max-width: 480px;
  height: min(640px, calc(100vh - 48px));
  position: relative;
  overflow: hidden;
  border-radius: 28px;
  border: 1px solid rgba(124, 95, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(247, 248, 255, 0.98) 100%);
  box-shadow:
    0 32px 80px rgba(19, 25, 47, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);

  @media (max-width: 640px) {
    max-width: none;
    height: min(680px, calc(100vh - 16px));
    border-radius: 24px 24px 0 0;
  }
`;

export const AmbientGlow = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at top center, rgba(122, 94, 255, 0.16), transparent 42%),
    radial-gradient(circle at bottom left, rgba(76, 225, 195, 0.12), transparent 30%);
`;

export const Content = styled.div`
  position: relative;
  height: 100%;
  padding: 32px 40px 28px;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }

  @media (max-width: 640px) {
    padding: 24px 20px 20px;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #7b6ca7;
  background: rgba(116, 94, 194, 0.08);
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(116, 94, 194, 0.16);
    transform: translateY(-1px);
  }
`;

export const IconWrap = styled.div`
  width: 120px;
  height: 120px;
  margin: 10px auto 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7057ff;
  background:
    linear-gradient(180deg, rgba(117, 90, 255, 0.18) 0%, rgba(117, 90, 255, 0.08) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
`;

export const Title = styled.h2`
  margin: 0;
  color: var(--main-black);
  text-align: center;
  font-size: 34px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.05;
  letter-spacing: -0.04em;

  @media (max-width: 640px) {
    font-size: 36px;
  }
`;

export const Accent = styled.span`
  display: block;
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  line-height: 1.2;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #7a5eff;
  margin-bottom: 10px;

  @media (max-width: 640px) {
    font-size: 14px;
  }
`;

export const Description = styled.p`
  max-width: 400px;
  margin: 18px auto 0;
  color: var(--main-gray);
  text-align: center;
  font-size: 18px;
  font-weight: var(--font-weight-regular);
`;

export const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 40px;
`;

export const FeatureItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  color: #242c55;
  font-size: 16px;
  font-weight: var(--font-weight-medium);
  line-height: 1.45;

  span{
    font-weight: var(--font-weight-regular);
  }
`;

export const FeatureIcon = styled.div`
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #18c6a7;
  background: rgba(24, 198, 167, 0.14);
`;

export const ActionButton = styled.button`
  width: 100%;
  margin-top: 32px;
  border: none;
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 18px;
  color: var(--color-white);
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  cursor: pointer;
  background: linear-gradient(90deg, #6f5af7 0%, #8d61ff 100%);
  transition:opacity 0.3s ease;

  &:hover {
    opacity: 0.9;
  }

  &:active {
    opacity: 0.8;
  }
`;

export const Footer = styled.div`
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(116, 128, 154, 0.16);
`;

export const FaqButton = styled.button<{ $expanded: boolean }>`
  width: 100%;
  border: none;
  background: transparent;
  padding: 8px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  color: var(--main-gray);
  font-size: 15px;
  font-weight: var(--font-weight-medium);
  line-height: 1.4;
  text-align: left;

  svg {
    flex: 0 0 auto;
    transition: transform 0.2s ease;
    ${({ $expanded }) =>
      $expanded &&
      css`
        transform: rotate(180deg);
      `}
  }
`;

export const FaqText = styled.div`
  margin-top: 12px;
  color: #70809f;
  font-size: 14px;
  line-height: 1.6;
`;
