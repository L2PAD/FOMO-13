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
  Table,
} from "../styles";
import EthereumIcon from "../../../../global/Icons/EthereumIcon";
import ListingNewTokens from "../../modals/ListingNewTokens";

const sort = [
  { value: "price-date", name: "price / date" },
  { value: "total_raised", name: "Total raised" },
  { value: "date_from_new", name: "Date (from new)" },
  { value: "date_from_old", name: "Date (from old)" },
];

const data = [
  {
    dealName: "Deal name 4",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 1",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 2",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 3",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 4",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 1",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 2",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 3",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 4",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
  {
    dealName: "Deal name 1",
    date: "10.02.2023",
    transaction: "0xf5gd....75h0",
    buyer: "0xf5gd....75h0",
    price: 10,
  },
];

const MarketHistory = () => {
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
      <p>Check all the information about your previous deals.</p>
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
      <ContentWrapper>
        <div className="separator" />
        <Table>
          <div className="table">
            <b>Article</b>
            <b>Date</b>
            <b>Transaction</b>
            <b>Buyer</b>
            <b>Price</b>
          </div>
          <div className="separator" />
          {data.map((item, index) => (
            <div className="table" key={index}>
              <p>{item.dealName}</p>
              <p>{item.date}</p>
              <p>{item.transaction}</p>
              <p>{item.buyer}</p>
              <p>
                {item.price} <EthereumIcon />
              </p>
            </div>
          ))}
        </Table>
        <Pagination
          page={page}
          total={20}
          limit={20}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </ContentWrapper>
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

export default MarketHistory;
