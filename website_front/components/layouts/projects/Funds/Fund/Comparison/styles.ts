import styled from "styled-components";

export const Wrapper = styled.div``;

export const InfoWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const DescriptionWrapper = styled.div`
  position: absolute;
  top: 30px;
  left: 0px;

  & .comparison {
    position: relative;
    z-index: 10;
    width: 340px;
    padding: 10px 20px;
    background: white;
    div {
      color: var(--main-gray);
      font-weight: var(--font-weight-regular);
      font-size: 12px;
      line-height: 12px;
    }

    & .list-block {
      & .title {
        display: block;
        margin: 8px 0 4px;
      }

      & .bottom {
        display: block;
        margin-top: 10px;
      }

      ul {
        display: flex;
        flex-direction: column;
        gap: 4px;

        & li {
          display: flex;
          gap: 6px;
        }
        & li:nth-child(1) {
          &::before {
            content: "";
            display: block;
            min-width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--color-primary);
          }
        }
        & li:nth-child(2) {
          &::before {
            content: "";
            display: block;
            min-width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--color-warning);
          }
        }
        & li:nth-child(3) {
          &::before {
            content: "";
            display: block;
            min-width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--color-warning);
          }
        }
        & li:nth-child(4) {
          &::before {
            content: "";
            display: block;
            min-width: 12px;
            height: 12px;
            border-radius: 50%;
            background: var(--color-danger);
          }
        }
      }
    }
  }
`;
