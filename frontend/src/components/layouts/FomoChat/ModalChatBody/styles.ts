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

export const List = styled.div``;
