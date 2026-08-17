import React, { useEffect, useId, useState } from "react";
import styled from "styled-components";
import PhotoIcon from "../../Icons/PhotoIcon";

const UploadContainer = styled.div<{ isDragging: boolean }>`
  width: 100%;
  height: 100%;
  border: 2px dashed ${(props) => (props.isDragging ? "#007bff" : "#ccc")};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  cursor: pointer;
  border-radius: 8px;
  background: ${(props) => (props.isDragging ? "#f0f8ff" : "#fafafa")};
  transition: all 0.3s ease;
`;

const PreviewImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
`;

const UploadInfo = styled.div`
  div {
    margin-top: 8px;
    font-size: 14px;
    color: var(--main-gray);
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

interface IProps {
  width?: number;
  height?: number;
  initialImage?: string | undefined;
  onChange: (image: File) => void;
}

const ImageUpload: React.FC<IProps> = ({
  width = 300,
  height = 300,
  initialImage,
  onChange,
}) => {
  const [image, setImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = useId();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      onChange(file);
      previewImage(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    onChange(file);
    if (file) previewImage(file);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const previewImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (initialImage) setImage(initialImage);
  }, [initialImage]);

  return (
    <>
      <UploadContainer
        className="upload-wrapper"
        style={{ maxWidth: `${width}px`, height: `${height}px` }}
        isDragging={isDragging}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById(inputId)?.click()}
      >
        {image ? (
          <PreviewImage src={image} alt="Uploaded" />
        ) : (
          <UploadInfo>
            <PhotoIcon />
            <div>
              ({width}x{height}px)
            </div>
          </UploadInfo>
        )}
      </UploadContainer>
      <HiddenInput
        id={inputId}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
    </>
  );
};

export default ImageUpload;
