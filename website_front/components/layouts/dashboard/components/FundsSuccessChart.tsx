/* eslint-disable */
import React, { useState } from "react";
import { Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";
import {
  AreaWrapper,
  DefaultCard,
  DropdownWrapper,
  FlexContainer,
} from "../styles";
import { ArrowDownIcon, LikeIcon, ShareIcon } from "../../../global/Icons";
import RatingIcon from "../../../global/Icons/RatingIcon";
import { CustomTooltip } from "../../../global/CustomTooltip";

interface Props {
  header: string;
}

const areaGraphic = [
  { br: 100, pr: 10, date: "18.04" },
  { br: 300, pr: 200, date: "19.04" },
  { br: 200, pr: 150, date: "20.04" },
  { br: 100, pr: 250, date: "21.04" },
  { br: 400, pr: 30, date: "22.04" },
  { br: 300, pr: 100, date: "23.04" },
  { br: 100, pr: 444, date: "24.04" },
  { br: 200, pr: 333, date: "25.04" },
  { br: 500, pr: 200, date: "26.04" },
  { br: 600, pr: 400, date: "28.04" },
  { br: 400, pr: 500, date: "28.04" },
];

const options = ["24H", "7D", "1M", "3M", "1Y", "All Time"];
const numberOfProjectsOptions = [
  "ROI",
  "Popularity",
  "Hold",
  "Categories",
  "Number of projects",
];
const compareWithFundsOptions = ["Compare with funds"];

export const FundsSuccessChart = ({ header }: Props) => {
  const [isTop, setIsTop] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [activeNumberOfProjects, setActiveNumberOfProjects] = useState(false);
  const [activeCompareWithFunds, setActiveCompareWithFunds] = useState(false);
  const [active, setActive] = useState("All Time");
  const [numberOfProjects, setNumberOfProjects] =
    useState("Number of projects");
  const [compareWithFunds, setCompareWithFunds] =
    useState("Compare with funds");

  return (
    <DefaultCard variant="default">
      <div className="header">
        <div>
          <ShareIcon />
          <b>{header}</b>
        </div>
        <div>
          <RatingIcon
            fill={isTop ? "#FF5858" : "#04A584"}
            onClick={() => setIsTop((prevTop) => !prevTop)}
          />
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
      <FlexContainer>
        <DropdownWrapper active={activeNumberOfProjects}>
          <div>
            <div
              className="button green"
              onClick={() => setActiveNumberOfProjects((state) => !state)}
            >
              {numberOfProjects}
              <ArrowDownIcon fill="#04A584" />
            </div>
            {activeNumberOfProjects && (
              <ul className="green">
                {numberOfProjectsOptions.map((option) => (
                  <li
                    onClick={() => setNumberOfProjects(option)}
                    className={numberOfProjects === option ? "active" : ""}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DropdownWrapper>
        <DropdownWrapper active={activeCompareWithFunds}>
          <div>
            <div
              className="button green"
              onClick={() => setActiveCompareWithFunds((state) => !state)}
            >
              {compareWithFunds}
              <ArrowDownIcon fill="#04A584" />
            </div>
            {activeCompareWithFunds && (
              <ul className="green">
                {compareWithFundsOptions.map((option) => (
                  <li
                    onClick={() => setCompareWithFunds(option)}
                    className={compareWithFunds === option ? "active" : ""}
                  >
                    {option}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DropdownWrapper>
      </FlexContainer>
      <br />
      <AreaWrapper>
        <AreaChart width={1200} height={400} data={areaGraphic}>
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
        </AreaChart>
      </AreaWrapper>
    </DefaultCard>
  );
};
