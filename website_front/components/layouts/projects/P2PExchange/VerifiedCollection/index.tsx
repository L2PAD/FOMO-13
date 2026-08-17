import React, { useState } from "react";
import { AddBoardButton } from "../../../earlyland/Board/styles";
import Pagination from "../../../../global/Pagintaion";
import ConfirmDealModal from "../../modals/ConfirmDealModal";
import ContactWithPerson from "../../modals/ContactWithPersonModal";
import {
  SearchIconStyle,
  SearchInput,
  SearchWrapper,
  DropdownWrapper,
  ContentWrapper,
  TabWrapper,
  FlexItemWrapper,
} from "../styles";
import UserAvatar from "../../../../global/common/UserAvatar";
import VerifyIcon from "../../../../global/Icons/VerifyIcon";
import InitiativeNewSwap from "../../modals/InitiativeNewSwap";

const sort = [
  { value: "price-date", name: "price / date" },
  { value: "total_raised", name: "Total raised" },
  { value: "date_from_new", name: "Date (from new)" },
  { value: "date_from_old", name: "Date (from old)" },
];

const collectionData = [
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
  {
    avatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    name: "Collection name",
    address: "0xf5gd....75h0",
  },
];

const VerifiedСollection = () => {
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
      <p>
        NFT collections which are checked and verified by the Fomoland team in
        order to ensure its potential and possible benefit.
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
      <div className="separator" />
      <ContentWrapper>
        {collectionData.map((collection, index) => (
          <FlexItemWrapper key={index}>
            <div>
              <UserAvatar
                size="small"
                variant="default"
                avatar={collection.avatar}
                name={collection.name}
              />
              <b>{collection.name}</b>
            </div>
            <div>
              <b>{collection.address}</b>
              <VerifyIcon />
            </div>
          </FlexItemWrapper>
        ))}
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

export default VerifiedСollection;
