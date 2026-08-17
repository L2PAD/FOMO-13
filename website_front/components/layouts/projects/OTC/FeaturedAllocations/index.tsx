import React from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import Typography from "../../../../global/common/Typography";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import {
  Card,
  CardArrow,
  CardBody,
  CardHeader,
  Items,
  ProjectType,
  Title,
  Wrapper,
} from "./styles";
import UserAvatar from "../../../../global/common/UserAvatar";
import imageLoader from "../../../../../helpers/imageLoader";

import { featuredAllocations } from "../../../../../staticContent/otcFeaturedAllocations";
import { useQuery } from "react-query";
import fetchDeals from "../../../../../http/otc/fetchDeals";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import upperCaseFirstLetter from "../../../../../helpers/upperCaseFirstLetter";
import sliceAddress from "../../../../../helpers/sliceAddress";

const FeaturedAllocations = () => {
  const { isLoading, data, refetch } = useQuery(
    ['top-deals'],
    () => fetchDeals('all', `?limit=10&offset=0&sortField=reactions-desc`), { refetchOnWindowFocus: false }
  );

  return (
    <Wrapper>
      <Title>
        <span className="title-wrapper">Featured Allocations</span>
        <button className="tooltip-button">
          <InfoIcon />
          <span className="tooltip-text">
            Top picks with hype, trust, and a strong team behind them.{" "}
          </span>
        </button>
      </Title>
      <Items>
        <Swiper
          modules={[Autoplay, Navigation]}
          spaceBetween={20}
          slidesPerView={3}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          loop
          breakpoints={{
            320: {
              slidesPerView: 1,
              spaceBetween: 10,
              centeredSlides: true,
              autoplay: {
                delay: 2500,
                disableOnInteraction: false,
              },
            },
            578: {
              slidesPerView: 2,
              spaceBetween: 20,
              centeredSlides: false,
              autoplay: {
                delay: 3000,
                disableOnInteraction: false,
              },
            },
            966: {
              slidesPerView: 3,
              spaceBetween: 20,
              centeredSlides: false,
              autoplay: {
                delay: 3000,
                disableOnInteraction: false,
              },
            },
          }}
        >
          {
            data?.deals?.length
              ?
              data?.deals.map((item, i) => (
                <SwiperSlide key={`${item._id}${i}`}>
                  <Card>
                    <CardHeader>
                      <UserAvatar
                        avatar={item.creator.photo ? imageLoader(item.creator.photo) : item.creator?.twitterData?.photo}
                        size="otc"
                        variant="default"
                        name={item.creator.name}
                      />
                      <div className="project-info">
                        <Typography variant="h5">{item.creator.username}</Typography>
                        <ProjectType>{sliceAddress(item.creator.wallet)}</ProjectType>
                      </div>
                    </CardHeader>
                    <CardBody>
                      <div className="row">
                        <span className="left">Type: </span>
                        <span
                          className={`right ${item.type.toLowerCase()}`}
                        >
                          {upperCaseFirstLetter(item.type)}
                        </span>
                      </div>{" "}
                      <div className="row">
                        <span className="left">{item.isRealAsset ? 'Token Name' : 'Service Type'}:</span>
                        <span className="right">{item.serviceType}</span>
                      </div>{" "}
                      <div className="row">
                        <span className="left">Price:</span>
                        <span className="right">{item.price < 1 ? `${item.price}` : clarifyAmount(item.price)} {item.ticker.toUpperCase()}</span>
                      </div>
                      <CardArrow>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 20 20"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M11.3333 3L18 10M18 10L11.3333 17M18 10L2 10"
                            stroke="#738094"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </CardArrow>
                    </CardBody>
                  </Card>
                </SwiperSlide>
              ))
              :
              <></>
          }
        </Swiper>
      </Items>
    </Wrapper>
  );
};

export default FeaturedAllocations;
