import React, { useState } from "react";
import { Colored, HeaderItem } from "../styles";
import {
  CardIem,
  CardWrapper,
  DataTitle,
  Value,
  Header,
  Separator,
  ItemsWrapper,
} from "./styles";

export interface Item {
  floor: string;
  amount: number;
  total: string;
  rarity: number;
}

export interface SeparatorI {
  value: string;
  price: number;
  variant: "default" | "green" | "red";
}

interface Props {
  title: string;
  bottom: Item[];
  top: Item[];
  separator: SeparatorI;
}

const StackGlass = ({ title, bottom, top, separator }: Props) => {
  const [isEth, setIsEth] = useState(true);
  return (
    <CardWrapper variant="default">
      <div>
        <DataTitle variant="p">
          {title}
          <span style={{ cursor: "pointer" }}>
            <Colored
              variant={isEth ? "green" : "default"}
              onClick={() => setIsEth(true)}
            >
              ETH
            </Colored>
            <Colored
              variant={isEth ? "default" : "green"}
              onClick={() => setIsEth(false)}
            >
              $
            </Colored>
          </span>
        </DataTitle>
        <Header>
          <HeaderItem>Floor (eth)</HeaderItem>
          <HeaderItem>Amount</HeaderItem>
          <HeaderItem>Total (eth)</HeaderItem>
          <HeaderItem>Rarity</HeaderItem>
        </Header>
        <ItemsWrapper>
          {bottom.map(({ floor, amount, total, rarity }) => (
            <CardIem key={rarity}>
              <Value variant="red">{floor}</Value>
              <Value variant="default">{amount}</Value>
              <Value variant="default">{total}</Value>
              <span>#{rarity}</span>
            </CardIem>
          ))}
        </ItemsWrapper>
        <Separator variant="p">
          <Colored variant={separator.variant}>{separator.value}</Colored>
          <span>
            <Colored variant={separator.variant}>↓</Colored>${separator.price}
          </span>
        </Separator>
        <ItemsWrapper>
          {top.map(({ floor, amount, total, rarity }) => (
            <CardIem key={rarity}>
              <Value variant="green">{floor}</Value>
              <Value variant="default">{amount}</Value>
              <Value variant="default">{total}</Value>
              <span>#{rarity}</span>
            </CardIem>
          ))}
        </ItemsWrapper>
      </div>
    </CardWrapper>
  );
};

export default StackGlass;
