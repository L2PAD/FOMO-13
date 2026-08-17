import React, { useState } from "react";
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
  StatusWrapper,
  BlockButton,
  PinButton,
  MobileStatusWrapper,
  MobileDataWrapper,
  MobileActionsWrapper,
  TabWrapper,
  BuyContactWrapper,
} from "../styles";
import { ShareButton } from "../../Projects/Project/styles";
import CommentBlock from "../../../../global/CommentBlock";
import ListingNewTokens from "../../modals/ListingNewTokens";

const filters = [
  { type: "date", title: "Date" },
  {
    type: "range",
    title: "Price",
    range: [0, 150],
    step: 1,
  },
  {
    type: "checkbox",
    title: "Deal type",
    items: ["Selling", "Buying"],
  },
  {
    type: "checkbox",
    title: "Service type",
    items: [
      "NFT",
      "Project account",
      "Projects",
      "KYC",
      "Services",
      "Social network",
    ],
  },
  {
    type: "checkbox",
    title: "Block status",
    items: ["Unlocked", "Locked"],
  },
];

const sort = [
  { value: "top-reaction-name", name: "top reaction / name" },
  { value: "total_raised", name: "Total raised" },
  { value: "date_from_new", name: "Date (from new)" },
  { value: "date_from_old", name: "Date (from old)" },
];

const AllDeal = () => {
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState(sort[0]);
  const [listingNewTokens, setListingNewTokens] = useState(false);
  const [dealModal, setDealModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);

  return (
    <TabWrapper>
      <AddBoardButton onClick={() => setListingNewTokens(true)}>
        + Listing tokens
      </AddBoardButton>
      <p>
        Buy and sell your tokens using our convenient service without a need of
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
      </SearchWrapper>
      <HeaderWrapper>
        <Filter filters={filters} />
        <DropdownWrapper
          label="Sort by"
          onChange={setSortValue}
          value={sortValue}
          options={sort}
        />
      </HeaderWrapper>
      <ContentWrapper>
        {CommentsArray.map((item, i) => {
          return (
            <CommentWrapper key={i} variant="default">
              {/* <CommentItem {...item} /> */}
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
                <StatusWrapper>
                  Status:
                  <span>Pending</span>
                </StatusWrapper>
              </MobileStatusWrapper>
              <MobileDataWrapper>
                <DefaultActionWrapper>
                  Price:
                  <span>${clarifyAmount(1800000)}</span>
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
                <DefaultActionWrapper>
                  Moving tokens:
                  <span>Locked</span>
                </DefaultActionWrapper>
              </MobileDataWrapper>
              <MobileActionsWrapper>
                <BlockButton>Block</BlockButton>
                <PinButton>
                  <PinIcon fill="#04A584" />
                </PinButton>
              </MobileActionsWrapper>
            </CommentWrapper>
          );
        })}
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

export default AllDeal;
