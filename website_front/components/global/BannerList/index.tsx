import React, { FC } from "react";
import { useQuery } from "react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import BannerItem from "./item";
import getSlides from "../../../http/banner/getSlides";
import { ItemWrapper, ListWrapper } from "./styles";
import { IBannerItem } from "../../../types/global_types";
import "swiper/css/pagination";
import "swiper/css";
import Placeholder from "../common/Placeholder";

interface IProps {
  path: string;
}

const BannerList: FC<IProps> = ({ path }) => {
  const { data, isLoading } = useQuery(["banner", path], () => getSlides(path));

  return isLoading ? (
    <Placeholder
      borderRadius="16px"
      width="100%"
      height="240px"
      marginBottom="0px"
    />
  ) : data?.list?.length && data.list.length === 1 ? (
    <ItemWrapper>
      <BannerItem item={data.list[0]} />
    </ItemWrapper>
  ) : (
    <ListWrapper>
      <Swiper
        modules={[Pagination]}
        spaceBetween={50}
        slidesPerView={1}
        onSwiper={(swiper: any) => console.log(swiper)}
        pagination={{ clickable: true }}
      >
        {data?.list ? (
          data?.list.map((item: IBannerItem) => {
            return (
              <SwiperSlide key={item._id}>
                <BannerItem item={item} />
              </SwiperSlide>
            );
          })
        ) : (
          <></>
        )}
      </Swiper>
    </ListWrapper>
  );
};

export default BannerList;
