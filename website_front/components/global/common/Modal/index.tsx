import React, { FC } from "react";
import { ArrowRightIcon, CloseIcon } from "../../Icons";
import Button from "../Button";
import {
  HeaderWrapper,
  InternalWrapper,
  ModalStyle,
  ModalVariant,
  ModalWrapper,
  Overlay,
  Title,
} from "./styles";
import { useRouter } from "next/router";

export interface ModalInterface {
  className?: string;
  variant?: ModalVariant;
  title: string;
  onClose: () => void;
  children: any;
  isTitle?: boolean;
  isBackBtn?: boolean;
  backBtnAction?: () => void;
}

const Modal: FC<ModalInterface> = ({
  className,
  variant = "small",
  title,
  onClose,
  children,
  isTitle = true,
  isBackBtn,
  backBtnAction,
}) => {
  const router = useRouter();

  return (
    <ModalWrapper className={className}>
      <Overlay className="overlay" onClick={onClose} />
      <ModalStyle className="modal-style" variant={variant}>
        <InternalWrapper className="internal-wrapper">
          {isTitle && (
            <HeaderWrapper className="header-wrapper">
              <div className="header-left">
                {isBackBtn ? (
                  <button
                    onClick={() =>
                      backBtnAction ? backBtnAction() : router.back()
                    }
                    className="back-btn"
                  >
                    <ArrowRightIcon />
                  </button>
                ) : (
                  <></>
                )}
                <Title className="modal-title">{title}</Title>
              </div>
              <Button onClick={onClose}>
                <CloseIcon fill="#738094" />
              </Button>
            </HeaderWrapper>
          )}
          <div className="content">{children}</div>
        </InternalWrapper>
      </ModalStyle>
    </ModalWrapper>
  );
};

export default Modal;
