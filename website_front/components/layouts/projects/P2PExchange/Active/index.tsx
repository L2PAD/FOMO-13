import React, { useState } from "react";
import Filter from "../../../../global/Filter";
import { CommentsArray } from "../../../../../staticContent/projects/persons";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import RedFlag from "../../../../global/RedFlag";
import {
  FingerDownIcon,
  FingerTopIcon,
  StarIcon,
} from "../../../../global/Icons";
import PinIcon from "../../../../global/Icons/PinIcon";
import { AddBoardButton } from "../../../earlyland/Board/styles";
import Pagination from "../../../../global/Pagintaion";
import ConfirmDealModal from "../../modals/ConfirmDealModal";
import { Button } from "../../../../global/common/Button";
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
  MobileDataWrapper,
  MobileActionsWrapper,
  TabWrapper,
  BuyContactWrapper,
  MobileStatusWrapper,
} from "../styles";
import { toast } from "react-toastify";
import InitiativeNewSwap from "../../modals/InitiativeNewSwap";
import ContactWithPerson from "../../modals/ContactWithPersonModal";

const filters = [
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
  { value: "price-date", name: "price / date" },
  { value: "total_raised", name: "Total raised" },
  { value: "date_from_new", name: "Date (from new)" },
  { value: "date_from_old", name: "Date (from old)" },
];

const Reject = () => {
  toast.success(
    <div>
      <h3>Opps!</h3>
      <p>Error occuried. Try again or contact the support.</p>
    </div>,
    { type: "error" }
  );
};

const PeddingSwaps = () => {
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState(sort[0]);
  const [initiativeNewSwap, setInitiativeNewSwap] = useState(false);
  const [dealModal, setDealModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);

  return (
    <TabWrapper>
      <AddBoardButton onClick={() => setInitiativeNewSwap(true)}>
        + Initiative new swap
      </AddBoardButton>
      <h2>
        <b>You have 5 active swap</b>
        <p>What would you like to do?</p>
      </h2>
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
                <div className="likes full">
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
                  <Button
                    variant="secondary"
                    onClick={() => setContactModal(true)}
                  >
                    Contact with buyer
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={Reject}
                    className="error"
                  >
                    Reject
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
                  Type:
                  <span>Billing</span>
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
                  Verified:
                  <span>Yes</span>
                </DefaultActionWrapper>
                <DefaultActionWrapper>
                  <StatusWrapper>
                    Status:
                    <span>Pending</span>
                  </StatusWrapper>
                </DefaultActionWrapper>
                {/* <PinButton>
                  <PinIcon fill="#04A584" />
                </PinButton> */}
              </ActionsWrapper>
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
                  Type:
                  <span>Billing</span>
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
              <MobileStatusWrapper>
                <StatusWrapper>
                  Status:
                  <span>Pending</span>
                </StatusWrapper>
              </MobileStatusWrapper>
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
      {initiativeNewSwap && (
        <InitiativeNewSwap onClose={() => setInitiativeNewSwap(false)} />
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

export default PeddingSwaps;
