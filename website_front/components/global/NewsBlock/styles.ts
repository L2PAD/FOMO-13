import styled from "styled-components";
import BaseCard from "../common/BaseCard";

export const NewsWrapper = styled.div`
width: 100%;
  & .cards {
  display: flex;
  flex-direction: column;
  width: 100%;
    @media (max-width: 1024px) {
      gap: 16px;
    }

    @media (max-width: 768px) {
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    @media (max-width: 480px) {
      gap: 8px;
      flex-direction: column;
      overflow-x: visible;
    }

    .card {
      min-width: 380px;
      padding: 10px;
      border-radius: 8px;
      background: #f5fbfd;
      cursor: pointer;
      transition: all 0.3s ease;

      @media (max-width: 1024px) {
        min-width: 340px;
        padding: 12px;
      }

      @media (max-width: 768px) {
        min-width: 300px;
        padding: 10px;
      }

      @media (max-width: 480px) {
        min-width: unset;
        width: 100%;
        padding: 14px;
      }

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      h2 {
        margin: 12px 0px;
        line-height: 36px;
        font-size: 32px;
        font-weight: var(--font-weight-semibold);

        @media (max-width: 1024px) {
          font-size: 28px;
          line-height: 32px;
          margin: 10px 0px;
        }

        @media (max-width: 768px) {
          font-size: 24px;
          line-height: 28px;
          margin: 8px 0px;
        }

        @media (max-width: 480px) {
          font-size: 20px;
          line-height: 24px;
          margin: 6px 0px;
        }
      }
    }

    .info {
      display: flex;
      gap: 5px;
      color: var(--color-text-muted);
      font-size: 16px;
      font-weight: var(--font-weight-semibold);
      align-items: center;

      @media (max-width: 768px) {
        font-size: 15px;
        gap: 4px;
      }

      @media (max-width: 480px) {
        font-size: 14px;
        gap: 3px;
        flex-wrap: wrap;
      }

      b {
        font-weight: var(--font-weight-semibold);
      }
    }

    p {
      font-size: 16px;
      color: #000000;
      line-height: 1.5;

      @media (max-width: 768px) {
        font-size: 15px;
        line-height: 1.4;
      }

      @media (max-width: 480px) {
        font-size: 14px;
        line-height: 1.3;
      }
    }

    img {
      width: 32px;
      height: 32px;

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

  .right-icon {
    width: 20px;
    height: 30px;
    margin-top: auto;
    margin-bottom: auto;

    @media (max-width: 1222px) {
      display: none;
    }

    @media (max-width: 768px) {
      width: 18px;
      height: 28px;
    }

    @media (max-width: 480px) {
      width: 16px;
      height: 24px;
    }
  }
`;

export const Items = styled(BaseCard)`
  margin-top: 20px;
  width: 100%;
`;

export const ParsingItem = styled.div`
  display: grid;
  align-items: flex-start;
  grid-template-columns: 0.2fr 8.6fr 0.2fr;
  gap: 20px;
  padding: 20px 0;
  position: relative;

  @media (max-width: 768px) {
    & .open-btn {
      position: absolute;
      right: 16px;
      top: 16px;
    }

    & .tweet-date {
      position: absolute;
      right: 42px;
      top: 16px;
    }
  }

  & .tweet-actions {
    margin-top: 20px;
    display: flex;
    align-items: center;
    gap: 30px;

    & .tweet-like {
      display: flex;
      align-items: center;
      gap: 8px;

      span {
        color: var(--color-text-muted);
      }
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }

  & .avatar {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    object-fit: cover;
  }

  &:first-child {
    padding-top: 0px;
  }

  & .tweet {
    font-size: 14px;
    color: var(--main-black);
  }

  & .tweet-wrapper {
    display: grid;
    grid-template-columns: 7.1fr 1.5fr;
    justify-content: space-between;
  }

  & .tweet-date {
    max-width: fit-content;
    margin-left: auto;
    font-weight: var(--font-weight-regular);
    font-size: 14px;
    color: var(--main-gray);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
    padding: 16px 0;

    & .tweet-wrapper {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    & .tweet-actions {
      gap: 20px;
    }
  }
`;
