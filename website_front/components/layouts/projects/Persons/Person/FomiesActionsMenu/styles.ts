import styled from "styled-components";

export const ModalWrapper = styled.div<{ isVisible: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 10000;
  transition: all 0.3s ease;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  visibility: ${({ isVisible }) => (isVisible ? "visible" : "hidden")};
  pointer-events: ${({ isVisible }) => (isVisible ? "auto" : "none")};

  &.share-modal .internal-wrapper {
    padding: 40px;
  }
  @media (max-width: 768px) {
    &.share-modal .internal-wrapper {
      padding: 16px;
    }
  }

  &.share-modal .main-modal-description {
    max-width: 260px;
    padding: 10px;
    div {
      font-size: 14px;
      line-height: 17px;
      color: var(--main-gray);
    }
  }

  & .custom-title {
    font-weight: var(--font-weight-semibold);
    font-size: 24px;
    line-height: 29px;
    color: var(--main-black);
  }

  & .custom-project {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 5px;

    img {
      width: 30px;
      height: 30px;
      object-fit: cover;
      border-radius: 50%;
    }
  }

  & .custom-subtitle {
    font-weight: var(--font-weight-regular);
    font-size: 24px;
    line-height: 100%;
    color: var(--main-gray);
  }

  & .steps-title {
    width: 100%;
  }
`;

export const Overlay = styled.div`
  position: fixed;
  background: rgba(0, 0, 0, 0.5);
  width: 100vw;
  height: 100vh;
  z-index: 9999;
`;

export const Body = styled.div`
  position: relative;
  z-index: 10000;
  padding: 25px 40px;
  box-shadow: 2px 2px 8px 2px #00053014;
  border-radius: 12px;
  background: white;
  width: 400px;
`;
