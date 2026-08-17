import React, { FC } from "react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import PercentValue from "../../../../../global/common/PercentValue";
import imageLoader from "../../../../../../helpers/imageLoader";
import { Body, Header, Row, Wrapper } from "./styles";
import AddPortfolioItem, { IPersonPortfolioItem } from "../AddPortfolioItem";
import moment from "moment";
import EmptySection from "../../../../../global/EmptySection";

interface IProps {
  isEditState: boolean;
  items: Array<IPersonPortfolioItem>;
  variant?: "default" | "fundRounds";
  onChange: (items: Array<IPersonPortfolioItem>) => void;
}

const normalizeDateValue = (value: any): any => {
  if (!value) return "";
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    return (
      value.normalized ||
      value.date ||
      value.value ||
      value.startDate?.normalized ||
      value.startDate ||
      value.endDate?.normalized ||
      value.endDate ||
      ""
    );
  }

  return value;
};

const formatPortfolioDate = (
  item: IPersonPortfolioItem,
  showDateWhenPresent = false
): string => {
  if (
    !showDateWhenPresent &&
    (item.status !== "Exit" || !item.exitDate || String(item.exitDate) === "-")
  ) {
    return "-";
  }

  const dateValue = normalizeDateValue(item.exitDate);
  if (!dateValue || String(dateValue) === "-") return "-";

  const date = moment(dateValue);

  return date.isValid() ? date.format("ll") : "-";
};

const formatMoney = (value: any): string => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "-";

  return `$${clarifyAmount(amount)}`;
};

const getHistoryStatus = (
  item: IPersonPortfolioItem,
  isFundRounds: boolean
): IPersonPortfolioItem["status"] => {
  if (!isFundRounds) return item.status;

  return item.status === "Ended" || item.status === "Exit" ? "Ended" : "Active";
};

const InvestmentHistory: FC<IProps> = ({
  isEditState,
  items,
  variant = "default",
  onChange,
}) => {
  const isFundRounds = variant === "fundRounds";
  const columnsStyle = isFundRounds
    ? { gridTemplateColumns: "1.6fr 1.3fr 1.35fr 1fr 1.1fr" }
    : undefined;

  return (
    <>
      {isEditState ? (
        <AddPortfolioItem items={items} onChange={onChange} />
      ) : (
        <Wrapper variant="main">
          {items.length ? (
            <>
              <Header style={columnsStyle}>
                <div>Project Name</div>
                <div>{isFundRounds ? "Round" : "Invested Round"}</div>
                <div>{isFundRounds ? "Funds Raised" : "Amount Invested"}</div>
                <div>{isFundRounds ? "Pre-valuation" : "Current ROI"}</div>
                {!isFundRounds ? <div>Status</div> : null}
                <div>{isFundRounds ? "Date" : "Exit Date"}</div>
                {!isFundRounds ? <div>Exit ROI</div> : null}
              </Header>
              <Body>
                {items.map((item: IPersonPortfolioItem, i: number) => {
                  const status = getHistoryStatus(item, isFundRounds);

                  return (
                    <Row key={i} style={columnsStyle}>
                      <div className="project">
                        <UserAvatar
                          avatar={imageLoader(String(item?.project?.logo))}
                          name={item?.project?.name || ""}
                          variant="default"
                          size="small"
                        />
                        <div className="project-info">
                          <div>{item?.project?.name || ""}</div>
                          <span>{item?.project?.niche || ""}</span>
                        </div>
                      </div>
                      <div className="value">{item.investedRound}</div>
                      <div className="bold">{formatMoney(item.investedAmount)}</div>
                      <div className={isFundRounds ? "bold" : "roi"}>
                        {isFundRounds ? (
                          formatMoney(item.preValuation)
                        ) : item.currentRoi ? (
                          <PercentValue
                            value={item.currentRoi}
                            size="small"
                            isLabel={false}
                            isIcon={false}
                            rightLabel="x"
                          />
                        ) : (
                          <>-</>
                        )}
                      </div>
                      {!isFundRounds ? (
                        <div className={`status ${status}`}>{status}</div>
                      ) : null}
                      <div className="value">
                        {formatPortfolioDate(item, isFundRounds)}
                      </div>
                      {!isFundRounds ? (
                        <div className="roi">
                          {item.exitRoi ? (
                            <PercentValue
                              value={item.exitRoi}
                              size="small"
                              isLabel={false}
                              isIcon={false}
                              rightLabel="x"
                            />
                          ) : (
                            <>-</>
                          )}
                        </div>
                      ) : null}
                    </Row>
                  );
                })}
              </Body>
            </>
          ) : (
            <>
              <br />
              <EmptySection />
              <br />
            </>
          )}
        </Wrapper>
      )}
    </>
  );
};

export default InvestmentHistory;
