import React, { FC } from "react";
import { CloseIcon } from "../Icons";
import { BannerWrapper, ButtonsWrapper, Title } from "./styles";
import { ILayoutBanner } from "../../../http/layout/fetchLayoutData";

interface Props {
  bannerData: ILayoutBanner;
  onClose: () => void;
}

const Banner: FC<Props> = ({ onClose, bannerData }) => {
  return (
    <BannerWrapper>
      <Title variant="p">{bannerData.text || "-"}</Title>
      <ButtonsWrapper>
        {bannerData.link ? (
          <a target="_blank" href={bannerData.link} rel="noreferrer">
            View details
          </a>
        ) : null}
        <span onClick={onClose}>
          <CloseIcon fill="#738094" />
        </span>
      </ButtonsWrapper>
    </BannerWrapper>
  );
};

export default Banner;
