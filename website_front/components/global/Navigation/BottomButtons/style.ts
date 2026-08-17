import styled from "styled-components";

export const ButtonsWrapper = styled.div`
  position: fixed;
  bottom: 10px;
  left: 10px;
  right: 10px;
  max-width: calc(100% - 20px);
  width: 100%;
  padding: 10px;
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: space-around;
  z-index: 9;
  background: #f8f9fb80;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid #f0f2f5;

  @media (min-width: 768px) {
    display: none;
  }

  button {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    line-height: 16px;
    color: var(--color-text-muted);

    &.active {
      color: var(--color-primary);
      svg path {
        stroke: var(--color-primary);
      }
    }
  }
`;

export const NavMenuWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 999;
  background: var(--color-white);
  padding: 20px;

  .header {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    position: relative;

    h2 {
      font-size: 16px;
      z-index: 1;
      color: var(--color-white);
      text-transform: capitalize;
    }

    &::before {
      content: "";
      position: absolute;
      left: -20px;
      top: -20px;
      width: 100vw;
      height: 200px;
      background: #00735c;
    }

    button {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      color: white;
    }
  }

  .pagesList {
    position: relative;
    z-index: 1;
    width: 100%;
    margin-top: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    max-height: calc(100vh - 160px);
    padding-bottom: 10px;

    .pageItem {
      background: var(--color-white);
      box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
      border-radius: 12px;

      a,
      .disabled-link {
        padding: 20px;
        font-size: 14px;
        font-weight: var(--font-weight-semibold);
        width: 100%;
        display: flex;
        flex-direction: row;
        align-items: center;

        span {
          margin-left: 10px;
        }

        svg {
          width: 20px;
          height: 20px;
        }
      }

      .disabled-link {
        color: var(--color-text-muted);
        cursor: not-allowed;
        opacity: 0.45;
      }
    }

    .chevron-icon {
      margin-left: auto;
    }
  }

  .withTabs {
    & > span {
      font-size: 12px;
      color: var(--color-text-muted);
      padding: 20px;
      display: block;
    }

    .tabsList {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding-bottom: 20px;

      a,
      .disabled-link {
        padding: 0 20px;
      }
    }
  }
`;
