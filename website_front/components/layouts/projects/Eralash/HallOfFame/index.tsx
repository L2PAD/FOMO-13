import React, { FC, useState } from "react";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { Title, Wrapper } from "./styles";
import { IPerson, IProject } from "../../../../../types/global_types";
import EralashCard from "../EralashCard";
import { ArrowsWrapper, Items } from "../../Crypto/FomoSpotlight/styles";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { useTranslation } from "i18n";

interface IProps {
  items: Array<any>;
}

const HallOfFame: FC<IProps> = ({ items }) => {
  const { t } = useTranslation();
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const [swiper, setSwiper] = useState<any>(null);
  const [isHover, setIsHover] = useState<boolean>(false);

  return (
    <Wrapper>
      <Title>
        <span className="title-wrapper">{t("eralash.hallOfFame.title")}</span>
        <button
          onMouseEnter={() => setIsDescription(true)}
          onMouseLeave={() => setIsDescription(false)}
        >
          <InfoIcon />
        </button>
        <DescriptionComponent
          className="eralash-description"
          isVisible={isDescription}
          date={new Date()}
          isDate={false}
          text={t("eralash.hallOfFame.description")}
        />
      </Title>
      <Items
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={20}
          slidesPerView={3}
          onSwiper={setSwiper}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop
          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 12 },
            480: { slidesPerView: 1.2, spaceBetween: 14 },
            640: { slidesPerView: 2, spaceBetween: 16 },
            1024: { slidesPerView: 3, spaceBetween: 20 },
          }}
        >
          {items.map((item: IProject | IPerson, i: number) => {
            return (
              <SwiperSlide key={`${item._id}${i}`}>
                <EralashCard item={item} />
              </SwiperSlide>
            );
          })}
        </Swiper>
        {isHover && swiper && (
          <ArrowsWrapper>
            <button onClick={() => swiper.slidePrev()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M15 4.5L7.5 12L15 19.5"
                  stroke="#738094"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button onClick={() => swiper.slideNext()}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 4.5L16.5 12L9 19.5"
                  stroke="#738094"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </ArrowsWrapper>
        )}
      </Items>
    </Wrapper>
  );
};

export default HallOfFame;
