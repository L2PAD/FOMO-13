import styled from "styled-components";

export const ModalContent = styled.div<{ isChatExpanded: boolean }>`
  display: flex;
  gap: 40px;
  width: 100%;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    gap: 0;

    > .deal-info {
      display: ${({ isChatExpanded }) => (isChatExpanded ? "none" : "block")};
      width: 100%;
    }

    > .chat-sidebar {
      display: ${({ isChatExpanded }) => (isChatExpanded ? "flex" : "none")};
      width: 100%;
      max-width: 100%;
      padding-left: 0;
      border-left: none;
      max-height: 90vh;
      min-height: 90vh;
      height: 90vh;
    }
  }
`;

export const MainContent = styled.div`
  flex: 1;
  min-width: 0;
  margin-top: 40px;
`;

export const StepContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  height: 100%;
`;

export const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;

  &.blue {
    background: #f5fbfd;
    padding: 16px;
    border-radius: 8px;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const TermsText = styled.p`
  font-size: 14px;
  color: #728094;
  line-height: 1.6;
  margin: 0;
`;

export const SeeMore = styled.span`
  color: var(--color-info);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);

  &:hover {
    text-decoration: underline;
  }
`;

export const AmountInput = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f8f8f9;
  border-radius: 12px;
`;

export const AmountValue = styled.div`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const CurrencyBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
`;

export const CurrencyIcon = styled.span`
  font-size: 20px;
`;

export const USDTIcon = styled.span`
  font-size: 20px;
`;

export const InfoRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
`;

export const InfoLabel = styled.span`
  font-size: 12px;
`;

export const FeeText = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
`;

export const ReceiveAmount = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: #f8f8f9;
  border-radius: 12px;
`;

export const ReceiveValue = styled.div`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const EditIcon = styled.span`
  font-size: 16px;
  cursor: pointer;
  color: var(--color-primary);
  height: 24px;
  width: 32px;
  background: #e9f8f8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: auto;
  border-radius: 6px;

  svg {
    width: 12px;
    height: 12px;
  }
`;

export const PaymentMethodsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const PaymentMethodItem = styled.div<{ selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--color-text-primary);

  &:hover {
    background: rgba(4, 165, 132, 0.05);
  }
`;

export const Checkbox = styled.div<{ checked?: boolean }>`
  width: 18px;
  height: 18px;
  border: 2px solid ${({ checked }) => (checked ? "var(--color-primary)" : "#e8e8e8")};
  border-radius: 4px;
  background: ${({ checked }) => (checked ? "var(--color-primary)" : "transparent")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  ${({ checked }) =>
    checked &&
    `
    &::after {
      content: "✓";
      color: white;
      font-size: 14px;
      font-weight: var(--font-weight-semibold);
    }
  `}
`;

export const Divider = styled.div`
  width: 100%;
  height: 0px;
  border: 1px dashed #ffc704;
  margin: 8px 0;
`;

export const ButtonWrapper = styled.div`
  margin-top: auto;

  button {
    width: 100%;
    padding: 8px;
    font-size: 16px;
    border-radius: 8px;
  }
`;

export const ButtonsRow = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 20px;
  width:100%;
  button {
    width:50%
  }
`;

export const CancelButton = styled.button`
  flex: 1;
  padding: 16px;
  font-size: 16px;
  border-radius: 8px;
  background: none;
  color: var(--color-danger);
  border: none;
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #fff5f5;
  }

  &:active {
    background: #ffe8e8;
  }
`;

export const PaymentHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-radius: 12px;
`;

export const PaymentAmount = styled.div`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  margin-bottom: 16px;
  color: var(--color-text-primary);
  text-align: center;
`;

export const PaymentTimer = styled.div`
  font-size: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
`;

export const TimerValue = styled.div`
  font-size: 24px;
  font-weight: var(--font-weight-regular);
  color: #728094;
`;

export const SellerInfo = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  display: flex;
  gap: 8px;
  justify-content: space-between;
  width: 100%;
  margin: 20px 0;

  strong {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
`;

export const ChatButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 4px 14px 4px 14px;
  width: fit-content;
  margin-left: auto;
  background: var(--color-primary-soft);
  border-radius: 8px;
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  font-size: 14px;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(4, 165, 132, 0.15);
  }
`;

export const ChatNotification = styled.span`
  position: absolute;
  top: 6px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: var(--color-danger);
  border-radius: 50%;
  font-size: 6px;
  color: var(--color-white);
`;

export const WarningBox = styled.div`
  background: #fff9e6;
  border: 1px dashed #ffc704;
  border-radius: 8px;
  padding: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
`;

export const DetailsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  &.details-list{
    width:100%;
    margin:20px 0;
  }
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const DetailLabel = styled.span`
  font-size: 14px;
`;

export const DetailValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const CopyIcon = styled.span`
  cursor: pointer;
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

export const ReleasingHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #f5fbfd;
  border-radius: 12px;
`;

export const ReleasingText = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
`;

export const ReleaseTimer = styled.div`
  font-size: 32px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const EstimatedTime = styled.div`
  font-size: 14px;
  color: var(--color-text-muted);
`;

export const TimeHighlight = styled.span`
  color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
`;

export const OrderSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: #f5fbfd;
  border-radius: 12px;
`;

export const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SummaryLabel = styled.span`
  font-size: 14px;
`;

export const SummaryValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const AppealSuccess = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: rgba(4, 165, 132, 0.05);
  border-radius: 12px;
  text-align: center;
`;

export const SuccessTitle = styled.h2`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin: 0;
`;

export const SuccessMessage = styled.p`
  font-size: 14px;
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.6;
`;

export const ThanksMessage = styled.p`
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
  margin: 0;
`;

export const Select = styled.select`
  width: 100%;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text-primary);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const ErrorText = styled.div`
  font-size: 12px;
  color: var(--color-danger);
`;

export const Textarea = styled.textarea`
  width: 100%;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text-primary);
  resize: vertical;
  min-height: 100px;

  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const CharCount = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: right;
`;

export const UploadBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px;
  border: 2px dashed #e8e8e8;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    background: rgba(4, 165, 132, 0.02);
  }
`;

export const UploadIcon = styled.div`
  font-size: 48px;
`;

export const UploadText = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
  line-height: 1.5;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text-primary);

  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const CompletedWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const SuccessIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const CompletedAmount = styled.div`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  margin-top: 20px;
`;

export const CompletedText = styled.div`
  font-size: 14px;
  color: var(--color-text-primary);
  text-align: center;
  margin-bottom: 20px;
`;

export const RatingButtons = styled.div`
  display: flex;
  gap: 40px;
  justify-content: center;
`;

export const ThumbButton = styled.button<{ positive?: boolean }>`
  width: 100%;
  height: 140px;
  border: none;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

/* Chat Sidebar Styles */
export const ChatSidebar = styled.div`
  max-width: 550px;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-left: 1px solid #e8e8e8;
  height: 100%;
  max-height: 78vh;
  padding-left: 40px;

  @media (max-width: 768px) {
    border-left: none;
    padding-left: 0;
    height: 90vh;
    min-height: 90vh;
    max-height: 90vh;
  }
`;

export const ChatHeader = styled.div``;

export const ChatHeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ChatTitle = styled.h3`
  font-size: 14px;
  color: var(--color-text-primary);
  text-align: center;
  margin: 0;
  font-weight: var(--font-weight-regular);

  @media (max-width: 768px) {
    margin-top: 24px;
  }
`;

export const ChatInfo = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px 0;
`;

export const MobileStatusRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const ChatStatus = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;
`;

export const ChatAmount = styled.div`
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.4;

  strong {
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
  }
`;

export const ChatWarning = styled.div`
  background: #fff9e6;
  border: 1px dashed #ffc704;
  border-radius: 8px;
  padding: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.5;
  margin-bottom: 20px;
`;

export const SystemNotificationsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
`;

export const ChatBody = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

export const ChatEmbed = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;

  > * {
    flex: 1;
    min-height: 0;
  }

  .chats-wrapper {
    min-height: 0;
    max-height: none;
  }

  .chat-body {
    max-height: none;
  }
`;

export const ChatFallback = styled.div`
  flex: 1;
  border: 1px dashed #e8e8e8;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  color: var(--color-text-muted);
  font-size: 14px;
`;

export const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-right: 8px;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--color-surface-muted);
  }

  &::-webkit-scrollbar-thumb {
    background: #e8e8e8;
    border-radius: 3px;

    &:hover {
      background: #d1d5db;
    }
  }
`;

export const ChatMessage = styled.div<{ isUser: boolean }>`
  display: flex;
  gap: 12px;
  align-items: flex-start;
  flex-direction: ${({ isUser }) => (isUser ? "row-reverse" : "row")};
`;

export const ChatAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e8e8e8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const AvatarImg = styled.div`
  font-size: 20px;
`;

export const ChatMessageContent = styled.div<{ isUser: boolean }>`
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: ${({ isUser }) => (isUser ? "flex-end" : "flex-start")};
`;

export const ChatSender = styled.div`
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
`;

export const ChatText = styled.div<{ isUser: boolean }>`
  padding: 12px;
  background: ${({ isUser }) => (isUser ? "var(--color-primary)" : "var(--color-surface-muted)")};
  color: ${({ isUser }) => (isUser ? "white" : "var(--color-text-primary)")};
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.4;
  word-wrap: break-word;
  border: ${({ isUser }) => (isUser ? "none" : "1px solid #F0F2F5")};
`;

export const ChatTime = styled.div`
  font-size: 8px;
  color: var(--color-text-muted);
  margin-left: auto;
  &.align {
    margn-left: 0;
    margin-right: 56px;
  }
`;

export const LoadingIndicator = styled.div`
  text-align: center;
  padding: 12px;
  color: var(--color-text-muted);
  font-size: 12px;

  &.full-height {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
  }
`;

export const MobileHideChatButton = styled.button`
  display: none;

  @media (max-width: 768px) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: fit-content;
    padding: 4px 14px;
    border-radius: 8px;
    background: var(--color-primary-soft);
    color: var(--color-primary);
    font-size: 14px;
    font-weight: var(--font-weight-medium);
    transition: all 0.2s ease;

    &:hover {
      background: rgba(4, 165, 132, 0.15);
    }
  }
`;

export const MessageAttachments = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

export const AttachmentPreview = styled.div`
  img {
    max-width: 200px;
    max-height: 150px;
    border-radius: 8px;
    object-fit: cover;
  }

  a {
    display: inline-block;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 6px;
    color: var(--color-primary);
    text-decoration: none;
    font-size: 12px;

    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  }
`;

export const AttachmentsPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  border-top: 1px solid #e8e8e8;
`;

export const AttachmentItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--color-surface-muted);
  border-radius: 4px;
  font-size: 12px;
  color: var(--color-text-primary);

  span {
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  button {
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    font-size: 14px;
    padding: 0;
    line-height: 1;

    &:hover {
      color: var(--color-danger);
    }
  }
`;

export const MessageActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 4px;

  &.reverse {
    flex-direction: row-reverse;
  }
`;

export const MessageActionBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  color: var(--color-text-muted);
  padding: 4px;
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-primary);
  }
`;

export const SystemNotification = styled.div<{
  type: "warning" | "success";
}>`
  padding: 12px 16px;
  background: ${({ type }) =>
    type === "warning" ? "#fff9e6" : "rgba(4, 165, 132, 0.05)"};
  border: 1px solid
    ${({ type }) => (type === "warning" ? "#ffc107" : "var(--color-primary)")};
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const NotificationText = styled.div`
  font-size: 12px;
  color: var(--color-text-primary);
  line-height: 1.4;
  white-space: pre-line;
`;

export const NotificationTime = styled.div`
  font-size: 11px;
  color: var(--color-text-muted);
`;

export const ChatInputWrapper = styled.div`
  margin-top: 16px;
  display: flex;
  gap: 8px;
  align-items: center;

  .chat-input-container {
    flex: 1;
    position: relative;
  }
`;

export const ChatInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  font-family: inherit;
  font-size: 14px;
  color: var(--color-text-primary);
  width: 100%;

  &::placeholder {
    color: rgba(115, 128, 148, 0.5);
  }

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

export const AttachButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);

  &:hover {
    color: var(--color-primary);
  }
`;

export const SendButton = styled.button`
  padding: 10px 16px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const MinimizedBar = styled.div<{
  status: "pending" | "confirmed" | "rejected" | "cancelled";
}>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: ${({ status }) => {
    switch (status) {
      case "pending":
        return "var(--color-surface-muted)";
      case "rejected":
        return "#FFF5F5";
      case "cancelled":
        return "var(--color-danger)";
      case "confirmed":
        return "#F0FDF9";
      default:
        return "var(--color-surface-muted)";
    }
  }};
  border: 1px solid
    ${({ status }) => {
      switch (status) {
        case "pending":
          return "#E8E8E8";
        case "rejected":
          return "#FFE8E8";
        case "cancelled":
          return "var(--color-danger)";
        case "confirmed":
          return "#D1FAE5";
        default:
          return "#E8E8E8";
      }
    }};
  border-radius: 12px;
  padding: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  min-width: 400px;

  @media (max-width: 768px) {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
    min-width: 0;
    width: calc(100vw - 32px);
    max-width: 520px;
    padding: 18px 16px;
  }
`;

export const MinimizedContent = styled.div<{
  status?: "pending" | "confirmed" | "rejected" | "cancelled";
}>`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: var(--font-weight-semibold);
  font-size: 24px;
  color: ${({ status }) => (status === "cancelled" ? "var(--color-white)" : "var(--color-text-primary)")};

  svg {
    color: ${({ status }) =>
      status === "cancelled" ? "var(--color-white)" : "currentColor"};
  }
`;

export const ExpandButton = styled.button<{
  status?: "pending" | "confirmed" | "rejected" | "cancelled";
}>`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ status }) => (status === "cancelled" ? "var(--color-white)" : "var(--color-text-muted)")};
  transition: all 0.2s ease;

  &:hover {
    color: ${({ status }) =>
      status === "cancelled" ? "rgba(255, 255, 255, 0.8)" : "var(--color-primary)"};
    transform: scale(1.1);
  }
`;

export const MinimizeButton = styled.button`
  position: absolute;
  top: 30px;
  right: 30px;
  background: var(--color-white);
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    color: var(--color-primary);
    transform: scale(1.1);
  }
`;

export const StatusStateWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;

`;

export const StatusStateIcon = styled.div<{ variant?: "reserved" | "completed" }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${({ variant }) =>
    variant === "completed" ? "#E6F7F4" : "#E8F4FF"};
  display: flex;
  align-items: center;
  justify-content: center;

  .icon-inner {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: ${({ variant }) =>
      variant === "completed" ? "var(--color-primary)" : "#2196F3"};
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 40px;
      height: 40px;
      color: white;
      stroke-width: 3;
    }
  }
`;

export const StatusStateTitle = styled.h2<{ variant?: "reserved" | "completed" }>`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: ${({ variant }) => (variant === "completed" ? "var(--color-primary)" : "#2196F3")};
  margin: 0;
`;

export const StatusStateMeta = styled.div`
  .expires-label {
    font-size: 14px;
    color: var(--color-text-primary);
    font-weight: var(--font-weight-semibold);
    margin-bottom: 4px;
  }

  .expires-time {
    font-size: 24px;
    color: var(--color-text-muted);
  }
`;

export const StatusStateImage = styled.div`
  margin: 8px 0;
`;

export const StatusStateDescription = styled.div`
  font-size: 14px;
  color: var(--color-text-primary);
`;

export const StatusStateBalance = styled.div`
  width: 100%;
  background: #f5fbfd;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;

  .balance-left {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .balance-label {
    font-size: 16px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .balance-amount {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: var(--color-primary);
  }

  .balance-icon {
    display: flex;
    align-items: center;
    gap: 20px;
  }
`;

export const StatusStateInfo = styled.div`
  width: 100%;
  background: #fff9e6;
  border: 1px solid #ffd700;
  border-radius: 8px;
  padding: 16px;
  color: var(--color-text-muted);
  font-size: 14px;
`;
