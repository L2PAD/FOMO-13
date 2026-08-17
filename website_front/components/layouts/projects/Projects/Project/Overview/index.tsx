import React from "react";
import moment from "moment/moment";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../../helpers/clarifyDate";
import {
  GraphicDataWrapper,
  GraphicRoiDataContentItem,
  GraphicRoiDataContentWrapper,
  GraphicRoiDataTitle,
  GraphicStatisticsItem,
  GraphicStatisticsItemTitle,
  GraphicStatisticsItemValues,
  GraphicWrapper,
  Wrapper,
} from "./styles";

const Overview = () => {
  return (
    <GraphicWrapper>
      <div />
      <GraphicDataWrapper>
        <Wrapper variant="default">
          <GraphicRoiDataTitle variant="p">ROI since ICO</GraphicRoiDataTitle>
          <GraphicRoiDataContentWrapper>
            <GraphicRoiDataContentItem amount={5.03} variant="p">
              USD
              <br />
              <span>5.03x</span>
            </GraphicRoiDataContentItem>
            <GraphicRoiDataContentItem amount={1.87} variant="p">
              BTC
              <br />
              <span>1.87x</span>
            </GraphicRoiDataContentItem>
            <GraphicRoiDataContentItem amount={0.94} variant="p">
              ETH
              <br />
              <span>0.94x</span>
            </GraphicRoiDataContentItem>
          </GraphicRoiDataContentWrapper>
        </Wrapper>
        <Wrapper variant="default">
          <GraphicRoiDataTitle variant="p">
            Price Statistics
          </GraphicRoiDataTitle>
          <div>
            <GraphicStatisticsItem>
              <GraphicStatisticsItemTitle>Price</GraphicStatisticsItemTitle>
              <GraphicStatisticsItemValues variant="default">
                ${clarifyAmount(1.38)}
              </GraphicStatisticsItemValues>
            </GraphicStatisticsItem>
            <GraphicStatisticsItem>
              <GraphicStatisticsItemTitle>
                24h Change
              </GraphicStatisticsItemTitle>
              <GraphicStatisticsItemValues variant="green">
                ${clarifyAmount(0.7)}
                <br />
                58.71%
              </GraphicStatisticsItemValues>
            </GraphicStatisticsItem>
            <GraphicStatisticsItem>
              <GraphicStatisticsItemTitle>
                Market Cap
              </GraphicStatisticsItemTitle>
              <GraphicStatisticsItemValues variant="default">
                ${clarifyAmount(15380000)}
              </GraphicStatisticsItemValues>
            </GraphicStatisticsItem>
            <GraphicStatisticsItem>
              <GraphicStatisticsItemTitle>
                Volume 24h
              </GraphicStatisticsItemTitle>
              <GraphicStatisticsItemValues variant="green">
                ${clarifyAmount(1350000)}
                <br />
                <span>58.71%</span>
              </GraphicStatisticsItemValues>
            </GraphicStatisticsItem>
            <GraphicStatisticsItem>
              <GraphicStatisticsItemTitle>
                All-Time High
                <br />
                <span>{clarifyDate(String(moment()))}</span>
              </GraphicStatisticsItemTitle>
              <GraphicStatisticsItemValues variant="green">
                ${clarifyAmount(32.94)}
                <br />
                <span>158.71%</span>
              </GraphicStatisticsItemValues>
            </GraphicStatisticsItem>
            <GraphicStatisticsItem>
              <GraphicStatisticsItemTitle>
                All-Time Low
                <br />
                <span>{clarifyDate(String(moment()))}</span>
              </GraphicStatisticsItemTitle>
              <GraphicStatisticsItemValues variant="red">
                ${clarifyAmount(32.94)}
                <br />
                <span>-58.71%</span>
              </GraphicStatisticsItemValues>
            </GraphicStatisticsItem>
          </div>
        </Wrapper>
      </GraphicDataWrapper>
    </GraphicWrapper>
  );
};

export default Overview;
