/* eslint-disable */
import React, { useState } from "react";
import {
  AreaWrapper,
  DefaultCard,
  DropdownWrapper,
  FlexContainer,
  PieWrapper,
} from "../styles";
import { ArrowDownIcon, LikeIcon, ShareIcon } from "../../../global/Icons";
import Checkbox from "../../../global/common/Checkbox";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CustomTooltip } from "../../../global/CustomTooltip";

const options = ["24H", "7D", "1M", "3M", "1Y", "All Time"];

const areaGraphic = [
  { br: 100, dr: 200, pr: 10, date: "18.04" },
  { br: 300, dr: 500, pr: 200, date: "19.04" },
  { br: 200, dr: 400, pr: 150, date: "20.04" },
  { br: 100, dr: 100, pr: 250, date: "21.04" },
  { br: 400, dr: 300, pr: 30, date: "22.04" },
  { br: 300, dr: 200, pr: 100, date: "23.04" },
  { br: 100, dr: 200, pr: 444, date: "24.04" },
  { br: 200, dr: 400, pr: 333, date: "25.04" },
  { br: 500, dr: 600, pr: 200, date: "26.04" },
  { br: 600, dr: 500, pr: 400, date: "28.04" },
  { br: 400, dr: 400, pr: 500, date: "28.04" },
];

const data = [
  {
    name: "Group A",
    value: 75,
  },
  {
    name: "Group B",
    value: 25,
  },
];

export const FearGreedIndex = () => {
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [active, setActive] = useState("All Time");
  const [market, setMarket] = useState(false);
  const [bitcoin, setBitcoin] = useState(false);

  return (
    <DefaultCard variant="default">
      <div className="header">
        <div>
          <ShareIcon />
          <b>Fear & Greed Index</b>
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
      <FlexContainer>
        <Checkbox
          checked={market}
          onChange={() => setMarket((prevState) => !prevState)}
          label="Market"
        />
        <Checkbox
          checked={bitcoin}
          onChange={() => setBitcoin((prevState) => !prevState)}
          label="Bitcoin"
        />
      </FlexContainer>
      <br />
      <FlexContainer>
        <AreaWrapper>
          <AreaChart width={400} height={200} data={areaGraphic}>
            <XAxis dataKey="date" axisLine={{ stroke: "#fff" }} />
            <YAxis dataKey="pr" axisLine={{ stroke: "#fff" }} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              dataKey="pr"
              stroke="#00C099"
              fill="rgba(0, 192, 153, 0.1)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              dataKey="br"
              stroke="#0D0F2A"
              fill="rgba(255, 255, 255, 0)"
              strokeWidth={2}
              dot={false}
            />
            <Area
              dataKey="dr"
              stroke="#FFC702"
              fill="rgba(255, 255, 255, 0)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </AreaWrapper>
        <PieWrapper>
          <h2>40</h2>
          <PieChart width={110} height={110}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={35}
              outerRadius={55}
              fill="#fff"
            >
              <Cell fill="#04A584" />
            </Pie>
          </PieChart>
        </PieWrapper>
      </FlexContainer>
    </DefaultCard>
  );
};
