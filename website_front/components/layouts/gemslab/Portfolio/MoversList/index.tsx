import React, { FC } from "react";
import { Item, List, Title, Values, Wrapper } from "./styles";
import EntityInfo from "../../../../global/common/EntityInfo";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import EmptyList from "../../../../global/EmptyList";
import { getPortfolioDisplaySymbol } from "../helpers/portfolio";
import Placeholder from "../../../../global/common/Placeholder";

interface IProps {
  title: string;
  items: Array<any>;
  variant?: "default" | "core";
  isLoading?: boolean;
}

const formatCoreMoverValue = (value: unknown): string => {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;
  const absoluteValue = Math.abs(safeValue);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: absoluteValue >= 1_000_000 ? "compact" : "standard",
    minimumFractionDigits: absoluteValue >= 1_000_000 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(absoluteValue);

  if (safeValue === 0) return formatted;
  return `${safeValue > 0 ? "+" : "-"}${formatted}`;
};

const formatCoreMoverPercent = (value: unknown): string => {
  const numericValue = Number(value || 0);
  const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

  return `${safeValue > 0 ? "+" : ""}${safeValue.toFixed(2)}%`;
};

const MoversList: FC<IProps> = ({
  title,
  items,
  variant = "default",
  isLoading = false,
}) => {
  const isCore = variant === "core";
  return (
    <Wrapper variant="main" $core={isCore}>
      <Title $core={isCore}>{title}</Title>
      <List>
        {
          isCore && isLoading ? (
            <div role="status" aria-label={`Loading ${title.toLowerCase()}`}>
              {[0, 1, 2].map((row) => (
                <Item key={row} $core>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Placeholder
                      width="32px"
                      height="32px"
                      borderRadius="50%"
                      marginBottom="0"
                    />
                    <Placeholder
                      width="92px"
                      height="12px"
                      borderRadius="999px"
                      marginBottom="0"
                    />
                  </div>
                  <div style={{ display: "grid", gap: 7, justifyItems: "end" }}>
                    <Placeholder
                      width="66px"
                      height="12px"
                      borderRadius="999px"
                      marginBottom="0"
                    />
                    <Placeholder
                      width="42px"
                      height="8px"
                      borderRadius="999px"
                      marginBottom="0"
                    />
                  </div>
                </Item>
              ))}
            </div>
          ) : items.length
            ?
            items.map((item: any, i: number) => {
              const displaySymbol = getPortfolioDisplaySymbol(item);

              return (
                <Item key={i} $core={isCore}>
                  <EntityInfo
                    variant="default"
                    img={item.logo}
                    niche={displaySymbol}
                    name={item.name}
                  />
                  <Values>
                    <div className={item.value > 0 ? "green" : "red"}>
                      {isCore
                        ? formatCoreMoverValue(item.value)
                        : `${clarifyAmount(item.value, true, ".00", 0, "")}$`}
                    </div>
                    <span className={item.value > 0 ? "green" : "red"}>
                      {isCore
                        ? formatCoreMoverPercent(item.percent)
                        : `${item.percent}%`}
                    </span>
                  </Values>
                </Item>
              );
            })
            :
            <>
              <br />
              <EmptyList imgWidth={150} lineHeight={120} fontSize={18}/>
              <br />
            </>
        }
      </List>
    </Wrapper>
  );
};

export default MoversList;
