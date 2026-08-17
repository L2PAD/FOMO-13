import React, { FC, useState } from "react";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import { Title, Wrapper } from "./styles";
import {
  IFomonautTableData,
  IPerson,
  IProject,
} from "../../../../../types/global_types";
import {
  ArrowsWrapper,
  Items,
} from "../../../projects/Crypto/FomoSpotlight/styles";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import TopGainerCard from "../FomiesCard";
import { useQuery } from "react-query";
import fetchItems from "../../../../../http/fetchItems";

const TopGainers = () => {
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const [swiper, setSwiper] = useState<any>(null);
  const [isHover, setIsHover] = useState<boolean>(false);
  const { data, isLoading } = useQuery(
    ["gainers"],
    () => fetchItems(`user/fomonauts/all?offset=${0}&limit=${10}`),
    {
      refetchOnWindowFocus: false,
    }
  );


  if (!data?.data?.users?.length) return <></>;
  return (
    <Wrapper>
      <Title>
        <span className="title-wrapper">Top  Gainers of the Day</span>
        <button
          onMouseEnter={() => setIsDescription(true)}
          onMouseLeave={() => setIsDescription(false)}
        >
          <InfoIcon />
        </button>
        <DescriptionComponent
          className="fomonauts-description"
          isVisible={isDescription}
          date={new Date()}
          isDate={false}
          text={`<div>
             Daily movers from all portfolios – biggest risers and fallers in the last 24h. 
                    </div>`}
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
          breakpoints={{
            0: { slidesPerView: 1, spaceBetween: 12 },
            520: { slidesPerView: 2, spaceBetween: 16 },
            820: { slidesPerView: 3, spaceBetween: 18 },
            1280: { slidesPerView: 4, spaceBetween: 20 },
          }}
          onSwiper={setSwiper}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop
        >
          {data?.data?.users?.length ? (
            data?.data?.users.map((item: any, i: number) => {
              return (
                <SwiperSlide key={`${item._id}${i}`}>
                  <TopGainerCard item={item} />
                </SwiperSlide>
              );
            })
          ) : (
            <></>
          )}
        </Swiper>
        {isHover && swiper && window.innerWidth >= 820 && (
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

export default TopGainers;
