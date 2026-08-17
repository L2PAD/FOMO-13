import React, { useState } from "react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { Swiper, SwiperSlide, useSwiper } from "swiper/react";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { IProject } from "../../../../../types/global_types";
import { Title, Wrapper, Items, ArrowsWrapper } from "./styles";
import { ProjectCardItem } from "../../Crypto/styles";
import fetchPersonsByQuery from "../../../../../http/persons/fetchPersonsByQuery";
import { useQuery } from "react-query";
import { PlaceholdersRow } from "../../Crypto/FomoSpotlight/styles";
import Placeholder from "../../../../global/common/Placeholder";

const limit = 30;

const FomoSpotlight = () => {
  const { data, isLoading } = useQuery(["persons-spotlight"], () =>
    fetchPersonsByQuery("?additionalStatus=sponsored")
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
                        Featured persons highlighted for their influence or promotional visibility on the platform                    
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
            breakpoints={{
              1024: {
                slidesPerView: 3,
              },
              768: {
                slidesPerView: 2,
              },
              320: {
                slidesPerView: 1,
              },
            }}
            loop
          >
            {data?.persons.map((item: any, i: number) => (
              <SwiperSlide key={`${item._id}${i}`}>
                <ProjectCardItem type="person-spotlight" cardData={item} />
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
