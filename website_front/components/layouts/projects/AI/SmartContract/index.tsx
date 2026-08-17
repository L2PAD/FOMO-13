import React, { useState } from "react";
import Filter from "../../../../global/Filter";
import { CommentsArray } from "../../../../../staticContent/projects/persons";
import RedFlag from "../../../../global/RedFlag";
import {
  FingerDownIcon,
  FingerTopIcon,
  StarIcon,
} from "../../../../global/Icons";
import PinIcon from "../../../../global/Icons/PinIcon";
import CreateDealModal from "../../modals/CreateDealModal";
import Pagination from "../../../../global/Pagintaion";
import ConfirmDealModal from "../../modals/ConfirmDealModal";
import { Button } from "../../../../global/common/Button";
import {
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
} from "./styles";
import CommentBlock from "../../../../global/CommentBlock";
import { SearchIconStyle } from "../../../../global/Navigation/styles";
import { SearchWrapper } from "../PriceChange/styles";
import { SearchInput } from "../../Parsing/styles";
import UserAvatar from "../../../../global/common/UserAvatar";
import TrinityIcon from "../../../../global/Icons/TrinityIcon";

const filters = [
  {
    type: "select",
    title: "Influencers",
    placeholder: "Choose influencer",
    items: ["Choose influencer"],
  },
  {
    type: "range",
    title: "Rating",
    range: [150, 1000],
    step: 1,
  },
  {
    type: "checkbox",
    title: "Activities",
    items: [
      "Testnet",
      "Airdrop",
      "Airdrop",
      "Smart",
      "Nodes",
      "Fundrasing",
      "Ambassador",
      "Degen",
    ],
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
  const [createDeal, setCreateDeal] = useState(false);
  const [dealModal, setDealModal] = useState(false);

  return (
    <TabWrapper>
      <SearchWrapper>
        <SearchInput
          type="text"
          placeholder="Search for smart ideas by keyword"
          onChange={(value: string) => setSearchValue(value)}
          leftIcon={<SearchIconStyle />}
          value={searchValue}
        />
      </SearchWrapper>
      <p>
        Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
        sint. Velit officia consequat duis enim velit mollit. Exercitation
        veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
        ullamco est sit aliqua dolor do amet sint. Velit officia consequat duis
        enim velit mollit.
      </p>
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
        <div className="content">
          <div className="topic">
            <h3>Topic</h3>
            <SearchWrapper>
              <SearchInput
                type="text"
                placeholder="Search"
                onChange={(value: string) => setSearchValue(value)}
                leftIcon={<SearchIconStyle />}
                value={searchValue}
              />
            </SearchWrapper>
            <b>Topic name</b>
            <div>
              <div>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar="https://sm.ign.com/ign_nordic/cover/a/avatar-gen/avatar-generations_prsz.jpg"
                  name="Name"
                />
                <b>Twitter name</b>
              </div>
              <TrinityIcon />
            </div>
            <div>
              <div>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar="https://sm.ign.com/ign_nordic/cover/a/avatar-gen/avatar-generations_prsz.jpg"
                  name="Name"
                />
                <b>Name</b>
              </div>
              <TrinityIcon />
            </div>
            <div>
              <div>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar="https://sm.ign.com/ign_nordic/cover/a/avatar-gen/avatar-generations_prsz.jpg"
                  name="Name"
                />
                <b>Name</b>
              </div>
              <TrinityIcon />
            </div>
            <div>
              <div>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar="https://sm.ign.com/ign_nordic/cover/a/avatar-gen/avatar-generations_prsz.jpg"
                  name="Name"
                />
                <b>Name</b>
              </div>
              <TrinityIcon />
            </div>
            <b>Topic name</b>
            <div>
              <div>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar="https://sm.ign.com/ign_nordic/cover/a/avatar-gen/avatar-generations_prsz.jpg"
                  name="Name"
                />
                <b>Name</b>
              </div>
            </div>
            <div>
              <div>
                <UserAvatar
                  size="small"
                  variant="default"
                  avatar="https://sm.ign.com/ign_nordic/cover/a/avatar-gen/avatar-generations_prsz.jpg"
                  name="Name"
                />
                <b>Name</b>
              </div>
            </div>
          </div>
          <div className="events">
            <h3> Events</h3>
            <br />
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
                      <Button variant="secondary">+ Go to FOMO Score</Button>
                    </div>
                  </BuyContactWrapper>
                  <ActionsWrapper>
                    <DefaultActionWrapper>
                      Followers:
                      <span>3453</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Score:
                      <span>
                        <RedFlag count={14} />
                        <RatingWrapper>
                          <StarIcon fill="#FFC702" />
                          94/100
                        </RatingWrapper>
                      </span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Topic:
                      <span>Name topic</span>
                    </DefaultActionWrapper>
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
                      Followers:
                      <span>3453</span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Score:
                      <span>
                        <RedFlag count={14} />
                        <RatingWrapper>
                          <StarIcon fill="#FFC702" />
                          94/100
                        </RatingWrapper>
                      </span>
                    </DefaultActionWrapper>
                    <DefaultActionWrapper>
                      Topic:
                      <span>Name topic</span>
                    </DefaultActionWrapper>
                  </MobileDataWrapper>
                </CommentWrapper>
              );
            })} */}
          </div>
        </div>
        <Pagination
          page={page}
          total={20}
          limit={20}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </ContentWrapper>
      <CommentBlock />
      {/* {createDeal && <CreateDealModal onClose={() => setCreateDeal(false)} />} */}
      {/* {dealModal && <ConfirmDealModal onClose={() => setDealModal(false)} />} */}
    </TabWrapper>
  );
};

export default AllDeal;
