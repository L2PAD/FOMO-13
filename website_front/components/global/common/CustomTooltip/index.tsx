import React, { FC } from "react";
import PercentValue from "../PercentValue";
import { BlocksWrapper, Header, Items, Title, Wrapper } from "./styles";
import UsersRow from "../../UsersRow";

const CustomTooltip: FC<{ active?: boolean; payload?: any[] }> = ({
  payload,
}) => {
  const data: any = payload ? payload[0]?.payload : {};
  const countLabel = data?.countLabel || "Number of Projects";
  const shareLabel = data?.shareLabel || "Market Share";
  const mapTopProject = (item: any, fallbackName: string) => {
    if (typeof item === "string") {
      return {
        name: fallbackName,
        logo: item,
      };
    }

    return {
      name: item?.name || fallbackName,
      logo: item?.logo || item?.image,
    };
  };

  return (
    <BlocksWrapper>
      <Wrapper>
        <Header>
          <Title>{data?.name || "-"}</Title>
          <PercentValue
            className="value"
            size="small"
            value={data?.tooltipValue1 ?? data?.grow ?? 0}
          />
        </Header>
        <Items>
          {/* <div className="item">
            <Title>Investment Amount:</Title>
            <div className="key">
              $
              {data?.investmentsAmount
                ? clarifyAmount(data?.investmentsAmount, true)
                : "8B"}
            </div>
          </div> */}
          <div className="item">
            <Title>{countLabel}:</Title>
            <div className="key">{(data?.gainers1 + data?.losers1) || 0}</div>
          </div>
          <div className="item">
            <Title>{shareLabel}:</Title>
            <div className="key">{data?.marketCapShare1}%</div>
          </div>
          <div className="item">
            <Title>Top projects:</Title>
            <div className="key">
              {data?.topProjects1?.length ? (
                <UsersRow
                  users={data.topProjects1.map((item: any) =>
                    mapTopProject(item, data.name)
                  )}
                />
              ) : (
                "-"
              )}
            </div>
          </div>
          {data?.relatedSectors && (
            <div className="item">
              <Title>Related sectors:</Title>
              <div className="key">{data.relatedSectors}</div>
            </div>
          )}
        </Items>
      </Wrapper>
      {data?.name2 ? (
        <Wrapper>
          <Header>
            <Title>{data.name2}</Title>
            <PercentValue
              size="small"
              value={data?.tooltipValue2 ?? data?.drop ?? 0}
            />
          </Header>
          <Items>
            <div className="item">
              <Title>{countLabel}:</Title>
              <div className="key">{(data?.gainers2 + data?.losers2) || 0}</div>
            </div>
            <div className="item">
              <Title>{shareLabel}:</Title>
              <div className="key">{data?.marketCapShare2}%</div>
            </div>
            <div className="item">
              <Title>Top projects:</Title>
              <div className="key">
                {data?.topProjects2?.length ? (
                  <UsersRow
                    users={data.topProjects2.map((item: any) =>
                      mapTopProject(item, data.name2)
                    )}
                  />
                ) : (
                  "-"
                )}
              </div>
            </div>
          </Items>
        </Wrapper>
      ) : null}
    </BlocksWrapper>
  );
};

export default CustomTooltip;
