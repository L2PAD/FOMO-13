import React, { useEffect, useState } from "react";
import Filter from "../../../../global/Filter";
import { CommentsArray } from "../../../../../staticContent/projects/persons";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import RedFlag from "../../../../global/RedFlag";
import {
  FingerDownIcon,
  FingerTopIcon,
  ShareIcon,
  StarIcon,
} from "../../../../global/Icons";
import PinIcon from "../../../../global/Icons/PinIcon";
import { AddBoardButton } from "../../../earlyland/Board/styles";
import Pagination from "../../../../global/Pagintaion";
import ConfirmDealModal from "../../modals/ConfirmDealModal";
import { Button } from "../../../../global/common/Button";
import ContactWithPerson from "../../modals/ContactWithPersonModal";
import P2PDeals from "../DealsList";
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
import { ShareButton } from "../../Projects/Project/styles";
import CommentBlock from "../../../../global/CommentBlock";
import ListingNewTokens from "../../modals/ListingNewTokens";
import { AddFavAction } from "../../Parsing/styles";

interface Props {
  setTab: (value: string) => void;
}

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

const AllMarket = ({ setTab }: Props) => {
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState(sort[0]);
  const [listingNewTokens, setListingNewTokens] = useState(false);
  const [dealModal, setDealModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
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
      <AddBoardButton onClick={() => setListingNewTokens(true)}>
        + Listing tokens
      </AddBoardButton>
      <p>
        Buy and sell your WLs using our convenient service without a need of
        usage of other services. We offer security and systems of checks and
        balances in order to provide convenience and safety of trading.
      </p>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search for the desired deal"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
        <DropdownWrapper
          label="Sort by"
          onChange={setSortValue}
          value={sortValue}
          options={sort}
        />
      </SearchWrapper>
      <HeaderWrapper>
        <Filter filters={filtersInitial} />
        <AddFavAction onClick={() => setTab("Verified collection")}>
          Verified collection
        </AddFavAction>
      </HeaderWrapper>
      <ContentWrapper>
        <P2PDeals
          filters={filters}
          searchValue={searchValue}
          sortValue={sortValue.value}
          isCreateDeal={listingNewTokens}
          limit={page}
          setIsCreateDeal={() => setListingNewTokens((prev: boolean) => !prev)}
          isMobile={isMobile}
        />
        <Pagination
          page={page}
          total={20}
          limit={20}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </ContentWrapper>
      <CommentBlock />
      {listingNewTokens && (
        <ListingNewTokens onClose={() => setListingNewTokens(false)} />
      )}
      {dealModal && <ConfirmDealModal onClose={() => setDealModal(false)} />}
      {contactModal && (
        <ContactWithPerson
          onClose={() => setContactModal(false)}
          title="Contact with buyer"
        />
      )}
    </TabWrapper>
  );
};

export default AllMarket;
