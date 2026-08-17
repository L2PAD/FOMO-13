import styled from "styled-components";
import { Overflow } from "../BarDoubleChart/styles";

export const Wrapper = styled.div`
  position: relative;
  padding: 20px;
  border-radius: 16px;
  background: #f5fbfd;
  max-height: 514px;

  @media (max-width: 768px) {
    padding: 16px;
    border-radius: 12px;
  }

  @media (max-width: 480px) {
    padding: 12px;
    border-radius: 8px;
  }
`;

export const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    margin-bottom: 8px;
    position: relative;
  }

  h3 {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);

    @media (max-width: 768px) {
      font-size: 15px;
    }

    @media (max-width: 480px) {
      font-size: 14px;
    }
  }
`;
export const Labels = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 5px;
  max-height: 317px;

  @media (max-width: 768px) {
    max-height: 280px;
  }

  div {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    line-height: 16.8px;
    color: var(--color-text-primary);

    @media (max-width: 768px) {
      font-size: 13px;
      line-height: 15.6px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 14.4px;
    }
  }
`;

export const ChartContainer = styled.div`
  margin-top: 22px;
  display: flex;
  gap: 10px;
  width: 100%;

  @media (max-width: 768px) {
    margin-top: 18px;
    gap: 8px;
  }

  @media (max-width: 480px) {
    margin-top: 15px;
    gap: 6px;
  }
`;

export const OverflowChart = styled(Overflow)`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const ChartWrapper = styled.div`
  width: 100%;

  height: 100%;
`;

export const LabelsDescription = styled.div`
  position: absolute;
  top: 125px;
  left: 60px;
  background: white;
  padding: 8px;
  border-radius: 8px;
  width: 160px;
  height: 65px;
  display: flex;
  flex-direction: column;
  gap: 4px;

  @media (max-width: 768px) {
    left: 50px;
    width: 140px;
    height: 58px;
    padding: 6px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    left: 40px;
    width: 120px;
    height: 50px;
    padding: 5px;
    border-radius: 4px;
    gap: 3px;
  }

  & .description-item {
    display: grid;
    align-items: center;
    grid-template-columns: 0.5fr 1fr;

    span {
      font-weight: var(--font-weight-semibold);
      font-size: 10px;
      line-height: 100%;

      @media (max-width: 768px) {
        font-size: 9px;
      }

      @media (max-width: 480px) {
        font-size: 8px;
      }
    }

    div {
      display: flex;
      justify-content: center;
      align-items: center;

      svg {
        transform: translateX(-3px);

        @media (max-width: 480px) {
          transform: translateX(-2px);
          width: 6px;
          height: 6px;
        }
      }
    }

    & .blue-line {
      width: 40px;
      height: 1px;
      background: #4f85bd;

      @media (max-width: 768px) {
        width: 35px;
      }

      @media (max-width: 480px) {
        width: 30px;
      }
    }

    & .dashed-line {
      width: 40px;
      border: 1px dashed var(--color-text-muted);

      @media (max-width: 768px) {
        width: 35px;
      }

      @media (max-width: 480px) {
        width: 30px;
      }
    }
  }
`;
