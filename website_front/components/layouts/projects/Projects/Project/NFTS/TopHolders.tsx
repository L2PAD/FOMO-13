import React from "react";
import { CardWrapper, GraphicItemsWrapper, TableItem } from "../styles";
import { TopHoldersItem } from "../../styles";

const TopHolders = () => {
  return (
    <CardWrapper variant="default">
      <GraphicItemsWrapper>
        <TableItem count={2} href="#">
          <TopHoldersItem>
            <b>1</b>
            0x10g554g
          </TopHoldersItem>
          <TopHoldersItem style={{ justifyContent: "end" }}>
            <b>35</b>
            (3.36%)
          </TopHoldersItem>
        </TableItem>
        <TableItem count={2} href="#">
          <TopHoldersItem>
            <b>2</b>
            0x10g554g
          </TopHoldersItem>
          <TopHoldersItem style={{ justifyContent: "end" }}>
            <b>35</b>
            (3.36%)
          </TopHoldersItem>
        </TableItem>
        <TableItem count={2} href="#">
          <TopHoldersItem>
            <b>3</b>
            0x10g554g
          </TopHoldersItem>
          <TopHoldersItem style={{ justifyContent: "end" }}>
            <b>35</b>
            (3.36%)
          </TopHoldersItem>
        </TableItem>
        <TableItem count={2} href="#">
          <TopHoldersItem>
            <b>4</b>
            0x10g554g
          </TopHoldersItem>
          <TopHoldersItem style={{ justifyContent: "end" }}>
            <b>35</b>
            (3.36%)
          </TopHoldersItem>
        </TableItem>
        <TableItem count={2} href="#">
          <TopHoldersItem>
            <b>5</b>
            0x10g554g
          </TopHoldersItem>
          <TopHoldersItem style={{ justifyContent: "end" }}>
            <b>35</b>
            (3.36%)
          </TopHoldersItem>
        </TableItem>
      </GraphicItemsWrapper>
    </CardWrapper>
  );
};

export default TopHolders;
