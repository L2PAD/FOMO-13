import styled from "styled-components";
import Modal from "../../../../global/common/Modal";

export const ChatWrapper = styled.div`
  max-height: 80vh;
  overflow-y: auto;
`;

export const ModalWrapper = styled(Modal)`
  & > div > div {
    padding: 0;

    & > div:first-child {
      padding: 16px 16px 0;
    }
  }
`;

export const MessageWrapper = styled.div<{ isUser: boolean }>`
  display: flex;
  gap: 12px;
  padding: 16px;
  background: ${({ isUser }) => (isUser ? "" : "#F5F9FD")};

  .user-image {
    img {
      border-radius: 8px !important;
    }
  }
`;

export const MessageDataWrapper = styled.div`
  & > div:first-child {
    display: flex;
    justify-content: space-between;
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: var(--color-text-muted);
  }

  & > div:last-child {
    font-weight: var(--font-weight-regular);
    font-size: 16px;
    line-height: 19px;
    color: #0d0f2b;
  }
`;
