/* eslint-disable */
import React, { useState } from "react";
import { Dates, DefaultCard, DropdownWrapper, Price } from "../styles";
import { ArrowDownIcon, LikeIcon, ShareIcon } from "../../../global/Icons";
import BTCIcon from "../../../global/Icons/BTCIcon";
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { pr: 29 },
  { pr: 33 },
  { pr: 35 },
  { pr: 40 },
  { pr: 44 },
  { pr: 48 },
  { pr: 55 },
  { pr: 53 },
  { pr: 55 },
  { pr: 50 },
  { pr: 60 },
  { pr: 40 },
  { pr: 44 },
  { pr: 48 },
  { pr: 55 },
  { pr: 53 },
  { pr: 55 },
  { pr: 50 },
  { pr: 60 },
  { pr: 23 },
  { pr: 25 },
  { pr: 53 },
  { pr: 55 },
  { pr: 50 },
  { pr: 60 },
  { pr: 23 },
  { pr: 25 },
  { pr: 53 },
  { pr: 50 },
  { pr: 60 },
  { pr: 23 },
  { pr: 25 },
  { pr: 29 },
  { pr: 33 },
  { pr: 33 },
  { pr: 35 },
  { pr: 40 },
  { pr: 44 },
  { pr: 48 },
  { pr: 55 },
  { pr: 53 },
  { pr: 55 },
  { pr: 50 },
  { pr: 60 },
  { pr: 40 },
  { pr: 44 },
  { pr: 55 },
  { pr: 53 },
  { pr: 55 },
  { pr: 50 },
  { pr: 60 },
  { pr: 33 },
  { pr: 70 },
  { pr: 60 },
  { pr: 80 },
  { pr: 85 },
  { pr: 90 },
  { pr: 100 },
  { pr: 60 },
  { pr: 70 },
  { pr: 60 },
  { pr: 80 },
  { pr: 85 },
  { pr: 90 },
  { pr: 100 },
  { pr: 60 },
  { pr: 40 },
  { pr: 44 },
  { pr: 48 },
  { pr: 55 },
  { pr: 53 },
  { pr: 55 },
  { pr: 50 },
  { pr: 60 },
  { pr: 40 },
  { pr: 40 },
  { pr: 44 },
  { pr: 48 },
  { pr: 55 },
  { pr: 53 },
  { pr: 55 },
  { pr: 50 },
  { pr: 60 },
  { pr: 40 },
  { pr: 44 },
  { pr: 48 },
  { pr: 55 },
  { pr: 29 },
  { pr: 33 },
  { pr: 10 },
  { pr: 12 },
  { pr: 18 },
  { pr: 23 },
  { pr: 23 },
  { pr: 25 },
  { pr: 29 },
  { pr: 33 },
  { pr: 23 },
  { pr: 25 },
  { pr: 29 },
  { pr: 33 },
];

const options = ["24H", "7D", "1M", "3M", "1Y", "All Time"];

export const BTCDominance = () => {
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [active, setActive] = useState("All Time");

  return (
    <DefaultCard variant="default">
      <div className="header">
        <div>
          <ShareIcon />
          <b>
            <BTCIcon /> BTC Dominance
          </b>
        </div>
        <div>
          <LikeIcon fill="#000" />
          <DropdownWrapper active={activeDropdown}>
            <div>
              <div
                className="button"
                onClick={() => setActiveDropdown((state) => !state)}
              >
                <ArrowDownIcon /> {active}
              </div>
              {activeDropdown && (
                <ul>
                  {options.map((option) => (
                    <li
                      onClick={() => setActive(option)}
                      className={active === option ? "active" : ""}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DropdownWrapper>
        </div>
      </div>
      <br />
      <Price>
        <p>40%</p>
        <p className="top">+2.04%</p>
      </Price>
      <LineChart width={590} height={200} data={data}>
        <Line
          type="monotone"
          dataKey="pr"
          stroke="#F7931A"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
      <Dates>
        <p>3 Dec</p>
        <p>5 Dec</p>
        <p>7 Dec</p>
        <p>8 Dec</p>
      </Dates>
    </DefaultCard>
  );
};
