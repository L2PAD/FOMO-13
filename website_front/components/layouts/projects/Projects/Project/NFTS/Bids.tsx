import React from "react";
import {
  BidsItem,
  CardWrapper,
  Colored,
  GraphicItemsWrapper,
  TableHeader,
  TableItem,
} from "../styles";
import Typography from "../../../../../global/common/Typography";

const Bids = () => {
  return (
    <CardWrapper variant="default">
      <TableHeader>
        <p>
          Sort by:
          <Colored variant="default">
            <b>Total Raised</b>
            <small>➤</small>
          </Colored>
        </p>
      </TableHeader>
      <GraphicItemsWrapper>
        <TableItem href="#">
          <BidsItem>
            <Typography variant="p">
              <b>20.001 ETH</b>
              <Colored variant="gray">29% below floor</Colored>
            </Typography>
            <Typography variant="p">
              <Colored variant="gray">By</Colored>
              <b>B4debf</b>
              <Colored variant="gray">Expiry: in 1 minute</Colored>
            </Typography>
          </BidsItem>
        </TableItem>
        <TableItem href="#">
          <BidsItem>
            <Typography variant="p">
              <b>20.001 ETH</b>
              <Colored variant="gray">29% below floor</Colored>
            </Typography>
            <Typography variant="p">
              <Colored variant="gray">By</Colored>
              <b>B4debf</b>
              <Colored variant="gray">Expiry: in 1 minute</Colored>
            </Typography>
          </BidsItem>
        </TableItem>
        <TableItem href="#">
          <BidsItem>
            <Typography variant="p">
              <b>20.001 ETH</b>
              <Colored variant="gray">29% below floor</Colored>
            </Typography>
            <Typography variant="p">
              <Colored variant="gray">By</Colored>
              <b>B4debf</b>
              <Colored variant="gray">Expiry: in 1 minute</Colored>
            </Typography>
          </BidsItem>
        </TableItem>
        <TableItem href="#">
          <BidsItem>
            <Typography variant="p">
              <b>20.001 ETH</b>
              <Colored variant="gray">29% below floor</Colored>
            </Typography>
            <Typography variant="p">
              <Colored variant="gray">By</Colored>
              <b>B4debf</b>
              <Colored variant="gray">Expiry: in 1 minute</Colored>
            </Typography>
          </BidsItem>
        </TableItem>
      </GraphicItemsWrapper>
    </CardWrapper>
  );
};

export default Bids;
