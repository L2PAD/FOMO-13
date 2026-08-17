import React, { useState, useEffect, FC } from "react";
import { Item, Row, Wrapper } from "./styles";
import UserAvatar from "../../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../../helpers/imageLoader";
import { clarifyAmount } from "../../../../../../../helpers/clarifyAmount";
import { SliderWrapper } from "../styles";

// Import Swiper and modules
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import { UnlockTableRow } from "../../../../../../../helpers/analyzeVestingSchedule";

const unlocksData = [
  {
    logo: "/inv1.png",
    name: "BeFi Labs",
    niche: "BEFI",
    date: "Jan 25",
    unlock: "BEFI 1.08M",
    percent: 1.39,
    marketCap: 14960,
  },
  {
    logo: "/inv2.png",
    name: "Pintu Token",
    niche: "PTU",
    date: "Jan 25",
    unlock: "PTU 2.08M",
    percent: 8.89,
    marketCap: 378720,
  },
  {
    logo: "/inv3.png",
    name: "SatoshiDEX",
    niche: "SATX",
    date: "Jan 25",
    unlock: "SATX 28.06M",
    percent: 2.39,
    marketCap: 15960,
  },
  {
    logo: "/inv4.png",
    name: "Tenet",
    niche: "TENET",
    date: "Jan 25",
    unlock: "TENET 29.18M",
    percent: 7.02,
    marketCap: 76320,
  },
  {
    logo: "/inv1.png",
    name: "BeFi Labs",
    niche: "BEFI",
    date: "Jan 25",
    unlock: "BEFI 1.08M",
    percent: 1.39,
    marketCap: 14960,
  },
  {
    logo: "/inv2.png",
    name: "Pintu Token",
    niche: "PTU",
    date: "Jan 25",
    unlock: "PTU 2.08M",
    percent: 8.89,
    marketCap: 378720,
  },
  {
    logo: "/inv3.png",
    name: "SatoshiDEX",
    niche: "SATX",
    date: "Jan 25",
    unlock: "SATX 28.06M",
    percent: 2.39,
    marketCap: 15960,
  },
  {
    logo: "/inv4.png",
    name: "Tenet",
    niche: "TENET",
    date: "Jan 25",
    unlock: "TENET 29.18M",
    percent: 7.02,
    marketCap: 76320,
  },
  {
    logo: "/inv1.png",
    name: "BeFi Labs",
    niche: "BEFI",
    date: "Jan 25",
    unlock: "BEFI 1.08M",
    percent: 1.39,
    marketCap: 14960,
  },
  {
    logo: "/inv2.png",
    name: "Pintu Token",
    niche: "PTU",
    date: "Jan 25",
    unlock: "PTU 2.08M",
    percent: 8.89,
    marketCap: 378720,
  },
  {
    logo: "/inv3.png",
    name: "SatoshiDEX",
    niche: "SATX",
    date: "Jan 25",
    unlock: "SATX 28.06M",
    percent: 2.39,
    marketCap: 15960,
  },
  {
    logo: "/inv4.png",
    name: "Tenet",
    niche: "TENET",
    date: "Jan 25",
    unlock: "TENET 29.18M",
    percent: 7.02,
    marketCap: 76320,
  },
];

const UpcomingUnlocks : FC<{unlocks:UnlockTableRow[]}> = ({unlocks}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 991);
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Render a single item
  const renderItem = (item: any, index: number) => (
    <Item variant="main" key={index}>
      <div className="header">
        <div className="project">
          <UserAvatar
            variant="success"
            rating={94}
            size="otc"
            avatar={imageLoader(item.logo)}
            name={item.name}
            fallbackType="project"
          />
          <div className="info">
            <div>{item.name}</div>
            <span>{item.niche}</span>
          </div>
        </div>
        <div className="date">{item.date}</div>
      </div>
      <div className="bottom">
        <div className="bottom-row">
          <div>Unlock:</div>
          <div className="value">{item.unlock}</div>
        </div>
        <div className="bottom-row">
          <div className="value">{item.percent}%</div>
          <span>of M. Cap (${clarifyAmount(item.marketCap)})</span>
        </div>
      </div>
    </Item>
  );

  return (
    <Wrapper>
      {isMobile ? (
        <SliderWrapper>
          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            spaceBetween={16}
            slidesPerView={1}
            breakpoints={{
              576: {
                slidesPerView: 2,
                spaceBetween: 20,
              },
              768: {
                slidesPerView: 2.5,
                spaceBetween: 20,
              },
            }}
          >
            {unlocksData.map((item, index) => (
              <SwiperSlide key={index}>{renderItem(item, index)}</SwiperSlide>
            ))}
          </Swiper>
        </SliderWrapper>
      ) : (
        <Row>{unlocksData.map((item, index) => renderItem(item, index))}</Row>
      )}
    </Wrapper>
  );
};

export default UpcomingUnlocks;
