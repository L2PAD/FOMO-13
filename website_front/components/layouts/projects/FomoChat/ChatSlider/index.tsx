import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import Image from "next/image";
import "swiper/css";
import "swiper/css/navigation";
import {
  SliderWrapper,
  SlideCard,
  TagsRow,
  Tag,
  PostContent,
  UserInfo,
  UserAvatar,
  UserDetails,
  UserName,
  Timestamp,
  ArrowsWrapper,
  TagBadge,
} from "./styles";

interface ChatPost {
  id: string;
  tags: string[];
  content: string;
  user: {
    name: string;
    avatar: string;
  };
  timestamp: string;
  newCount?: number;
}

const mockPosts: ChatPost[] = [
  {
    id: "1",
    tags: ["Blockchain"],
    content:
      "Is it possible to get into data analytics in blockchain? Where do I even start?",
    user: {
      name: "Jessica Monroe",
      avatar: "/static/projects/avatar1.jpg",
    },
    timestamp: "09:55 pm",
    newCount: 1,
  },
  {
    id: "2",
    tags: ["AI", "Analytics"],
    content:
      "How $SOL Survived the Biggest Liquidation Event in Crypto History - While $ETH Choked - Bullish for $SOL, $UPXI, $DFDV, $FORD, $HS...",
    user: {
      name: "Daniel Foster",
      avatar: "/static/projects/avatar2.jpg",
    },
    timestamp: "09:55 pm",
  },
  {
    id: "3",
    tags: ["Strategy"],
    content:
      "I received a lump sum of $15k which I plan to invest in crypto. What would you recommend?",
    user: {
      name: "Christopher Hayes",
      avatar: "/static/projects/avatar3.jpg",
    },
    timestamp: "09:55 pm",
    newCount: 2,
  },
  {
    id: "4",
    tags: ["Strategy"],
    content:
      "I received a lump sum of $15k which I plan to invest in crypto. What would you recommend?",
    user: {
      name: "Christopher Hayes",
      avatar: "/static/projects/avatar3.jpg",
    },
    timestamp: "09:55 pm",
    newCount: 2,
  },
];

const ChatSlider = () => {
  const [swiper, setSwiper] = useState<any>(null);
  const [isHover, setIsHover] = useState<boolean>(false);

  return (
    <SliderWrapper
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      <Swiper
        modules={[Autoplay, Navigation]}
        spaceBetween={16}
        slidesPerView={3}
        onSwiper={setSwiper}
        autoplay={{
          delay: 4000,
          disableOnInteraction: false,
        }}
        breakpoints={{
          320: {
            slidesPerView: 1,
            spaceBetween: 12,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 14,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 16,
          },
        }}
        loop
      >
        {mockPosts.map((post) => (
          <SwiperSlide key={post.id}>
            <SlideCard>
              <TagsRow>
                {post.tags.map((tag, idx) => (
                  <Tag key={idx}>{tag}</Tag>
                ))}
                {post.newCount && <TagBadge>+{post.newCount}</TagBadge>}
              </TagsRow>
              <PostContent>{post.content}</PostContent>
              <UserInfo>
                <UserAvatar>
                  <Image
                    src={post.user.avatar}
                    alt={post.user.name}
                    width={40}
                    height={40}
                  />
                </UserAvatar>
                <UserDetails>
                  <UserName>{post.user.name}</UserName>
                  <Timestamp>{post.timestamp}</Timestamp>
                </UserDetails>
              </UserInfo>
            </SlideCard>
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
    </SliderWrapper>
  );
};

export default ChatSlider;
