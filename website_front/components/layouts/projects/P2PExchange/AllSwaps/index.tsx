import React, { useEffect, useState } from "react";
import Filter from "../../../../global/Filter";
// import { CommentsArray } from "../../../../../staticContent/projects/persons";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import P2PDeals from "../DealsList";
import RedFlag from "../../../../global/RedFlag";
import PinIcon from "../../../../global/Icons/PinIcon";
import { AddBoardButton } from "../../../earlyland/Board/styles";
import Pagination from "../../../../global/Pagintaion";
import ConfirmDealModal from "../../modals/ConfirmDealModal";
import { Button } from "../../../../global/common/Button";
import ContactWithPerson from "../../modals/ContactWithPersonModal";
import InitiativeNewSwap from "../../modals/InitiativeNewSwap";
import OtcFilter from "../../../../global/Filter/otc_filter";
import {
  FingerDownIcon,
  FingerTopIcon,
  ShareIcon,
  StarIcon,
} from "../../../../global/Icons";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
  DropdownWrapper,
  HeaderWrapper,
  ContentWrapper,
  CommentWrapper,
  CommentItem,
  ActionsWrapper,
  DefaultActionWrapper,
  RatingWrapper,
  PinButton,
  MobileStatusWrapper,
  MobileDataWrapper,
  TabWrapper,
  BuyContactWrapper,
} from "../styles";

const filtersInitial = [
  { type: "date", title: "Date", simple: true },
  {
    type: "range",
    title: "Price",
    range: [1.98, 100.98],
    step: 1,
  },
  {
    type: "range",
    title: "Amount",
    range: [1, 1000],
    step: 1,
  },
  {
    type: "range",
    title: "Rating",
    range: [1, 100],
    step: 1,
  },
  {
    type: "checkbox",
    title: "Risk",
    items: ["Low", "Medium", "High", "Very high"],
  },
  {
    type: "checkbox",
    title: "Users status",
    items: ["Verified", "Red flag"],
  },
];

const sort = [
  { value: "New", name: "Date (from new)" },
  { value: "Old", name: "Date (from old)" },
  { value: "High", name: "Top reactions (from High)" },
  { value: "Low", name: "Top reactions (from Low)" },
];

const AllSwaps = () => {
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState(sort[0]);
  const [isCreateDeal, setIsCreateDeal] = useState<boolean>(false);
  const [isContactModal, setIsContactModal] = useState<boolean>(false);
  const [isConfirmModal, setIsConfirmModal] = useState<boolean>(false);
  const [filters, setFilters] = useState<any>();
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 850);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <TabWrapper>
      <AddBoardButton onClick={() => setIsCreateDeal(true)}>
        + Initiative new swap
      </AddBoardButton>
      <p>
        Swap your assets for other valuable things with Fomoland participants.
      </p>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search for the desired deal"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <HeaderWrapper>
        <OtcFilter
          filterDataInitial={{}}
          filters={filters}
          onSave={(filters: any) => setFilters(filters)}
          onReset={() => { }}
          variant="medium"
        />
        <DropdownWrapper
          label="Sort by"
          onChange={setSortValue}
          value={sortValue}
          options={sort}
        />
      </HeaderWrapper>
      <ContentWrapper>
        <P2PDeals
          searchValue={searchValue}
          sortValue={sortValue.value}
          isCreateDeal={isCreateDeal}
          limit={page}
          setIsCreateDeal={() => setIsCreateDeal((prev: boolean) => !prev)}
          filters={filters}
          isMobile={isMobile}
        />
        {/* {CommentsArray.map((item, i) => {
          return (
            <CommentWrapper key={i} variant="default">
              <CommentItem {...item} />
              <BuyContactWrapper>
                <div className="likes">
                  <div className="like">
                    <FingerTopIcon />
                    2,5k
                  </div>
                  <div className="dislike">
                    <FingerDownIcon />
                    148
                  </div>
                </div>
                <div className="buttons">
                  <Button onClick={() => setDealModal(true)} variant="primary">
                    Buy
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setContactModal(true)}
                  >
                    Contact with buyer
                  </Button>
                </div>
              </BuyContactWrapper>
              <ActionsWrapper>
                <DefaultActionWrapper>
                  Price:
                  <span>${clarifyAmount(1800000)}</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Amount:
                  <span>1000</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Object:
                  <span>NFT</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Risk:
                  <span>Low</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Verified:
                  <span>Yes</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Mint date:
                  <span>01.03.23</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Rating:
                  <span>
                    <RedFlag count={14} />
                    <RatingWrapper>
                      <StarIcon fill="#FFC702" />
                      94/100
                    </RatingWrapper>
                  </span>
                </DefaultActionWrapper>
                <ShareButton>
                  <ShareIcon fill="#04A584" />
                  Share
                </ShareButton>
                <PinButton>
                  <PinIcon fill="#04A584" />
                </PinButton>
              </ActionsWrapper>
              <MobileStatusWrapper>
                <PinButton>
                  <PinIcon fill="#04A584" />
                </PinButton>
              </MobileStatusWrapper>
              <MobileDataWrapper>
                <DefaultActionWrapper>
                  Price:
                  <span>${clarifyAmount(1800000)}</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Amount:
                  <span>1000</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Object:
                  <span>NFT</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Risk:
                  <span>Low</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Verified:
                  <span>Yes</span>
                </DefaultActionWrapper>
              </MobileDataWrapper>
            </CommentWrapper>
          );
        })} */}
        {/* <Pagination
          page={page}
          total={20}
          limit={20}
          totalPage={20}
          onChange={(value) => setPage(value)}
        /> */}
      </ContentWrapper>

      {isContactModal ? (
        <ContactWithPerson
          onClose={() => setIsContactModal(false)}
          title="Contact with buyer"
        />
      ) : (
        <></>
      )}
      {isConfirmModal ? (
        <ConfirmDealModal onClose={() => setIsConfirmModal(false)} />
      ) : (
        <></>
      )}
    </TabWrapper>
  );
};

export default AllSwaps;
