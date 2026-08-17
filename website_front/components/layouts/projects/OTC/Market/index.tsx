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
import ShareModal from "../../../../global/modals/ShareModal";
import Pagination from "../../../../global/Pagintaion";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
  HeaderWrapper,
  ContentWrapper,
  CommentWrapper,
  CommentItem,
  ActionsWrapper,
  DefaultActionWrapper,
  RatingWrapper,
  StatusWrapper,
  PinButton,
  MobileStatusWrapper,
  MobileDataWrapper,
  ShareWrapper,
} from "./styles";
import { BuyContactWrapper } from "../DealsList/styles";
import Button from "../../../../global/common/Button";
import ConfirmDealModal from "../../modals/ConfirmDealModal";
import ContactWithPerson from "../../modals/ContactWithPersonModal";
import { Sort } from "../../../../global/common/Sort";

const filters = [
  { type: "date", title: "Date" },
  {
    type: "range",
    title: "Price",
    range: [0, 150],
    step: 1,
  },
  {
    type: "range",
    title: "Amount",
    range: [0, 1000],
    step: 1,
  },
  {
    type: "range",
    title: "Rating",
    range: [0, 100],
    step: 1,
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
    title: "Deal type",
    items: ["Selling", "Buying"],
  },
  {
    type: "checkbox",
    title: "Block status",
    items: ["Unlocked", "Locked"],
  },
  {
    type: "checkbox",
    title: "Risk",
    items: ["Low", "High", "Medium", "Very high"],
  },
  {
    type: "checkbox",
    title: "Users status",
    items: ["Verifed", "Red flag"],
  },
];

const Market = () => {
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("");
  const [shareModal, setShareModal] = useState(false);
  const [page, setPage] = useState(1);
  const [dealModal, setDealModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);

  return (
    <div>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search the right deal"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <HeaderWrapper>
        <Filter filters={filters} />
        <Sort
          label="Sort by"
          type="Top reactions"
          options={[
            {
              label: "Top reactions",
              items: ["Low", "High"],
              value: sortValue,
              setValue: setSortValue,
            },
          ]}
        />
      </HeaderWrapper>
      <ContentWrapper>
        {/* {CommentsArray.map((item, i) => {
          return (
            <CommentWrapper key={i} variant="default">
              <CommentItem {...item} address="0xf5gd....75h0" />
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
                  Type:
                  <span>Buying</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Price:
                  <span>${clarifyAmount(1800000)}</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Amount:
                  <span>1000</span>
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
                <StatusWrapper>
                  Status:
                  <span>Pending</span>
                </StatusWrapper>
                <ShareWrapper onClick={() => setShareModal(true)}>
                  <ShareIcon fill="#04A584" /> Share
                </ShareWrapper>
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
                  Type:
                  <span>Buying</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Price:
                  <span>${clarifyAmount(1800000)}</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  Amount:
                  <span>1000</span>
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
              </MobileDataWrapper>
            </CommentWrapper>
          );
        })} */}
        <Pagination
          page={page}
          total={20}
          limit={20}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </ContentWrapper>
      {shareModal && (
        <ShareModal
          onClose={() => setShareModal(false)}
          link="/projects/otc/share_otc_market/123"
        />
      )}
      {<ConfirmDealModal isVisible={dealModal} onClose={() => setDealModal(false)} />}
      {contactModal && (
        <ContactWithPerson
          onClose={() => setContactModal(false)}
          title="Contact with seller"
        />
      )}
    </div>
  );
};

export default Market;
