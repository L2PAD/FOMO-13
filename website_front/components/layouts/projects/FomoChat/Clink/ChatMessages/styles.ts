import styled from "styled-components";

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;

  &.chat-messages-wrapper {
    @media (max-width: 768px) {
      min-height: 90vh;
      height: 90vh;
    }
  }

  &.fullscreen {
    @media (max-width: 768px) {
      min-height: 100vh;
      height: 100vh;
    }
  }

  .reply-section {
    border-top: 1px solid #f0f2f5;
    padding: 20px 40px;

    @media (max-width: 768px) {
      padding: 10px 20px;
    }

    .reply-content {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .reply-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        span {
          font-size: 14px;
          font-weight: var(--font-weight-regular);
          color: var(--color-text-primary);
        }

        button {
          background: transparent;
          border: none;
          font-size: 24px;
          color: #728094;
          cursor: pointer;
          line-height: 1;
          padding: 0;

          &:hover {
            color: #1a1d26;
          }
        }
      }

      p {
        font-size: 14px;
        color: #728094;
        margin: 0;
        max-width: 90%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 10px 46px;
  border-bottom: 1px solid #f0f2f5;

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

    hr {
      border: none;
      height: 1px;
      background: #e8e8e8;
    }

    .popover-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
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

      span {
        color: var(--color-text-primary);
      }

      svg {
        color: #728094;
        flex-shrink: 0;
      }

      &:hover {
        background: #f5fbfd;
      }

      &:active {
        transform: scale(0.98);
      }

      &.delete span {
        color: var(--color-danger);
      }
    }
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
  }

  @media (max-width: 480px) {
    padding: 10px 15px;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: all 0.2s ease;
    color: #728094;

    &:hover {
      background: #f5fbfd;
      color: #28b2a1;
    }

    &.active {
      background: #f5fbfd;
      color: #28b2a1;
    }
  }

  img {
    max-width: 20px;
  }
`;

export const HeaderUser = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;

  .back-to-chats {
    display: none;
    background: transparent;
    border: none;
    color: #728094;
    cursor: pointer;
    padding: 6px;
    margin-right: 2px;
    border-radius: 8px;

    &:hover {
      background: #f5fbfd;
      color: #28b2a1;
    }
  }

  @media (max-width: 768px) {
    .back-to-chats {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
  }

  img {
    max-width: 58px;
    border-radius: 50%;
    object-fit: cover;

    @media (max-width: 480px) {
      max-width: 40px;
    }
  }
`;

export const Username = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  line-height: 1;
  text-align: left;
  color: var(--color-text-primary);
  margin-left: 14px;

  p {
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    margin-top: 4px;
    color:var(--main-gray);
    &.online {
    color: var(--main-green);
    }

  }

  @media (max-width: 480px) {
    font-size: 14px;
    margin-left: 8px;
  }
`;

export const Body = styled.div`
  max-height: 720px;
  overflow-y: auto;
  background: #f5f5f5;
  height: 100%;

  &.fullscreen {
    max-height: calc(100vh - 200px);
    height: calc(100vh - 200px);
  }

  @media (max-width: 768px) {
    max-height: none;
    height: auto;
    min-height: 0;
    flex: 1 1 auto;

    &.fullscreen {
      height: 100%;
      max-height: none;
      min-height: 0;
      flex: 1 1 auto;
    }
  }
`;

export const Bottom = styled.div`
  position: relative;
  border-top: 1px solid #f0f2f5;

  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 40px;

  .attachments-preview {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-left: 12px;
  }

  .attachment-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #e4e7ec;
    border-radius: 8px;
    padding: 4px 8px;
    font-size: 12px;
    color: var(--color-text-secondary);
    background: var(--color-surface-subtle);

    img {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
    }

    button {
      background: transparent;
      border: none;
      cursor: pointer;
      color: #98a2b3;
      font-size: 16px;
      line-height: 1;
      margin-left: 0;
    }
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    gap: 8px;
  }

  @media (max-width: 480px) {
    padding: 8px;
    min-height: 70px;
    gap: 4px;
  }
`;

export const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;

  button {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &:hover {
      opacity: 0.7;
    }
  }

  textarea {
    width: 100%;
    min-height: 30px;
    max-height: 120px;
    margin-left: 10px;
    padding: 5px 6px;
    border: none;
    font-size: 16px;
    font-weight: var(--font-weight-regular);
    line-height: 20px;
    text-align: left;
    resize: none;
    overflow-y: auto;
    font-family: inherit;
    background: transparent;
    outline: none;
    transition: height 0.1s ease;

    &::placeholder {
      color: #a0a0a0;
    }

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }
  }
`;

export const SendButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;

  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: 24.2px;
  text-align: left;
  background: #28b2a1;
  padding: 10px 18px;
  border-radius: 12px;
  color: white;

  transition: all 0.3s ease;

  &:hover {
    background: #1b9889;
  }

  &:active {
    opacity: 0.8;
  }
`;

export const EmptyWrapper = styled.div`
  margin-top: 80px;
  &.loading-messages{
    position: relative;
    min-height: 220px;
    height: 100%;
    margin: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 768px) {
    &.loading-messages{
      min-height: max(320px, calc(100vh - 260px));
    }
  }
`;

export const UserData = styled.div`
  display: flex;
  img {
    max-width: 40px;
    width: 100%;
    border-radius: 50%;

    @media (max-width: 480px) {
      max-width:30px;
    }
  }
`;

export const MessageItem = styled.div<{ isMyMessage: boolean }>`
  padding: 20px 40px 20px 40px;
  position: relative;

  @media (max-width: 768px) {
    padding: 12px;
  }

  .user-data {
    flex-direction: ${({ isMyMessage }) => (isMyMessage ? "row-reverse" : "")};
  }
  .message-body {
    background: ${({ isMyMessage }) => (isMyMessage ? "var(--color-primary)" : "var(--color-white)")};
    color: ${({ isMyMessage }) => (isMyMessage ? "white" : "#515151")};
    margin-left: ${({ isMyMessage }) => (isMyMessage ? "auto" : "54px")};
    border-top-left-radius: ${({ isMyMessage }) =>
    isMyMessage ? "14px" : "0px"};
    border-top-right-radius: ${({ isMyMessage }) =>
    isMyMessage ? "0px" : "14px"};
    transform: ${({ isMyMessage }) =>
    isMyMessage ? "translate(-45px,-10px)" : "translateY(-10px)"};
    overflow: visible;
    padding: 12px 14px;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-wrap: break-word;

    .reply-preview {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 10px;
      margin-bottom: 8px;
      border-left: 3px solid ${({ isMyMessage }) =>
    isMyMessage ? "#B6F2E6" : "#DCE3F0"};
      background: ${({ isMyMessage }) =>
    isMyMessage ? "rgba(255,255,255,0.16)" : "#F5F7FB"};
      border-radius: 8px;
      font-size: 12px;
      color: ${({ isMyMessage }) => (isMyMessage ? "#E9FFF9" : "#4A5568")};
    }

    .reply-author {
      font-weight: var(--font-weight-semibold);
    }

    .reply-text {
      opacity: 0.9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }

    .attachments {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      margin-top: 8px;

      .attachment {
        background: ${({ isMyMessage }) =>
    isMyMessage ? "rgba(255,255,255,0.2)" : "#F5F7FB"};
        border-radius: 8px;
        padding: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 64px;

        img {
          max-width: 100%;
          max-height: 140px;
          border-radius: 6px;
          object-fit: contain;
        }

        a {
          color: inherit;
          font-size: 12px;
          text-decoration: underline;
          word-break: break-all;
        }
      }
    }
  }
  .user-data-name {
    margin-right: ${({ isMyMessage }) => (isMyMessage ? "14px" : "0px")};
    margin-top: 5px;
  }

  .message-actions {
    position: absolute;
    top: calc(50%);
    right: ${({ isMyMessage }) => (isMyMessage ? "auto" : "-80px")};
    left: ${({ isMyMessage }) => (isMyMessage ? "-80px" : "auto")};
    transform: translateY(-50%);
    display: flex;
    gap: 8px;
    z-index: 10;
    flex-direction: ${({ isMyMessage }) =>
    isMyMessage ? "row-reverse" : "row"};

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: transparent;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #728094;
      transition: all 0.2s ease;

      &:hover {
        background: #f5fbfd;
        color: #28b2a1;
      }
    }

    .message-popover {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      background: var(--color-white);
      border: 1px solid #e8e8e8;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      padding: 20px;
      min-width: 280px;
      z-index: 100;
      display: flex;
      flex-direction: column;
      gap: 10px;

      &.popover-position-top {
        top: auto !important;
        bottom: calc(100% + 8px) !important;
      }

      &.popover-position-bottom {
        top: calc(100% + 8px) !important;
        bottom: auto !important;
      }

      span {
        color: #728094;
      }

      hr {
        border: none;
        height: 1px;
        background: #e8e8e8;
      }

      .popover-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
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
        padding: 0;

        svg {
          color: #728094;
          flex-shrink: 0;
        }

        span {
          color: #1a1d26;
        }

        &.delete {
          color: var(--color-danger);

          svg {
            color: var(--color-danger);
          }

          span {
            color: var(--color-danger);
          }
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

  @media (max-width: 480px) {
    padding: 10px 8px;

    .message-body {
      margin-left: ${({ isMyMessage }) => (isMyMessage ? "auto" : "38px")};
      transform: ${({ isMyMessage }) =>
    isMyMessage ? "translate(-34px,-6px)" : "translateY(-6px)"};
      padding: 10px 12px;

      .attachments {
        grid-template-columns: 1fr;
      }
    }

    .user-data-name {
      margin-right: ${({ isMyMessage }) => (isMyMessage ? "10px" : "0px")};
    }

    .message-actions {
      right: ${({ isMyMessage }) => (isMyMessage ? "auto" : "-66px")};
      left: ${({ isMyMessage }) => (isMyMessage ? "-66px" : "auto")};
      gap: 6px;

      .action-btn {
        width: 28px;
        height: 28px;
      }

      .message-popover {
        min-width: 220px;
        max-width: calc(100vw - 32px);
        padding: 12px;
        left: ${({ isMyMessage }) => (isMyMessage ? "0" : "auto")};
        right: ${({ isMyMessage }) => (isMyMessage ? "auto" : "0")};
      }
    }
  }
`;

export const Date = styled.div`
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  line-height: 14.52px;
  text-align: right;
  color: #a0a0a0;
  margin-left: 10px;
  margin-top: 6px;
`;

export const MessageBody = styled.div`
  max-width: 420px;
  width: 100%;
  border: 1px solid #e7e7e7;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: 21.78px;
  text-align: left;
  color: #515151;
  border-radius: 14px;
  border-top-left-radius: 0px;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;

  @media (max-width: 768px) {
    max-width: 350px;
    padding: 12px 16px;
  }

  @media (max-width: 480px) {
    max-width: 250px;
    padding: 10px 12px;
    font-size: 14px;
  }
`;

export const PickerWrapper = styled.div`
  position: absolute;
  top: -355px;
  left: -330px;
  z-index: 100;

  @media (max-width: 768px) {
    position: fixed;
    top: auto;
    left: 8px;
    right: 8px;
    bottom: calc(82px + env(safe-area-inset-bottom));
    z-index: 1200;
    display: flex;
    justify-content: center;

    & > em-emoji-picker {
      width: 100%;
      max-width: 360px;
      height: min(42vh, 360px);
    }
  }

  @media (max-width: 480px) {
    bottom: calc(74px + env(safe-area-inset-bottom));
  }
`;

export const ReplySection = styled.div`
  .reply-section {
    border-top: 1px solid #f0f2f5;
    padding: 20px 40px;
    background: var(--color-white);

    .reply-content {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .reply-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        span {
          font-size: 14px;
          font-weight: var(--font-weight-semibold);
          color: #28b2a1;
        }

        button {
          background: transparent;
          border: none;
          font-size: 24px;
          color: #728094;
          cursor: pointer;
          line-height: 1;
          padding: 0;

          &:hover {
            color: #1a1d26;
          }
        }
      }

      p {
        font-size: 14px;
        color: #728094;
        margin: 0;
      }
    }
  }
`;

export const InfoPage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 24px;
  background: var(--color-white);
  height: 100%;
  overflow-y: auto;
`;

export const InfoHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  padding-bottom: 34px;
  border-bottom: 1px solid #f0f2f5;
`;

export const BackButton = styled.button`
  position: absolute;
  left: 0;
  background: transparent;
  border: none;
  color: #728094;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  transition: all 0.2s ease;

  &:hover {
    color: #1a1d26;
  }
`;

export const InfoTitle = styled.h2`
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin: 0;
`;

export const InfoUserSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 20px 0;
`;

export const InfoUserAvatar = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
`;

export const InfoUserName = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #1a1d26;
  margin: 0 0 4px;
`;

export const InfoUserHandle = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  color: var(--color-primary);
  margin: 0;
`;

export const InfoStatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 20px 0;
  border-bottom: 1px solid #f0f2f5;
  border-top: 1px solid #f0f2f5;
  width: 100%;
  margin-bottom: 20px;
  max-width: 480px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const InfoStatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &.left {
    align-items: flex-start;
  }
`;

export const InfoStatLabel = styled.span`
  font-size: 12px;
  font-weight: var(--font-weight-regular);
  color: #728094;
  text-align: center;
`;

export const InfoStatValue = styled.span<{ isRed?: boolean }>`
  font-size: 16px;
  color: ${(props) => (props.isRed ? "var(--color-danger)" : "#1a1d26")};
  text-align: center;

  p {
    display: flex;
    flex-direction: row;
    font-size: 14px;
    font-weight: var(--font-weight-regular);
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
`;

export const InfoDetailsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 480px;
`;

export const InfoDetailRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const InfoDetailIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 8px;
  flex-shrink: 0;
`;

export const InfoDetailLabel = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-regular);
  color: #728094;
  flex: 1;
`;

export const InfoDetailValue = styled.span<{ isVerified?: boolean }>`
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  color: ${(props) => {
    if (props.isVerified === true) return "var(--color-primary)";
    if (props.isVerified === false) return "var(--color-danger)";
    return "#1a1d26";
  }};
`;


export const EmptySectionWrapper = styled.div`
  display: flex;
  flex: 1 1 auto;
  width: 100%;
  min-height: 420px;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

export const CloseButton = styled.button`
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: transparent;
  cursor: pointer;
`
