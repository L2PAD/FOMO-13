import React, { useState } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { Title, Wrapper, Items, ArrowsWrapper } from "./styles";
import { ProjectCardItem } from "../../Crypto/styles";
import fetchFundsByQuery from "../../../../../http/funds/fetchFundsByQuery";
import { useQuery } from "react-query";
import { PlaceholdersRow } from "../../Crypto/FomoSpotlight/styles";
import Placeholder from "../../../../global/common/Placeholder";

const limit = 30;

const FomoSpotlight = () => {
  const { data, isLoading } = useQuery(["funds-spotlight"], () =>
    fetchFundsByQuery(
      `?offset=${0 * limit}&limit=${limit}&sortKey=createdAt&sortNumberValue=-1&additionalStatus=sponsored`
    )
  );
  const [swiper, setSwiper] = useState<any>(null);
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const [isHover, setIsHover] = useState<boolean>(false);

  return (
    <Wrapper>
      <Title>
        <span className="title-wrapper">FOMO Spotlight</span>
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
          text={`<div>
                        These funds are currently receiving enhanced visibility — either due to being newly added or featured by request                    
                        </div>`}
        />
      </Title>
      {isLoading ? (
        <PlaceholdersRow>
          <Placeholder height="180px" />
          <Placeholder height="180px" />
          <Placeholder height="180px" />
        </PlaceholdersRow>
      ) : (
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
              320: {
                slidesPerView: 1,
              },
              768: {
                slidesPerView: 2,
              },
              1024: {
                slidesPerView: 3,
              },
            }}
          >
            {data?.funds.map((item: any, i: number) => (
              <SwiperSlide key={`${item._id}${i}`}>
                <ProjectCardItem type="fund-spotlight" cardData={item} />
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
      )}
    </Wrapper>
  );
};

export default FomoSpotlight;
