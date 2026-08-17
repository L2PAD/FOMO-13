import React, { FC } from "react";
import Image from "next/image";
import discord from "../../../../public/static/main/discord.png";
import Button from "../../common/Button";
import { ButtonWrapper, ImageContentWrapper } from "./styles";

interface Props {
  confirmConnect: () => Promise<void>;
}

const DefaultContent: FC<Props> = ({ confirmConnect }) => {
  return (
    <>
      <ButtonWrapper>
        <ImageContentWrapper>
          <Image width={124} height={107} src={discord.src} alt="Doscord" />
          <p>Connect Discord!</p>
        </ImageContentWrapper>
      </ButtonWrapper>
      <Button
        variant="primary"
        className="success-button"
        onClick={() => {
          confirmConnect();
        }}
      >
        Login
      </Button>
    </>
  );
};

export default DefaultContent;
