import React, { useState } from "react";
import { Autoplay, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/navigation";
import Typography from "../../../../global/common/Typography";
import InfoIcon from "../../../../global/Icons/InfoIcon";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
// Importing from the styles
import {
  ArrowsWrapper,
  Badge,
  Card,
  CardArrow,
  CardBody,
  CardHeader,
  Items,
  Price,
  ProjectType,
  Title,
  Wrapper,
} from "../FeaturedAllocations/styles";
import UserAvatar from "../../../../global/common/UserAvatar";
import imageLoader from "../../../../../helpers/imageLoader";

import { featuredAllocations } from "../../../../../staticContent/otcFeaturedAllocations";
import { featuredAllocationsAlloc } from "../../../../../staticContent/featuredAllocationsAlloc";
import BuyNftModal from "../../../../global/modals/BuyModal";

const FeaturedAllocations = () => {
  const [swiper, setSwiper] = useState<any>(null);
  const [isDescription, setIsDescription] = useState<boolean>(false);
  const [isHover, setIsHover] = useState<boolean>(false);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState<boolean>(false);

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
          {featuredAllocationsAlloc.map((item, i) => (
            <SwiperSlide key={`${item.id}${i}`}>
              <Card onClick={() => setIsBuyModalOpen(true)}>
                <CardHeader>
                  <UserAvatar
                    avatar={imageLoader(item.photo)}
                    size="otc"
                    variant="default"
                    name={item.owner}
                  />
                  <div className="project-info">
                    <Typography variant="h5">{item.title}</Typography>
                    <ProjectType>{item.type}</ProjectType>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="row">
                    <span className="left">#{item.id}</span>
                    <span
                      className={`right ${item.badge.toLowerCase().replace(" ", "-")}`}
                    >
                      {item.badge}
                    </span>
                  </div>{" "}
                  <div className="row">
                    <span className="left">Owner</span>
                    <span className="right">{item.owner}</span>
                  </div>{" "}
                  <div className="row">
                    <span className="left">Floor Price:</span>
                    <span className="right">{item.price}</span>
                  </div>
                  <CardArrow>
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
                  </CardArrow>
                </CardBody>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </Items>
      {isBuyModalOpen && (
        <BuyNftModal onClose={() => setIsBuyModalOpen(false)} />
      )}
    </Wrapper>
  );
};

export default FeaturedAllocations;
