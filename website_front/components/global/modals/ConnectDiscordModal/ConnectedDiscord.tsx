import React, { FC } from "react";
import Image from "next/image";
import { LinkIcon } from "../../Icons";
import discord from "../../../../public/static/main/discord.png";
import Button from "../../common/Button";
import { ButtonWrapper, ImageContentWrapper } from "./styles";

interface Props {
  onClose: () => void;
}

const ConnectedMetamaskModal: FC<Props> = ({ onClose }) => {
  return (
    <>
      <ButtonWrapper variant="success">
        <ImageContentWrapper>
          <Image width={124} height={107} src={discord.src} alt="Doscord" />
          <p>Discord connected</p>
          <span>
            Donskoy2x#1429
            <LinkIcon fill="#777777E8" />
          </span>
        </ImageContentWrapper>
      </ButtonWrapper>
      <Button
        variant="primary"
        className="success-button"
        onClick={() => {
          onClose();
        }}
      >
        Login to FOMO
      </Button>
    </>
  );
};

export default ConnectedMetamaskModal;
