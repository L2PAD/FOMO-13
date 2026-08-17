import React from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalImage = styled.img`
  max-width: 90%;
  max-height: 90%;
  border-radius: 10px;
`;

const ImageModal: React.FC<{ src: string; onClose: () => void }> = ({
  src,
  onClose,
}) => {
  return (
    <ModalOverlay onClick={onClose}>
      <ModalImage
        src={src}
        alt="Modal preview"
        onClick={(e) => e.stopPropagation()}
      />
    </ModalOverlay>
  );
};

export default ImageModal;
