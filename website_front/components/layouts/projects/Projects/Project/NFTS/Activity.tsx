import React from "react";
import { GraphicItemsWrapper, TableItem } from "../styles";
import { CardWrapper, GraphicItemData, TableHeader } from "./styles";

const Activity = () => {
  return (
    <CardWrapper variant="default">
      <TableHeader>
        <p>Event</p>
        <p>Price</p>
        <p>From</p>
        <p>To</p>
        <p>Date</p>
      </TableHeader>
      <GraphicItemsWrapper>
        <TableItem href="#">
          <GraphicItemData variant="default">Transfer</GraphicItemData>
          <GraphicItemData variant="default">10.55 ETH</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">4 days ago</GraphicItemData>
        </TableItem>
        <TableItem href="#">
          <GraphicItemData variant="default">Transfer</GraphicItemData>
          <GraphicItemData variant="default">10.55 ETH</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">4 days ago</GraphicItemData>
        </TableItem>
        <TableItem href="#">
          <GraphicItemData variant="default">Transfer</GraphicItemData>
          <GraphicItemData variant="default">10.55 ETH</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">4 days ago</GraphicItemData>
        </TableItem>
        <TableItem href="#">
          <GraphicItemData variant="default">Transfer</GraphicItemData>
          <GraphicItemData variant="default">10.55 ETH</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">4 days ago</GraphicItemData>
        </TableItem>
        <TableItem href="#">
          <GraphicItemData variant="default">Transfer</GraphicItemData>
          <GraphicItemData variant="default">10.55 ETH</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">0x4545f...</GraphicItemData>
          <GraphicItemData variant="default">4 days ago</GraphicItemData>
        </TableItem>
      </GraphicItemsWrapper>
    </CardWrapper>
  );
};

export default Activity;
