import React, { FC, useEffect, useState, useRef } from "react";
import { ArrowRightIcon, CloseIcon } from "../../Icons";
import Button from "../Button";
import {
  CustomTitleWrapper,
  DescriptionWrapper,
  HeaderWrapper,
  InternalWrapper,
  ModalStyle,
  ModalVariant,
  ModalWrapper,
  Overlay,
  Title,
} from "./styles";
import InfoIcon from "../../Icons/InfoIcon";
import DescriptionComponent from "../DescriptionComponent";
import ArrowSelectIcon from "../../Icons/ArrowSelectIcon";
import ArrowBackIcon from "../../Icons/ArrowBackIcon";

export interface ModalInterface {
  className?: string;
  variant?: ModalVariant;
  title: string;
  children: any;
  isTitle?: boolean;
  isTitleInfo?: boolean;
  titleDescription?: string;
  isVisible: boolean;
  CustomTitle?: React.ReactNode;
  customTitleClassName?: string;
  isCloseIcon?: boolean;
  onClose: () => void;
  isModalBack?: () => void;
  style?: React.CSSProperties;
}

const MainModal: FC<ModalInterface> = ({
  className,
  variant = "small",
  title,
  children,
  isVisible,
  isTitle = true,
  isTitleInfo,
  titleDescription,
  CustomTitle,
  customTitleClassName,
  isCloseIcon = true,
  onClose,
  isModalBack,
  style,
}) => {
  const [isDescription, setIsDescription] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isFirstRender, setIsFirstRender] = useState(true);
  const hasOpenedRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);

      if (isFirstRender) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setIsFirstRender(false);
          });
        });
      }

      hasOpenedRef.current = true;
    } else {
      if (hasOpenedRef.current) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setShouldRender(false);
        }, 100);
      } else {
        setShouldRender(false);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isVisible, isFirstRender]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <ModalWrapper
      isVisible={isVisible}
      $isFirstRender={isFirstRender}
      className={className}
    >
      <Overlay onClick={onClose} />
      <ModalStyle
        isVisible={isVisible}
        $isFirstRender={isFirstRender}
        className="modal-style"
        variant={variant}
        style={style}
      >
        <InternalWrapper className="internal-wrapper">
          {isTitle && (
            <HeaderWrapper className="header-wrapper">
              {CustomTitle ? (
                React.isValidElement(CustomTitle) ? (
                  <CustomTitleWrapper className={customTitleClassName}>
                    {isModalBack && (
                      <button onClick={isModalBack} className="arrow-back">
                        <ArrowBackIcon />
                      </button>
                    )}
                    {CustomTitle}
                  </CustomTitleWrapper>
                ) : (
                  <></>
                )
              ) : (
                <Title className="modal-title">
                  {isModalBack && (
                    <button
                      type="button"
                      onClick={isModalBack}
                      className="arrow-back"
                    >
                      <ArrowBackIcon />
                    </button>
                  )}
                  {title}
                  {isTitleInfo && (
                    <button
                      type="button"
                      onMouseEnter={() => setIsDescription(true)}
                      onMouseLeave={() => setIsDescription(false)}
                    >
                      <InfoIcon />
                    </button>
                  )}
                  {titleDescription && (
                    <DescriptionComponent
                      className="main-modal-description"
                      isVisible={isDescription}
                      text={titleDescription}
                      isDate={false}
                      date={new Date()}
                    />
                  )}
                </Title>
              )}
              {isCloseIcon ? (
                <Button className="close-modal-icon" onClick={onClose}>
                  <CloseIcon fill="#738094" />
                </Button>
              ) : (
                <></>
              )}
            </HeaderWrapper>
          )}
          <div className="content">{children}</div>
        </InternalWrapper>
      </ModalStyle>
    </ModalWrapper>
  );
};

export default MainModal;