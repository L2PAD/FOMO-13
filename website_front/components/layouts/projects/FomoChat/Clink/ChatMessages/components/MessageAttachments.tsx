import React, { FC } from "react";
import imageLoader from "../../../../../../../helpers/imageLoader";

interface Attachment {
  url: string;
  name?: string;
  type?: string;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
}

const MessageAttachments: FC<MessageAttachmentsProps> = ({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="attachments">
      {attachments.map((file, index) => {
        const isImage = file.type?.startsWith("image/");
        return (
          <div className="attachment" key={`${file.url}-${index}`}>
            {isImage ? (
              <img
                src={imageLoader(file.url)}
                alt={file.name || "attachment"}
              />
            ) : (
              <a
                href={imageLoader(file.url)}
                target="_blank"
                rel="noreferrer"
              >
                {file.name || "Download file"}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MessageAttachments;
