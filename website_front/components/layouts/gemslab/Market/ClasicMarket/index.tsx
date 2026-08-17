import React, { FC, useState, useEffect } from "react";
import {
  FlexWrapper,
  MarketCardItem,
  MarketCardsWrapper,
  MobileMarketCardsSlider,
} from "../styles";
import CommentBlock from "../../../../global/CommentBlock";
import ApproveCollectionModal from "../../../projects/modals/ApproveCollectionModal";
import CooperationModal from "../../../../global/modals/CooperationModal";
import { IProject } from "../../../../../types/global_types";
import useComments from "../../../../../hooks/useComments";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import AllocFilter from "../../../../global/Filter/alloc-filter";
import { TableHeaderRightWrapper } from "../../../projects/CryptoMarket/styles";
import Image from "next/image";
import { Star } from "lucide-react";
import AllIcon from "../../../../../assets/icons/all-sort.svg";
import MarketFilter from "../../../../global/Filter/market-filter";
import { Button } from "../../../../global/common/Button";
import MakeOfferModal from "../../../../global/modals/MakeOffer";

interface IProps {
  projects: Array<IProject>;
}

const Market: FC<IProps> = ({ projects }) => {
  const { comments, confirmAddComment } = useComments(
    `comments/utility`,
    `comments/utility`
  );
  const [filterValue, setFilterValue] = useState("All");
  const [modal, setModal] = useState(false);
  const [makeOfferModal, setMakeOfferModal] = useState(false);
  const [approveCollectionModal, setApproveCollectionModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  return (
    <>
      <FlexWrapper>
        <TableHeaderRightWrapper>
          <button
            className={filterValue === "All" ? "selectedSort" : ""}
            onClick={() => setFilterValue("All")}
          >
            <Image src={AllIcon} alt="all" />
            All{" "}
          </button>
          <button
            className={filterValue === "favorite" ? "selectedSort" : ""}
            onClick={() => setFilterValue("favorite")}
          >
            <Star width={16} height={16} />
          </button>
          <button
            className={filterValue === "tier-1" ? "selectedSort" : ""}
            onClick={() => setFilterValue("tier-1")}
          >
            Tier-1
          </button>
          <button
            className={filterValue === "tier-2" ? "selectedSort" : ""}
            onClick={() => setFilterValue("tier-2")}
          >
            Tier-2
          </button>
          <button
            className={filterValue === "< 100k" ? "selectedSort" : ""}
            onClick={() => setFilterValue("< 100k")}
          >
            {"< 100k"}
          </button>
          <button
            className={filterValue === "100k-500k" ? "selectedSort" : ""}
            onClick={() => setFilterValue("100k-500k")}
          >
            100k-500k
          </button>
          <button
            className={filterValue === "> 500k" ? "selectedSort" : ""}
            onClick={() => setFilterValue("> 500k")}
          >
            {"> 500k"}
          </button>
        </TableHeaderRightWrapper>
        <FlexWrapper
          style={{
            flexDirection: "row",
            gap: "20px",
            width: "fit-content",
          }}
        >
          <Button
            className="make"
            variant="outlined"
            onClick={() => setMakeOfferModal(true)}
          >
            <span>+</span> Make Offer
          </Button>
          <MarketFilter onSave={(filtersData: any) => { }} />
        </FlexWrapper>
      </FlexWrapper>

      <br />
      {isMobile ? (
        <MobileMarketCardsSlider>
          <Swiper
            spaceBetween={15}
            slidesPerView={1}
            centeredSlides={false}
            className="market-cards-swiper"
          >
            {projects.map((item) => (
              <SwiperSlide key={item._id}>
                <Link
                  href={`/crypto/project/${item._id}?status=${item.status}`}
                >
                  <MarketCardItem
                    type="market"
                    //@ts-ignore
                    cardData={item}
                  />
                </Link>
              </SwiperSlide>
            ))}
          </Swiper>
        </MobileMarketCardsSlider>
      ) : (
        <MarketCardsWrapper>
          {projects.map((item) => {
            return (
              <MarketCardItem
                type="market"
                //@ts-ignore
                cardData={item}
              />
            );
          })}
        </MarketCardsWrapper>
      )}
      {/* <Pagination
        page={page}
        total={20}
        limit={50}
        totalPage={20}
        onChange={(value) => setPage(value)}
      /> */}
      <CommentBlock items={comments} addComment={confirmAddComment} />
      {modal && (
        <CooperationModal
          onClose={() => {
            setModal(false);
            setApproveCollectionModal(true);
          }}
        />
      )}
      {makeOfferModal && (
        <MakeOfferModal onClose={() => setMakeOfferModal(false)} />
      )}
      {approveCollectionModal && (
        <ApproveCollectionModal
          onClose={() => setApproveCollectionModal(false)}
        />
      )}
    </>
  );
};

export default Market;
