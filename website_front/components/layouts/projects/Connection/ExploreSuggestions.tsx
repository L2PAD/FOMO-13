import React from "react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/autoplay";
import styled from "styled-components";
import InfoIcon from "../../../global/Icons/InfoIcon";
import UserAvatar from "../../../global/common/UserAvatar";
import imageLoader from "../../../../helpers/imageLoader";
import useMediaQuery from "../../../../hooks/useMediaQuery";

const Wrapper = styled.div`
  width: 100%;
  overflow: hidden;
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;

  .title-wrapper {
    font-weight: var(--font-weight-semibold);
    font-size: 32px;
    line-height: 1;
    color: #070b35;
    margin-right: 10px;

    @media (max-width: 768px) {
      font-size: 24px;
    }
  }
`;

const Items = styled.div`
  position: relative;

  .swiper {
    overflow: visible !important;
  }
`;

const Card = styled.div`
  background: #f5fbfd;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    height: 180px;
    padding: 12px;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  img {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    object-fit: cover;
  }

  h5 {
    font-size: 14px;
    font-weight: var(--font-weight-semibold);
    color: #070b35;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
      font-size: 14px;
    }
  }

  span {
    color: #738094;
    font-size: 14px;
  }
  .avatar-placeholder {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: var(--font-weight-semibold);
    font-size: 18px;
  }

  .badge {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #04a584;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;

    svg {
      width: 10px;
      height: 10px;
      fill: white;
    }
  }
`;

const CardContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  .ticker {
    font-size: 14px;
    color: #738094;
    font-weight: var(--font-weight-regular);
  }
`;

const Stats = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: auto;

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;

    .label {
      color: #738094;
      opacity: 1;
    }

    .value {
      font-weight: var(--font-weight-semibold);
      color: #070b35;

      &.persons {
        color: #070b35;
      }

      &.funds {
        color: #8a53ff;
      }

      &.projects {
        color: #04a584;
      }
    }
  }
`;

interface SuggestionCard {
  _id: string;
  name: string;
  ticker: string;
  logo: string;
  totalRelations: number;
  persons: number;
  funds: number;
  projects: number;
  verified?: boolean;
}

interface ExploreSuggestionsProps {
  suggestions?: SuggestionCard[];
}

const mockSuggestions: SuggestionCard[] = [
  {
    _id: "1",
    name: "Delta Arc Fund",
    ticker: "TON",
    logo: "/71460.67482688709_Ellipse 1 (2).png",
    totalRelations: 453,
    persons: 53,
    funds: 200,
    projects: 200,
    verified: true,
  },
  {
    _id: "2",
    name: "Fluxbridge Capital",
    ticker: "SOL",
    logo: "/71460.67482688709_Ellipse 1 (2).png",
    totalRelations: 453,
    persons: 53,
    funds: 200,
    projects: 200,
    verified: true,
  },
  {
    _id: "3",
    name: "Ariadne Ko",
    ticker: "ADA",
    logo: "/71460.67482688709_Ellipse 1 (2).png",
    totalRelations: 453,
    persons: 53,
    funds: 200,
    projects: 200,
    verified: true,
  },
  {
    _id: "4",
    name: "Binance Ventures",
    ticker: "BNB",
    logo: "/71460.67482688709_Ellipse 1 (2).png",
    totalRelations: 542,
    persons: 68,
    funds: 250,
    projects: 224,
    verified: true,
  },
  {
    _id: "5",
    name: "Coinbase Ventures",
    ticker: "USDC",
    logo: "/71460.67482688709_Ellipse 1 (2).png",
    totalRelations: 389,
    persons: 45,
    funds: 180,
    projects: 164,
    verified: true,
  },
];

const ExploreSuggestions: React.FC<ExploreSuggestionsProps> = ({
  suggestions = mockSuggestions,
}) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  return (
    <Wrapper>
      <Title>
        <span className="title-wrapper">Explore suggestions</span>
        <button className="tooltip-button">
          <InfoIcon />
          <span
            className="tooltip-text"
            style={{
              width: 300,
              whiteSpace: "wrap",
              left: isMobile ? "-60px" : "50%",
            }}
          >
            Shows recommended entities you may want to explore based on network
            relevance and activity
          </span>
        </button>
      </Title>
      <Items>
        <Swiper
          modules={[Autoplay]}
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
          {suggestions.map((item, i) => (
            <SwiperSlide key={`${item._id}${i}`}>
              <Card>
                <CardHeader>
                  <UserAvatar
                    size="otc"
                    variant={"default"}
                    avatar={imageLoader("/71460.67482688709_Ellipse 1 (2).png")}
                    name={"ETH"}
                    className="investor-avatar"
                  />
                  <div className="">
                    {" "}
                    <h5>{item.name}</h5>
                    <span className="ticker">{item.ticker}</span>
                  </div>
                </CardHeader>
                <Stats>
                  <div className="stat-row">
                    <span className="label">Total Relations:</span>
                    <span className="value">{item.totalRelations}</span>
                  </div>
                  <div className="stat-row">
                    <span className="label">Persons:</span>
                    <span className="value">{item.persons}</span>
                  </div>
                  <div className="stat-row">
                    <span className="label">Funds:</span>
                    <span className="value">{item.funds}</span>
                  </div>
                  <div className="stat-row">
                    <span className="label">Projects:</span>
                    <span className="value">{item.projects}</span>
                  </div>
                </Stats>
              </Card>
            </SwiperSlide>
          ))}
        </Swiper>
      </Items>
    </Wrapper>
  );
};

export default ExploreSuggestions;
