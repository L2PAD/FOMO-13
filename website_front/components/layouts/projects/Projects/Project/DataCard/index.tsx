import React from "react";
import {
  CardHeader,
  CardItem,
  CardIemData,
  GraphicItemsWrapper,
  CardWrapper,
  HeaderItem,
  Colored,
} from "../styles";

interface Props {
  collection: any;
}

const DataCard = ({ collection }: Props) => {
  return (
    <CardWrapper variant="default">
      <CardHeader>
        <HeaderItem />
        <HeaderItem>1 day</HeaderItem>
        <HeaderItem>Week</HeaderItem>
        <HeaderItem>Month</HeaderItem>
        <HeaderItem>Total</HeaderItem>
      </CardHeader>
      <GraphicItemsWrapper>
        <CardItem>
          <HeaderItem>Volume</HeaderItem>
          <CardIemData>
            {collection.volume_24h.native_currency?.toFixed(2)}
            <Colored variant="red">
              {collection.volume_in_usd_24h_percentage_change?.toFixed(2)}
            </Colored>
          </CardIemData>
          <CardIemData>--</CardIemData>
          <CardIemData>--</CardIemData>
          <CardIemData>--</CardIemData>
        </CardItem>
        <CardItem>
          <HeaderItem>Sales</HeaderItem>
          <CardIemData>--</CardIemData>
          <CardIemData>--</CardIemData>
          <CardIemData>--</CardIemData>
          <CardIemData>--</CardIemData>
        </CardItem>
        <CardItem>
          <HeaderItem>Avg.Price</HeaderItem>
          <CardIemData>--</CardIemData>
          <CardIemData>--</CardIemData>
          <CardIemData>--</CardIemData>
          <CardIemData>--</CardIemData>
        </CardItem>
      </GraphicItemsWrapper>
    </CardWrapper>
  );
};

export default DataCard;
