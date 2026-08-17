import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  max-width: 100%;
  border: 1px solid #f0f2f5;
  position: relative;
  height: 100%;

  & .chats-wrapper{
    min-height: 590px;
    max-height: 590px;
    padding: 18px 0;
  }

  & .chat-body{
    max-height: 440px;
  }

  &.fullscreen {
    min-width: 100vw;
    min-height: 100vh;
    background: white;
    z-index: 1000;
    border: none;

    & .chat-body {
      max-height: calc(100vh - 150px);
      height: calc(100vh - 150px);

      @media (max-width: 768px) {
        max-height: calc(100vh - 120px);
        height: calc(100vh - 120px);
      }
    }

    & .chats-wrapper {
      min-height: calc(100vh - 20px);
      max-height: calc(100vh - 20px);
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;
    min-height: 400px;

    .chat-body {
      max-height: none;
      height: auto;
    }

    &.mobile-chat-list {
      .chats-wrapper {
        display: block;
      }

      .chat-messages-wrapper {
        display: none;
      }
    }

    &.mobile-chat-selected {
      .chats-wrapper {
        display: none;
      }

      .chat-messages-wrapper {
        display: flex;
        min-height: 400px;
      }

      .chat-messages-wrapper.fullscreen {
        min-height: 100vh;
        height: 100vh;
      }
    }
  }
`;

export const Item = styled.div`
  cursor: pointer;
  margin: 15px 0;
  padding: 10px;
  border-radius: 8px;
  box-shadow: 4px 4px 0px 0px #eeeeee;
  border: 1px solid var(--color-text-secondary)12;
  display: flex;
  flex-direction: column;
  gap: 10px;
  position: relative;

  &.subitem {
    margin-left: 50px;

    &.first::before {
      position: absolute;
      content: "";
      background-image: url(/static/common/arrow.png);
      background-size: contain;
      background-repeat: no-repeat;
      width: 40px;
      height: 40px;
      margin-left: -50px;
    }
  }

  .flex {
    display: flex;
    gap: 5px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 10px;
    position: relative;

    .pin1 {
      display: none;
      position: absolute;
      right: 0;

      @media (max-width: 600px) {
        display: block;
      }
    }

    .items {
      display: flex;
      align-items: center;
      gap: 15px;

      @media (max-width: 600px) {
        flex-wrap: wrap;
        gap: 10px;
      }

      .pin {
        display: block;

        @media (max-width: 600px) {
          display: none;
        }
      }

      p,
      b,
      svg {
        font-size: 14px;
      }

      p {
        color: var(--color-text-muted);
      }

      .icons {
        display: flex;
        align-items: center;
        gap: 14px;
        .left {
          margin-left: 5px;
        }
        .icon-item {
          display: flex;
          align-items: center;
          gap: 2px;
        }
      }
    }
  }

  .button {
    font-size: 18px;
    display: flex;
    align-items: center;
    color: var(--color-text-muted);
    font-weight: var(--font-weight-semibold);
    cursor: pointer;

    svg {
      height: 24px;
    }

    span {
      @media (max-width: 440px) {
        display: none;
      }
    }
  }

  .footer {
    display: flex;
    justify-content: space-between;

    @media (max-width: 480px) {
      flex-direction: column;
      gap: 10px;
    }

    .likes {
      display: flex;
      gap: 5px;

      .like,
      .dislike {
        padding: 3px 10px;
        border-radius: 99px;
        display: flex;
        gap: 5px;
        align-items: center;
        font-weight: var(--font-weight-semibold);
        transition: all 0.1s ease;

        &:hover {
          background: var(--color-primary);
          color: var(--color-white);
        }
        &:active {
          opacity: 0.7;
        }
        &.active {
          background: var(--color-primary);
          color: var(--color-white);
        }
      }

      .dislike {
        background: #f8f8f9;
      }

      .like {
        background: #f8f8f9;
      }
    }
  }

  &:hover {
    background: var(--input-hover);
  }

  &:active {
    background: var(--input-active);
  }
`;

export const AdminMessages = styled.div`
  margin-top: 20px;

  @media (max-width: 768px) {
    margin-top: 30px;
  }
`;

export const AdminTitle = styled.h2`
  @media (max-width: 768px) {
    font-size: 20px;
  }
  @media (max-width: 480px) {
    font-size: 18px;
  }
`;

export const List = styled.div``;
