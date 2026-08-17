import React from "react";
import { TableContent } from "../Address/styles";
import {
  CurrentTableHeader,
  CurrentTableRow,
  CurrentTableRowsWrapper,
} from "./styles";

const CurrentListingTable = () => {
  return (
    <TableContent>
      <CurrentTableHeader>
        <div>NFT ID</div>
        <div>Owner</div>
        <div>Listings price ETH</div>
        <div>Profit/loses ETH</div>
        <div>Price drops</div>
        <div>Listed</div>
      </CurrentTableHeader>
      <CurrentTableRowsWrapper>
        {Array(8)
          .fill("")
          .map((item, i) => {
            return (
              <CurrentTableRow key={i}>
                <div>46546</div>
                <div>name</div>
                <div>8</div>
                <div className="green">8</div>
                <div>8</div>
                <div>7d ago</div>
              </CurrentTableRow>
            );
          })}
      </CurrentTableRowsWrapper>
    </TableContent>
  );
};

export default CurrentListingTable;
