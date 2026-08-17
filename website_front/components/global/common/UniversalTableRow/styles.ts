import styled from "styled-components";
import BaseCard from "../BaseCard";

export const RowWrapper = styled(BaseCard) <{
  gridColumns: string;
  stickyIndex: number;
}>`
  padding: 15px 13px !important;
  align-items: center;
  width: 100%;
  display: grid;
  grid-template-columns: ${({ gridColumns }) => gridColumns};
  cursor: pointer;
  transition: all 0.3s ease;

  &.connections,
  &.influence {
    padding: 10px 12px !important;
    border-radius: 0;

    div,
    p {
      font-weight: 400 !important;
    }
  }

  &.onchain {
    padding: 10px 0px !important;
    border-radius: 0;
  }

  &.custom .custom-percent-value.up {
    color: var(--color-primary) !important;
  }

  &.custom .custom-percent-value.down {
    color: var(--color-danger) !important;
  }

  &.custom .project-price {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;

    @media (max-width: 768px) {
      font-size: 13px;
      line-height: 16px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 15px;
    }
  }

  &.custom .custom-circulation-supply {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;

    p {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
    }

    @media (max-width: 768px) {
      gap: 3px;
      font-size: 13px;
      line-height: 16px;

      p {
        font-size: 13px;
        line-height: 16px;
      }
    }

    @media (max-width: 480px) {
      gap: 2px;
      font-size: 12px;
      line-height: 15px;

      p {
        font-size: 12px;
        line-height: 15px;
      }
    }
  }

  &.backers-funds {
    & > *:nth-child(8),
    & > *:nth-child(9) {
      justify-self: stretch;
      justify-content: center;
      text-align: center;
      padding-left: 0;
      padding-right: 0;
      transform: translateX(-4px);
    }

    & > *:nth-child(9) {
      padding-left: 0;
      padding-right: 0;
    }

    & > *:nth-child(10) {
      justify-self: start;
      justify-content: flex-start;
    }
  }

  .id {
    font-size: 14px;
    color: var(--color-text-muted);
  }

  .orders {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: 400 !important;
    height: 100%;
    display: flex;
    align-items: center;

    &.approved {
      color: var(--color-info);
    }

    &.pending {
      color: var(--color-warning);
    }

    &.completed {
      color: var(--color-primary);
    }

    &.rejected {
      color: var(--color-danger);
    }
  }

  &
    > *:nth-child(
      ${(props) => {
    return props.stickyIndex;
  }}
    ) {


    @media (max-width: 768px) {
      position: sticky;
      left: 0;
      z-index: 1;
      border-right: 1px solid #eee;
      transition: all 0.3s ease;
      background: white;
    }

    &.blue-bg {
      background: #f5fbfd;
    }

    &.otc,
    &.deals {
      height: 100%;
    }
  }

  @media (max-width: 1024px) {
    padding: 12px 10px !important;
  }

  &:active {
    background: var(--input-active);
  }
  @media (max-width: 768px) {
    padding: 10px 8px !important;
  }

  @media (max-width: 480px) {
    padding: 8px 6px !important;
    &:active {
      background-color: white;
    }
    &:hover {
      background-color: white;
    }
    & .project-price {
      margin-left: 12px;
    }
  }

  button {
    max-width: fit-content;
  }

  & .row-bold-value {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }

  & .row-default-value {
    font-weight: 400 !important;

    @media (max-width: 768px) {
      font-size: 13px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
    }
  }

  & .green-color {
    color: var(--color-primary);
  }

  & .gray-color {
    color: var(--main-gray) !important;
  }

  & .red-color {
    color: var(--color-danger) !important;
  }

  & .yellow-color {
    color: var(--color-warning) !important;
  }

  & .Pending {
    color: var(--color-warning) !important;
  }

  & .Completed {
    color: var(--main-green) !important;
  }

  & .Cancelled {
    color: var(--main-red) !important;
  }

  & > div {
    &:first-child {
    }
    &:nth-child(2) {
      font-weight: var(--font-weight-semibold);
      font-size: 12px;
      line-height: 17px;

      @media (max-width: 768px) {
        font-size: 11px;
        line-height: 16px;
      }

      @media (max-width: 480px) {
        font-size: 10px;
        line-height: 15px;
      }
    }
    &:nth-child(3) {
    }
    &:nth-child(4) {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;

      @media (max-width: 768px) {
        font-size: 13px;
        line-height: 16px;
      }

      @media (max-width: 480px) {
        font-size: 12px;
        line-height: 15px;
      }
    }

    &:nth-child(7) {
      font-style: normal;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;

      @media (max-width: 768px) {
        font-size: 13px;
        line-height: 16px;
      }

      @media (max-width: 480px) {
        font-size: 12px;
        line-height: 15px;
      }
    }
    &:nth-child(8) {
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);

      @media (max-width: 768px) {
        font-size: 13px;
      }

      @media (max-width: 480px) {
        font-size: 12px;
      }
    }
    &:nth-child(9) {
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;
      margin-bottom: 4px;

      @media (max-width: 768px) {
        font-size: 13px;
        line-height: 16px;
        margin-bottom: 3px;
      }

      @media (max-width: 480px) {
        font-size: 12px;
        line-height: 15px;
        margin-bottom: 2px;
      }
    }
    &:nth-child(10) {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-weight: var(--font-weight-semibold);
      font-size: 14px;
      line-height: 17px;

      @media (max-width: 768px) {
        font-size: 13px;
        line-height: 16px;
        gap: 3px;
      }

      @media (max-width: 480px) {
        font-size: 12px;
        line-height: 15px;
        gap: 2px;
      }
    }

    &:last-child {
      width: 100%;
      svg {
        max-width: fit-content;
        object-fit: cover;
        width: 100%;

        @media (max-width: 768px) {
          max-width: 80%;
        }

        @media (max-width: 480px) {
          max-width: 70%;
        }
      }
    }

    .avatars {
      display: flex;
      & img {
        transform: translateX(0px);

        @media (max-width: 768px) {
          width: 28px;
          height: 28px;
        }

        @media (max-width: 480px) {
          width: 24px;
          height: 24px;
        }
      }
    }
  }

  & .fomo-score-info {
    display: flex;
    align-items: center;
    gap: 10px;

    @media (max-width: 768px) {
      gap: 8px;
    }

    @media (max-width: 480px) {
      gap: 6px;
      flex-wrap: wrap;
    }
  }

  & .rating-likes {
    display: flex;
    align-items: center;
    gap: 10px;

    @media (max-width: 768px) {
      gap: 8px;
    }

    @media (max-width: 480px) {
      gap: 6px;
      flex-wrap: wrap;
    }
  }

  & .chart7d {
    &.not-last-chart {
      margin-right: 12px;
    }

    img {
      max-width: 100%;
      max-height: 60px;

      @media (max-width: 1024px) {
        max-height: 50px;
      }

      @media (max-width: 768px) {
        max-height: 40px;
      }

      @media (max-width: 480px) {
        max-height: 32px;
      }
    }
  }
`;

export const UpDownWrapper = styled.div<{ type: "up" | "down" }>`
  display: flex;
  align-items: center;
  gap: 6px;
  color: ${({ type }) => (type === "up" ? "var(--color-primary)" : "var(--color-danger)")};
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  line-height: 17px;

  @media (max-width: 768px) {
    gap: 4px;
    font-size: 13px;
    line-height: 16px;
  }

  @media (max-width: 480px) {
    gap: 3px;
    font-size: 12px;
    line-height: 15px;
  }

  svg {
    transform: rotate(${({ type }) => (type === "up" ? "180deg" : "0")});

    @media (max-width: 768px) {
      width: 14px;
      height: 14px;
    }

    @media (max-width: 480px) {
      width: 12px;
      height: 12px;
    }

    path {
      fill: ${({ type }) => (type === "up" ? "var(--color-primary)" : "var(--color-danger)")};
    }
  }
`;

export const ProgressBar = styled.div<{ progress: number }>`
  background: #eeeeee;
  border-radius: 8px;
  height: 8px;
  width: 130px;

  @media (max-width: 1024px) {
    width: 110px;
    height: 7px;
  }

  @media (max-width: 768px) {
    width: 90px;
    height: 6px;
    border-radius: 6px;
  }

  @media (max-width: 480px) {
    width: 70px;
    height: 5px;
    border-radius: 4px;
  }

  div {
    background: #05c9a1;
    border-radius: 8px;
    height: 8px;
    width: ${({ progress }) => progress}%;

    @media (max-width: 1024px) {
      height: 7px;
    }

    @media (max-width: 768px) {
      height: 6px;
      border-radius: 6px;
    }

    @media (max-width: 480px) {
      height: 5px;
      border-radius: 4px;
    }
  }
`;

export const ProjectData = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    gap: 6px;
  }

  @media (max-width: 480px) {
    gap: 4px;
    background: white;
    transition: background 0.3s ease;
  }

  p {
    font-weight: var(--font-weight-semibold);
    font-size: 14px;
    line-height: 17px;

    @media (max-width: 768px) {
      font-size: 13px;
      line-height: 16px;
    }

    @media (max-width: 480px) {
      font-size: 12px;
      line-height: 15px;
    }
  }

  span {
    display: block;
    margin-top: 4px;
    color: var(--color-text-muted);

    @media (max-width: 768px) {
      margin-top: 3px;
      font-size: 12px;
    }

    @media (max-width: 480px) {
      margin-top: 2px;
      font-size: 11px;
    }
  }
`;
