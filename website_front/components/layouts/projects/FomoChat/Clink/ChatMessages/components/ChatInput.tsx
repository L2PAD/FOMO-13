import React, { FC, useEffect, useRef, useState } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import Image from "next/image";
import { Mic, Paperclip } from "lucide-react";
import smileSvg from "../../../../../../../assets/icons/smile.svg";
import telegramSvg from "../../../../../../../assets/icons/bxl_telegram.svg";
import { Bottom, InputWrapper, PickerWrapper, SendButton } from "../styles";
import AttachmentPreview from "./AttachmentPreview";
import { UploadedAttachment } from "../../../../../../../http/messages/uploadAttachment";
import { useTranslation } from "i18n";

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

const ChatInput: FC<ChatInputProps> = ({
  message,
  attachments,
  isUploading,
  onMessageChange,
  onSend,
  onFileChange,
  onRemoveAttachment,
  onFileClick,
  fileInputRef
}) => {
  const { t } = useTranslation();
  const [isPicker, setIsPicker] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const pickerToggleButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isPicker) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isInsidePicker = pickerRef.current?.contains(target);
      const isToggleButton = pickerToggleButtonRef.current?.contains(target);

      if (!isInsidePicker && !isToggleButton) {
        setIsPicker(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsPicker(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isPicker]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onMessageChange(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <Bottom>
      <InputWrapper>
        <button ref={pickerToggleButtonRef} onClick={() => setIsPicker((prev) => !prev)}>
          <Image src={smileSvg} alt="smile" />
        </button>
        <textarea
          ref={textareaRef}
          placeholder={t("chat.placeholders.typeMessage")}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
        />
      </InputWrapper>
      <AttachmentPreview
        attachments={attachments}
        onRemove={onRemoveAttachment}
      />
      {isPicker && (
        <PickerWrapper ref={pickerRef}>
          <Picker
            data={data}
            onEmojiSelect={(smile: any) =>
              onMessageChange(`${message}${smile.native}`)
            }
          />
        </PickerWrapper>
      )}
      <button onClick={onFileClick} disabled={isUploading}>
        <Paperclip width={32} color="#728094" />
      </button>
      <SendButton onClick={onSend}>
        <span>{t("chat.actions.send")}</span>
        <Image src={telegramSvg} alt="send message" />
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
