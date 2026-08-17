import styled from "styled-components";
import Link from "next/link";
import BaseCard from "../../global/common/BaseCard";

export const PageWrapper = styled.div`
  width: 1204px;
  margin: 32px auto 0;

  @media (max-width: 1204px) {
    width: 100%;
    padding: 0 16px;
    margin-top: 14px;
  }

  & > p {
    font-size: 18px;
  }
`;

export const FlexContainer = styled.div`
  display: flex;
  gap: 16px;
`;

export const DefaultCard = styled(BaseCard)`
  width: 100%;

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 6px;

    b {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    div {
      display: flex;
      align-items: center;
      gap: 8px;

      svg {
        cursor: pointer;
      }

      label {
        padding-right: 10px;
      }
    }

    .circle {
      width: 24px;
      height: 24px;
      border-radius: 100%;
      background-color: black;
      margin-left: 12px;
    }
  }
`;

export const DropdownWrapper = styled.div<{ active: boolean }>`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  position: relative;

  .button {
    background-color: #f2f7fd;
    cursor: pointer;
    padding: 2px 10px;
    border-radius: 8px;
    min-width: 85px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;

    &.green {
      background-color: var(--color-primary)1a;
    }
  }

  ul {
    position: absolute;
    top: 30px;
    background: var(--color-white);
    box-shadow: 2px 2px 8px 2px #00053026;
    min-width: 80px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    z-index: 1;

    &.green {
      align-items: flex-start;
      color: #000;
    }

    li {
      cursor: pointer;

      &.active {
        color: var(--color-primary);
      }
    }
  }
`;

export const ProjectCardLink = styled(Link)`
  & > div {
    box-shadow: none !important;
    width: 100%;
  }
`;

export const ToDoCard = styled.div`
  padding: 20px 16px;
  border-radius: 8px;
  border: 1px solid rgba(83, 98, 124, 0.07);
  width: 100%;

  .header {
    display: flex;
    gap: 5px;
    align-items: center;
    justify-content: flex-start;
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 10px;

    .item {
      border-radius: 8px;
      border: 1px solid rgba(83, 98, 124, 0.07);
      padding: 5px;
      font-size: 14px;
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }
`;

export const UserBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  font-size: 14px;
  gap: 2px;

  p {
    color: var(--color-text-muted);

    &.top {
      color: var(--color-primary);
    }

    &.bottom {
      color: var(--color-danger);
    }
  }

  b {
    display: flex;
    align-items: center;
  }
`;

export const RatingBlock = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;

  p {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
  }

  .fill-container {
    position: relative;
    height: 140px;

    .fill {
      width: 31px;
      border-radius: 30px;
      display: flex;
      justify-content: center;
      position: absolute;
      left: -15px;
      bottom: 0;
    }

    .center {
      width: 0;
      border-left: 1px dashed;
      height: 100%;
      position: absolute;
      top: 0;
    }

    &.top {
      .fill {
        background: linear-gradient(
          180deg,
          rgba(0, 192, 153, 0.63) 0%,
          rgba(0, 192, 153, 0) 100%
        );
      }

      .center {
        border-color: rgba(0, 192, 153, 0.63);
      }
    }

    &.bottom {
      .fill {
        background: linear-gradient(
          180deg,
          rgba(255, 88, 88, 0.63) 0%,
          rgba(255, 88, 88, 0) 100%
        );
      }
      .center {
        border-color: rgba(255, 88, 88, 0.63);
      }
    }
  }
`;

export const ProjectsWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr 111px;
  grid-gap: 16px;

  .markers {
    border-radius: 20px;
    border: 1px solid;
    display: flex;
    flex-direction: column;
    padding: 20px;
    justify-content: space-between;
  }
`;

export const ProjectsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  background: linear-gradient(180deg, #ecfffb 0%, #ffe9ea 100%);
  padding-left: 16px;
  padding-right: 16px;
  border-radius: 20px;

  & > div {
    margin-top: 16px;
    margin-bottom: 16px;
  }
`;

export const Price = styled.div`
  display: flex;
  gap: 20px;
  font-weight: var(--font-weight-semibold);

  .top {
    color: #047a62;
  }
`;

export const Dates = styled.div`
  display: flex;
  justify-content: space-around;
  font-weight: var(--font-weight-semibold);
`;
export const AreaWrapper = styled.div`
  padding: 19px 12px 0 !important;
  width: max-content !important;

  .recharts-wrapper {
    margin-left: -40px;
  }
  svg {
    font-size: inherit !important;
  }
`;

export const PieWrapper = styled.div`
  position: relative;

  h2 {
    position: absolute;
    left: 40px;
    top: 40px;
  }
`;
