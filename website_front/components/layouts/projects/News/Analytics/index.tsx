import React from "react";
import moment from "moment";
import Typography from "../../../../global/common/Typography";
import { INews } from "../../../../../types/global_types";
import {
  BigItem,
  Body,
  DefaultItems,
  Item,
  UpdateInfo,
  Wrapper,
} from "./styles";

const Analytics = () => {
  return (
    <Wrapper>
      <Typography variant="h2">Analytics</Typography>
      <Body>
        <BigItem>
          <div>Top DeFi Tokens to Watch in 2025</div>
          <p>
            Discover the most promising DeFi tokens based on market trends and
            expert insights.
          </p>
        </BigItem>
        <DefaultItems>
          <Item>
            <div>Token A</div>
            <p>Category: DeFi Market Cap: 1.2B</p>
          </Item>
          <Item>
            <div>Token B</div>
            <p>Category: DeFi Market Cap: 1.2B</p>
          </Item>
          <Item>
            <div>Token C</div>
            <p>Category: DeFi Market Cap: 1.2B</p>
          </Item>
        </DefaultItems>
        <UpdateInfo>
          Updated weekly with the latest market insights and trends. Last update
          - {moment(new Date()).format("LL")}
        </UpdateInfo>
      </Body>
    </Wrapper>
  );
};

export default Analytics;
