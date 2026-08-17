import React, { FC, useRef } from "react";
import { Bottom, InputWrapper, SendButton } from "../styles";
import AttachmentPreview from "./AttachmentPreview";
import { UploadedAttachment } from "../../../../../services/messages/uploadAttachment";

interface ChatInputProps {
  message: string;
  attachments: UploadedAttachment[];
  isUploading: boolean;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  onFileClick: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const PaperclipIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M21.44 11.05L12.25 20.24C9.76 22.73 5.73 22.73 3.24 20.24C0.75 17.75 0.75 13.72 3.24 11.23L12.43 2.04C14.09 0.38 16.78 0.38 18.44 2.04C20.1 3.7 20.1 6.39 18.44 8.05L9.25 17.24C8.42 18.07 7.08 18.07 6.25 17.24C5.42 16.41 5.42 15.07 6.25 14.24L14.73 5.76"
      stroke="#728094"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M22 2L11 13"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M22 2L15 22L11 13L2 9L22 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ChatInput: FC<ChatInputProps> = ({
  message,
  attachments,
  isUploading,
  onMessageChange,
  onSend,
  onFileChange,
  onRemoveAttachment,
  onFileClick,
  fileInputRef,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageChange(e.target.value);

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        120
      )}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Bottom>
      <InputWrapper>
        <textarea
          ref={textareaRef}
          placeholder="Type message..."
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
      </InputWrapper>
      <AttachmentPreview attachments={attachments} onRemove={onRemoveAttachment} />
      <button
        className="file-button"
        onClick={onFileClick}
        disabled={isUploading}
        title="Attach file"
      >
        <PaperclipIcon />
      </button>
      <SendButton onClick={onSend}>
        <span>Send</span>
        <SendIcon />
      </SendButton>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={onFileChange}
        style={{ display: "none" }}
      />
    </Bottom>
  );
};

export default ChatInput;
