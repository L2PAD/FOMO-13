import styled from "styled-components";
import Typography from "../../common/Typography";

export const TimerBlockWrapper = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  position: relative;

  img {
    max-width: 100%;
    object-fit: cover;
    border-radius: 16px;
  }

  .dots {
    display: flex;
    gap: 6px;
    padding: 8px;

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ff507d33;
    }

    .active {
      background: #ff507d;
    }
  }
`;

export const TimerWrapper = styled.div`
  position: absolute;
  background: var(--color-white);
  border-radius: 16px;
  padding: 10px;
  left: 20px;
  bottom: 20px;
  width: 264px;

  @media (max-width: 666px) {
    width: 180px;
    left: 10px;
    padding: 8px;
  }
`;

export const TimerTitle = styled(Typography)`
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  line-height: 29px;
  color: var(--color-text-primary);
`;

export const TimerSecondTitle = styled(Typography)`
  font-weight: var(--font-weight-regular);
  font-size: 14px;
  color: var(--color-text-muted);
  margin-bottom: 4px !important;
`;

export const TimerValue = styled.div`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 12px;
  color: #277ad2;
  margin-bottom: 16px;
`;

export const TimerButton = styled.a`
  max-width: fit-content;
  background: #ff507d;
  padding: 6px 16px;
  border-radius: 99px;
  font-size: 16px;
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
`;
