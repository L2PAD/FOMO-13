import styled from "styled-components";

export const Wrapper = styled.div`
  width: 50%;
  @media (max-width: 1100px) {
    width: 100%;
  }
`;

export const Title = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;

  & .title-wrapper {
    font-weight: var(--font-weight-semibold);
    font-size: 32px;
    line-height: 100%;
    letter-spacing: 0%;
  }

  button {
    margin-top: 6px;
  }

  & .fomonauts-description {
    max-width: 295px;
    transition: opacity 0.2s ease;
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #00053014;
    backdrop-filter: blur(10px);
    color: var(--color-text-muted);
    padding: 10px;
    border-radius: 8px;
    z-index: 10;
    & .description-modal-text {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 120%;
      letter-spacing: 0%;
      color: var(--main-gray);

      span {
        font-weight: var(--font-weight-semibold);
      }
    }

    @media (max-width: 640px) {
      right: auto;
      left: 0;
      max-width: 260px;
    }

    @media (max-width: 480px) {
      position: fixed;
      top: auto;
      bottom: 12px;
      left: 50%;
      transform: translateX(-50%);
      box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.15);
    }
  }

  @media (max-width: 900px) {
    .title-wrapper {
      font-size: 26px;
    }
  }

  @media (max-width: 640px) {
    .title-wrapper {
      font-size: 22px;
    }
  }

  @media (max-width: 480px) {
    .title-wrapper {
      font-size: 20px;
    }
  }
`;

export const Items = styled.div`
  margin-top: 20px;
  width: 100%;
  display: flex;
  gap: 20px;

  @media (max-width: 900px) {
    gap: 16px;
  }

  @media (max-width: 640px) {
    gap: 12px;
    margin-top: 16px;
  }
`;
