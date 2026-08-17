import React, { FC } from "react";
import Image from "next/image";
import EmptyImg from "../../../assets/images/empty.png";
import { EmptyWrapper } from "./styles";
import { useTranslation } from "i18n";

interface IProps {
  imgWidth?: number;
  textWidth?: number;
  fontSize?: number;
  lineHeight?: number;
  gap?: number;
}

const EmptyList: FC<IProps> = ({
  imgWidth = 280,
  textWidth = 450,
  fontSize = 24,
  gap = 40,
  lineHeight = 220,
}) => {
  const { translateText } = useTranslation();

  return (
    <EmptyWrapper style={{ gap }}>
      <Image
        style={{ maxWidth: `${imgWidth}px` }}
        src={EmptyImg}
        alt="Empty list"
      />
      <div
        style={{
          maxWidth: `${textWidth}px`,
          fontSize: `${fontSize}px`,
          lineHeight: `${lineHeight}%`,
        }}
      >
        {translateText("No search results!")}
        <br />
        {translateText("We even searched our pockets but nothing")}
      </div>
    </EmptyWrapper>
  );
};

export default EmptyList;
