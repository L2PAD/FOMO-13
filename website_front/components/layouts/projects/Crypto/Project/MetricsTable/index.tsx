import React, { FC, useEffect, useMemo, useState } from "react";
import UsersRow from "../../../../../global/UsersRow";
import infoIcon from "../../../../../../assets/icons/info-icon.svg";
import { simplifyAmount } from "../../../../../../helpers/simplifyAmount";
import { Body, Column, Header, Row, Wrapper } from "./styles";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import Image from "next/image";
import { IProject } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";

const metricRows = [
  { label: "Token Price", key: "tokenPrice" },
  { label: "Funds Raised", key: "fundsRaised" },
  { label: "Pre Valuation", key: "preValuation" },
  { label: "Total Supply %", key: "totalSupplyPercent" },
  { label: "USD ROI", key: "roiUsd" },
  { label: "Tokens for Sale", key: "tokenForSale" },
  { label: "Investors", key: "investors" },
];

const formatAmount = (value: any): string | number => {
  if (typeof value === "string" && /[KMBT]/i.test(value)) {
    return value;
  }

  return clarifyAmount(value || 0);
};

const formatMoneyAmount = (value: any): string => {
  if (typeof value === "string" && /[KMBT]/i.test(value)) {
    return value.trim().startsWith("$") ? value : `$${value}`;
  }

  return `$${clarifyAmount(value || 0)}`;
};

const formatTokenPrice = (value: any): string => {
  if (!value) return "-";
  if (typeof value === "string" && value.trim().startsWith("$")) return value;
  return `$${value}`;
};

interface IProps {
  header: Array<string>;
  project?: IProject;
  rounds?: Array<any>
  chart?: Array<any>
}

const MetricsTable: FC<IProps> = ({ header, project, rounds, chart }) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [stagesData, setStagesData] = useState<Array<any>>([]);
  const gridValue: string = `1fr ${header.map(() => {
    return '1fr';
  }).join(' ')}`

  const getValueByIndex = (item: any, i: number): React.ReactNode => {
    const value: any = item[metricRows[i]?.key || "tokenPrice"];
    switch (i) {
      case 0:
        return <div key={item.id} className="item bold">{formatTokenPrice(value)}</div>
      case 1:
        return <div key={item.id} className="item bold">{formatMoneyAmount(value)}</div>
      case 2:
        return <div key={item.id} className="item bold">{formatMoneyAmount(value)}</div>
      case 3:
        return <div key={item.id} className="item bold">{value ? `${value}%` : '-'}</div>
      case 4:
        return <div key={item.id} className="item bold">{value ? `${value}x` : '-'}</div>
      case 5:
        return <div key={item.id} className="item bold">{value ? `${formatAmount(value)}` : '-'}</div>
      case 6:
        return <div key={item.id} className="item bold">{
          value?.length
            ?
            <UsersRow
              users={value.map((item: any) => {
                return ({
                  logo: item?.details?.logo || item?.logo || item?.img || item?.image || '',
                  name: item.name
                })
              })}
            />
            :
            '-'
        }</div>

      default:
        return item.tokenPrice || "-"
    }
  }

  return (
    <Wrapper variant="main">
      <Header
        style={{
          display: 'grid', gridTemplateColumns: gridValue
        }}
      >
        <span className="sticky" />
        {header.map((item: string, index: number) => {
          return <span key={index}>{item}</span>;
        })}
      </Header>
      {
        rounds?.length
          ?
          <Body>
            {
              metricRows.map((item: any, i: number) => {
                return (
                  <Row style={{ gridTemplateColumns: gridValue }} key={i}>
                    <div className="item sticky" >
                      {item.label}
                    </div>
                    {
                      rounds.map((r: any, key: number) => {
                        return (
                          getValueByIndex(r, i)
                        )
                      })
                    }
                  </Row>
                )
              })
            }
          </Body>
          :
          <></>
      }

    </Wrapper>
  );
};

export default MetricsTable;
