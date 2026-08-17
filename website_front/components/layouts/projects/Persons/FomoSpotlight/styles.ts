import styled from "styled-components";

export const Wrapper = styled.div`
  width: 50%;
  flex-shrink: 0;

  @media (max-width: 1024px) {
    width: 100%;
  }
`;

export const Title = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 6px;
  }

  @media (max-width: 480px) {
    gap: 4px;
  }

  & .title-wrapper {
    font-weight: var(--font-weight-semibold);
    font-size: 32px;
    line-height: 100%;
    letter-spacing: 0%;

    @media (max-width: 768px) {
      font-size: 28px;
    }

    @media (max-width: 480px) {
      font-size: 24px;
    }
  }

  button {
    margin-top: 6px;
    min-width: 24px;
    min-height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 768px) {
      min-width: 20px;
      min-height: 20px;
      margin-top: 4px;
    }

    @media (max-width: 480px) {
      min-width: 18px;
      min-height: 18px;
      margin-top: 3px;
    }
  }

  & .eralash-description {
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

    @media (max-width: 768px) {
      max-width: 250px;
      top: 32px;
      padding: 8px;
    }

    @media (max-width: 480px) {
      max-width: 200px;
      top: 28px;
      padding: 6px;
    }

    & .description-modal-text {
      font-weight: var(--font-weight-regular);
      font-size: 14px;
      line-height: 120%;
      letter-spacing: 0%;
      color: var(--main-gray);

      @media (max-width: 768px) {
        font-size: 13px;
      }

      @media (max-width: 480px) {
        font-size: 12px;
      }

      span {
        font-weight: var(--font-weight-semibold);
      }
    }
  }
`;

export const Items = styled.div`
  position: relative;
  margin-top: 20px;

  @media (max-width: 768px) {
    margin-top: 16px;
  }

  @media (max-width: 480px) {
    margin-top: 12px;
  }

  .swiper-slide {
    width: auto;
  }
`;

export const ArrowsWrapper = styled.div`
  position: absolute;
  z-index: 10;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    var(--color-white) 0%,
    rgba(255, 255, 255, 0.8) 10%,
    rgba(255, 255, 255, 0) 15%,
    rgba(255, 255, 255, 0) 84.5%,
    rgba(255, 255, 255, 0.8) 90.5%,
    var(--color-white) 100%
  );
  display: flex;
  justify-content: space-between;
  pointer-events: none;

  & > button {
    padding: 6px;
    pointer-events: all;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    @media (max-width: 768px) {
      width: 36px;
      height: 36px;
      padding: 4px;
    }

    @media (max-width: 480px) {
      width: 32px;
      height: 32px;
      padding: 3px;
    }

    &:hover {
      background: rgba(255, 255, 255, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    &:active {
      opacity: 0.8;
    }

    svg {
      width: 16px;
      height: 16px;

      @media (max-width: 768px) {
        width: 14px;
        height: 14px;
      }

      @media (max-width: 480px) {
        width: 12px;
        height: 12px;
      }
    }
  }
`;
