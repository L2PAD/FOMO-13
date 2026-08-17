import styled from "styled-components";

export const TabWrapper = styled.div`
  position: relative;
  z-index: 1;

  &.tab-wrapper {
    width: 100%;
  }

  & .description-btn {
    position: absolute;
    z-index: 1;
    top: calc(50% - 1.5px);
    transform: translateY(-50%);
    right: -2px;
  }

  & .tab-description {
    position: fixed;
    z-index: 1200;
    transform: translateX(50px);
    width: min(320px, calc(100vw - 32px));
    min-width: 260px;
    box-shadow: 2px 2px 8px 2px #00053014;
    padding: 10px;

    @media (max-width: 480px) {
      min-width: 0;
      width: calc(100vw - 24px);
    }

    div {
      font-size: 14px;
      color: var(--main-gray);
    }
  }
`;
export const SoonLabel = styled.div`
  position: absolute;
  top: -3px;
  right: -12px;
  color: var(--color-primary);
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
`;

export const TabStyle = styled.div<{ active: boolean; disabled?: boolean }>`
  font-weight: ${({ active }) => (active ? 600 : 400)};
  font-size: 16px;
  line-height: 21px;
  padding: 8px 18px 8px 18px;
  position: relative;
  cursor: pointer;
  color: ${({ active }) => (active ? "var(--color-text-primary)" : "var(--color-text-muted)")};
  border-bottom: ${({ active }) => (active ? "2px solid var(--color-primary)" : "none")};
  white-space: nowrap;
  text-align: center;
  height: 100%;
  transition: opacity 0.3s ease;


  @media (max-width: 767px) {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;
  }

  &:hover{
    color: ${({ active }) => (active ? "#010108ff" : "#545e6cff")};
    border-bottom: ${({ active }) => (active ? "2px solid #057861ff" : "2px solid var(--color-text-muted)3a")};
  }
  &:active{
    opacity: 0.6;
  }
`;

export const TabLogo = styled.img`
  width: 20px;
  height: 20px;
`