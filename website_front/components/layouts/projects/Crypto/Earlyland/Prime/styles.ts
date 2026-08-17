import styled from "styled-components";

export const PrimeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 40px;
  width: 100%;
  padding: 80px 0 40px 0;
  backdrop-filter: blur(10px);
  border-radius: 12px;

  @media (max-width: 600px) {
    padding: 40px 16px;
    gap: 20px;
  }
`;

export const HeroSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
`;

export const LockIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  border-radius: 20px;
  background: linear-gradient(-36.79deg, #f1effa 0.1%, #e3ddfd 99.9%);
  flex-shrink: 0;
`;

export const PrimeTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  line-height: 40px;
  color: var(--color-text-primary);
  text-align: center;
`;

export const PrimeSubtitle = styled.div`
  font-family: "Gilroy", sans-serif;
  font-size: 24px;
  font-weight: var(--font-weight-regular);
  line-height: 30px;
  color: #728094;
  text-align: center;

  p {
    margin: 0;
  }
`;

export const FeatureCardsRow = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
  width: 894px;
  max-width: 100%;
  flex-shrink: 0;

  @media (max-width: 960px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

export const FeatureCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  flex: 1 0 0;
  padding: 20px;
  border: 1px solid #eae6fc;
  border-radius: 12px;
  min-height: 174px;
`;

export const FeatureIconWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
`;

export const FeatureTextBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  text-align: center;
`;

export const FeatureTitle = styled.p`
  font-family: "Gilroy", sans-serif;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  line-height: 30px;
  color: var(--color-text-primary);
  width: 100%;
`;

export const FeatureDesc = styled.div`
  font-family: "Gilroy", sans-serif;
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  line-height: 18px;
  color: #728094;
  width: 100%;

  p {
    margin: 0;
  }
`;

export const GetNftButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  width: 168px;
  background: #8161ff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s;

  &:hover {
    background: #6d4de0;
  }

  span {
    font-family: "Gilroy", sans-serif;
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 18px;
    color: var(--color-white);
    white-space: nowrap;
  }
`;
