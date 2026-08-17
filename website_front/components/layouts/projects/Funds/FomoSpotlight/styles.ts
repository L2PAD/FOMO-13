import styled from "styled-components";

export const Wrapper = styled.div`
  width: 50%;

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
    flex-wrap: wrap;
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

    @media (max-width: 480px) {
      margin-top: 4px;
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
      top: 34px;
      padding: 8px;
    }

    @media (max-width: 480px) {
      max-width: 200px;
      top: 30px;
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
  min-width: 0;

  .swiper-slide {
    width: auto;
  }

  @media (max-width: 768px) {
    margin-top: 16px;
  }

  @media (max-width: 480px) {
    margin-top: 12px;
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

  button {
    padding: 6px;

    @media (max-width: 768px) {
      padding: 5px;
    }

    @media (max-width: 480px) {
      padding: 4px;
    }
  }
`;
