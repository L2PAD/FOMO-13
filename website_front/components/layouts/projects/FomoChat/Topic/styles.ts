import styled from "styled-components";

export const TabWrapper = styled.div`
  .left button {
    padding: 6px 10px;
  }

  .left {
    overflow: auto;
    width: 100%;
  }

  .create {
    min-width: 124px;
    padding: 8px 12px;
    height: 31px;
  }
`;

export const TopicWrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 20px;
  padding-top: 20px;

  & > div {
    width: 100%;

    &.highlight {
      max-width: 400px;
      align-self: flex-start;
    }

    &.topics {
      flex: 1;
    }
  }

  @media (max-width: 986px) {
    flex-direction: column;

    & > div {
      width: 100%;
      max-width: 100%;

      &.highlight {
        max-width: 100%;
        position: relative;
        top: 0;
      }
    }
  }
`;

export const Item = styled.div`
  padding: 20px;
  border-radius: 12px;
  background: #f5fbfd;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  transition: box-shadow 0.2s ease;

  .timestamp {
    font-size: 14px;
    color: #728094;

    &.mobile-show {
      display: none;
      margin-left: auto;
    }

    @media (max-width: 768px) {
      display: none;

      &.mobile-show {
        display: block;
      }
    }
  }

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.subitem {
    margin-left: 50px;

    @media (max-width: 480px) {
      margin-left: 30px;
    }

    &.first::before {
      position: absolute;
      content: "";
      background-image: url(/static/common/arrow.png);
      background-size: contain;
      background-repeat: no-repeat;
      width: 40px;
      height: 40px;
      margin-left: -50px;

      @media (max-width: 480px) {
        width: 25px;
        height: 25px;
        margin-left: -30px;
      }
    }
  }

  .header {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .header-top {
      display: flex;
      align-items: flex-start;
      gap: 12px;

      @media (max-width: 768px) {
        flex-wrap: wrap;
        position: relative;
      }

      .user-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;

        .user-name-row {
          display: flex;
          align-items: center;
          gap: 8px;

          p {
            font-size: 16px;
            font-weight: var(--font-weight-semibold);
            color: #1a1d26;
            margin: 0;
          }

          .rating-badge {
            background: #00a991;
            color: var(--color-white);
            font-size: 12px;
            font-weight: var(--font-weight-semibold);
            padding: 4px 8px;
            border-radius: 50%;
            min-width: 28px;
            text-align: center;
          }
        }

        .user-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #728094;

          .followers-count {
            strong {
              color: #000;
              font-weight: var(--font-weight-semibold);
            }

            font-weight: var(--font-weight-regular);
          }
        }
      }
    }

    .info-right {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;

      @media (max-width: 768px) {
        width: 100%;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;

        &.active {
          background: var(--color-white);
          border-radius: 8px;
        }

        &:hover svg path {
          stroke: var(--color-primary) !important;
        }

        &:hover {
          color: var(--color-primary) !important;
        }
      }

      .popover-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: var(--color-white);
        border: 1px solid #e8e8e8;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 20px;
        min-width: 180px;
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .popover-item {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: left;
          color: #1a1d26;
          font-size: 16px;
          font-weight: var(--font-weight-medium);

          svg {
            color: #728094;
            flex-shrink: 0;
          }

          span {
            color: #1a1d26;
          }

          &:hover {
            background: #f5fbfd;
          }

          &:active {
            transform: scale(0.98);
          }
        }
      }
    }

    .actions {
      display: flex;
      flex-direction: row;
      gap: 12px;

      @media (max-width: 768px) {
        position: absolute;
        top: 0px;
        right: 0px;
      }
    }
    .topic-tags {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;

      .tag {
        background: #e0f7f4;
        color: #00a991;
        font-size: 12px;
        font-weight: var(--font-weight-medium);
        padding: 6px 12px;
        border-radius: 6px;
        white-space: nowrap;
      }
    }
  }

  .post-content {
    font-size: 20px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.5;
    color: #1a1d26;
    margin: 0;

    @media (max-width: 768px) {
      font-size: 16px;
    }
  }

  .footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .stats {
      display: flex;
      gap: 20px;
      align-items: center;
      width: 100%;

      @media (max-width: 480px) {
        gap: 16px;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #728094;
        font-size: 14px;
        font-weight: var(--font-weight-regular);

        svg {
          width: 18px;
          height: 18px;
        }

        span {
          color: #728094;
        }

        @media (max-width: 480px) {
          font-size: 13px;

          svg {
            width: 16px;
            height: 16px;
          }
        }
      }
    }
  }
`;

export const CommentTopicWrapper = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const MobileTopicSwiper = styled.div`
  width: 100%;

  .topic-swiper {
    padding: 5px 0;
    margin: 0 -10px;
    padding: 0 10px;
  }

  .swiper-slide {
    width: 300px;
    height: auto;
  }
`;
