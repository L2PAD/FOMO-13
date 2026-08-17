import React, { FC } from "react";
import imageLoader from "../../../../../../../helpers/imageLoader";
import { UploadedAttachment } from "../../../../../../../http/messages/uploadAttachment";

interface AttachmentPreviewProps {
  attachments: UploadedAttachment[];
  onRemove: (index: number) => void;
}

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ attachments, onRemove }) => {
  if (attachments.length === 0) return null;

  return (
    <div className="attachments-preview">
      {attachments.map((file, index) => {
        const isImage = file.type?.startsWith("image/");
        return (
          <div className="attachment-chip" key={`${file.url}-${index}`}>
            {isImage ? (
              <img src={imageLoader(file.url)} alt={file.name || "file"} />
            ) : (
              <span>{file.name || "file"}</span>
            )}
            <button onClick={() => onRemove(index)}>×</button>
          </div>
        );
      })}
    </div>
  );
};

export default AttachmentPreview;
