import React, { FC, useState } from "react";
import styled from "styled-components";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import imageLoader from "../../../helpers/imageLoader";

const Items = styled.div`
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background: #f5f7fa;
`;

const SlideImg = styled.img`
  display: block;
  width: 100%;
  height: clamp(220px, 42vw, 490px);
  object-fit: contain;
  object-position: center;
  background: #f5f7fa;
`;

export const ArrowsWrapper = styled.div`
  position: absolute;
  z-index: 10;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  background: linear-gradient(
    90deg,
    #ffffff 0%,
    rgba(255, 255, 255, 0.18) 10%,
    rgba(255, 255, 255, 0) 15%,
    rgba(255, 255, 255, 0) 84.5%,
    rgba(255, 255, 255, 0.249) 90.5%,
    #ffffff 100%
  );

  display: flex;
  justify-content: space-between;

  button {
    padding: 6px;
  }
`;

interface IProps {
  items: Array<string>;
}

const ImagesSwiper: FC<IProps> = ({ items }) => {
  const [swiper, setSwiper] = useState<any>(null);
  const [isHover, setIsHover] = useState<boolean>(false);

  return (
    <Items
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <Swiper
        modules={[Autoplay, Navigation]}
        spaceBetween={20}
        slidesPerView={1}
        onSwiper={setSwiper}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        loop
      >
        {items.map((item: string, i: number) => (
          <SwiperSlide key={i}>
            <SlideImg alt="image" src={imageLoader(item)} />
          </SwiperSlide>
        ))}
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
  );
};

export default ImagesSwiper;
