import styled from "styled-components";

export const Wrapper = styled.div`
  width: 100%;
  overflow: hidden;
`;

export const Title = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;

  .title-wrapper {
    font-weight: var(--font-weight-semibold);
    font-size: 32px;
    line-height: 1;
    color: var(--color-text-primary);
    margin-right: 10px;
  }

  .featured-description {
    z-index: 10;
  }
`;

export const Items = styled.div`
  position: relative;

  .swiper {
    overflow: visible !important;
  }
`;

export const ArrowsWrapper = styled.div`
  position: absolute;
  z-index: 10;
  top: 0;
  left: -12px;
  right: -12px;
  bottom: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 50%;
    box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
    cursor: pointer;
    pointer-events: all;

    &:hover {
      background: #f8f8f9;
    }

    &:active {
      transform: scale(0.95);
    }
  }
`;

export const Card = styled.div`
  background: #f5fbfd;
  border-radius: 8px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 157px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  margin-bottom: 10px;

  .project-info {
    display: flex;
    flex-direction: column;

    h5 {
      font-size: 14px;
    }
  }
`;

export const ProjectType = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  font-weight: var(--font-weight-regular);
`;

export const Badge = styled.div`
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: var(--font-weight-medium);
  font-size: 12px;

  &.legendary {
    background: rgba(255, 152, 0, 0.1);
    color: #ff9800;
  }

  &.epic {
    background: rgba(131, 56, 236, 0.1);
    color: #8338ec;
  }

  &.fomo-gold {
    background: rgba(255, 193, 7, 0.1);
    color: #ffc107;
  }

  &.rare {
    background: rgba(33, 150, 243, 0.1);
    color: #2196f3;
  }
`;

export const CardBody = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;

  .row {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;

    .left {
      font-size: 14px;
      color: var(--color-text-muted);
    }

    .right {
      font-weight: var(--font-weight-semibold);

      &.legendary {
        color: var(--color-danger);
      }

      &.fomo-gold {
        color: var(--color-warning);
      }

      &.epic,
      &.rare {
        color: #8a53ff;
      }

      &.buy {
        color: var(--color-primary);
      }

      &.sell {
        color: var(--color-danger);
    }
  }
`;

export const Price = styled.p`
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const CardArrow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  margin-left: auto;
  margin-top: 10px;
`;
