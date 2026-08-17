import React from "react";
import { ChardWrapper, PageWrapper } from "./styles";
import CandlestickChart from "../CandlestickChart";
import NFTGraphic from "../NFTGraphic";

const items = [
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
];

const Card = () => {
  return (
    <PageWrapper>
      <ChardWrapper>
        <div>
          <CandlestickChart />
        </div>
        <div>
          <NFTGraphic items={items} />
        </div>
      </ChardWrapper>
    </PageWrapper>
  );
};

export default Card;
