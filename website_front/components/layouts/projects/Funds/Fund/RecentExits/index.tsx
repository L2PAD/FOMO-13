import React, { FC, useState } from "react";
import { Item, Items, Title, Wrapper } from "./styles";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import { DescriptionWrapper } from "../FundActivities/styles";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import { IFundProps } from "..";
import EmptySection from "../../../../../global/EmptySection";
import { IProject, IRecentExits } from "../../../../../../types/global_types";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import moment from "moment";
import CreateButton from "../../../../../global/common/CreateButton";
import { generateId } from "../../../../../../helpers/generateId";
import { CloseIcon } from "../../../../../global/Icons";
import ProjectsSearch from "../../../../../global/common/ProjectsSearch";
import CustomTextarea from "../../../../../global/common/CustomTextarea";

interface IProps {}

const activities = [
  {
    logo: "/5538.809090677166_img1.jpg",
    rating: 94,
    event: "Strategic Investment",
    name: "SharkRace Club",
    niche: "NFT & Gaming",
    description:
      "Alpha Ventures strategically invested $20 million into QuantumAI, a next-generation AI-powered predictive analytics platform designed to optimize DeFi automation.",
    date: "Feb 10, 2025",
  },
  {
    logo: "/5538.809090677166_img1.jpg",
    rating: 94,
    event: "Series A",
    name: "NeuralNetX",
    niche: "AI & Web3 Infrastructure",
    description:
      "Alpha Ventures led a $15 million Series A round for MetaAI, an AI-driven automated trading protocol.",
    date: "Jan 03, 2025",
  },
  {
    logo: "/5538.809090677166_img1.jpg",
    rating: 94,
    event: "Seed Round",
    name: "DeFiX",
    niche: "DeFi & Liquidity",
    description:
      "Alpha Ventures participated in a $10 million seed round for DeFiX, a cross-chain liquidity aggregator built to reduce slippage and optimize capital efficiency across multiple blockchain networks.",
    date: "Dec 05, 2024",
  },
  {
    logo: "/5538.809090677166_img1.jpg",
    rating: 94,
    event: "Strategic Investment",
    name: "PlayFi",
    niche: "AI & DeFi",
    description:
      "Alpha Ventures strategically invested $20 million into QuantumAI, a next-generation AI-powered predictive analytics platform designed to optimize DeFi automation.",
    date: "Feb 10, 2025",
  },
  {
    logo: "/5538.809090677166_img1.jpg",
    rating: 94,
    event: "Series A",
    name: "MetaAi",
    niche: "AI & Trading",
    description:
      "Alpha Ventures led a $15 million Series A round for MetaAI, an AI-driven automated trading protocol.",
    date: "Jan 03, 2025",
  },
];

const RecentExits: FC<IFundProps> = ({
  fund,
  fundDataToUpdate,
  isEditState,
  inputsHandler,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const addItem = (): void => {
    const id: string = generateId();

    const updatedItems: Array<IRecentExits> = fundDataToUpdate?.recentExits
      ?.length
      ? [
          ...fundDataToUpdate.recentExits,
          {
            id,
            description: "",
            round: "",
            date: new Date(),
            initialInvestment: 0,
            roundDate: new Date(),
            exitAmount: 0,
            roi: 0,
          },
        ]
      : [
          {
            id,
            description: "",
            round: "",
            date: new Date(),
            initialInvestment: 0,
            roundDate: new Date(),
            exitAmount: 0,
            roi: 0,
          },
        ];

    inputsHandler("recentExits", updatedItems);
  };

  const deleteItem = (id: string): void => {
    if (!fundDataToUpdate?.recentExits) return;

    const updatedItems: Array<IRecentExits> =
      fundDataToUpdate.recentExits.filter(
        (item: IRecentExits) => item.id !== id
      );

    inputsHandler("recentExits", updatedItems);
  };

  const onChange = (id: string, name: string, value: any): void => {
    if (!fundDataToUpdate?.recentExits) return;

    const updatedItems: Array<IRecentExits> = fundDataToUpdate.recentExits.map(
      (item: IRecentExits) => {
        if (item.id === id) {
          return { ...item, [name]: value };
        }

        return item;
      }
    );

    inputsHandler("recentExits", updatedItems);
  };

  return (
    <Wrapper>
      <Title>
        <span>Recent Exits</span>
        <button
          onMouseEnter={() => setIsVisible(true)}
          onMouseLeave={() => setIsVisible(false)}
        >
          <InfoIcon />
        </button>
        <DescriptionWrapper>
          <DescriptionComponent
            className="fund-description"
            isDate={false}
            date={new Date()}
            isVisible={isVisible}
            text={`Highlights the fund’s completed exits from investments, including partial or full sell-offs of stakes in projects. 
It provides insights into the fund’s realized returns, successful exits, and capital reallocation strategies.
                `}
          />
        </DescriptionWrapper>
      </Title>
      {isEditState ? (
        <Items>
          {fundDataToUpdate?.recentExits?.length ? (
            fundDataToUpdate.recentExits.map((item: IRecentExits) => {
              return (
                <Item variant="main" key={item.id}>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="close-icon"
                  >
                    <CloseIcon />
                  </button>
                  <div className="header">
                    <div className="project-item">
                      <div className="row-key">Project Name:</div>
                      <ProjectsSearch
                        className="project-input"
                        isOneProject
                        projects={item.project ? [item.project] : []}
                        onChange={(items: Array<IProject>) =>
                          onChange(item.id, "project", items[0])
                        }
                        placeholder="Enter project name"
                      />
                    </div>

                    <div className="row-item">
                      <span className="row-key">Initial Investment:</span>
                      <input
                        type="number"
                        placeholder="Enter invested round"
                        value={String(item.initialInvestment)}
                        onChange={(e: any) =>
                          onChange(
                            item.id,
                            "initialInvestment",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="row-item">
                      <div className="row-key">Invested Round:</div>
                      <input
                        style={{ width: "100%" }}
                        placeholder="Enter invested round"
                        value={item.round}
                        onChange={(e: any) =>
                          onChange(item.id, "round", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="header">
                    <div className="row-item">
                      <div className="row-key">Exit Amount:</div>
                      <input
                        type="number"
                        style={{ width: "100%" }}
                        placeholder="Enter invested round"
                        value={item.exitAmount}
                        onChange={(e: any) =>
                          onChange(
                            item.id,
                            "exitAmount",
                            Number(e.target.value)
                          )
                        }
                      />
                    </div>
                    <div className="row-item">
                      <div className="row-key">ROI:</div>
                      <input
                        style={{ width: "100%" }}
                        className="date-input"
                        type="number"
                        value={String(item.roi)}
                        onChange={(e: any) =>
                          onChange(item.id, "roi", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="row-item">
                      <div className="row-key">Round date:</div>
                      <input
                        style={{ width: "100%" }}
                        className="date-input"
                        type="date"
                        value={String(item.roundDate)}
                        onChange={(e: any) =>
                          onChange(item.id, "roundDate", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="description">
                    <CustomTextarea
                      isMaxCharacters
                      maxCharacters={300}
                      value={item.description}
                      onChange={(value: string) =>
                        onChange(item.id, "description", value)
                      }
                    />
                  </div>
                </Item>
              );
            })
          ) : (
            <>
              <br />
              <EmptySection />
              <br />
            </>
          )}
          <div>
            <CreateButton type="add" onClick={addItem}>
              Add Recent Exits
            </CreateButton>
          </div>
        </Items>
      ) : fund?.recentExits?.length ? (
        <Items>
          {fund.recentExits.map((item: IRecentExits, i) => {
            return (
              <Item variant="main" key={item.id}>
                <div className="header">
                  <div className="project">
                    <UserAvatar
                      variant="success"
                      rating={Number(item?.project?.rating || 0)}
                      avatar={imageLoader(String(item?.project?.logo))}
                      name={item?.project?.name || ""}
                      size="otc"
                      fallbackType="project"
                    />
                    <div className="info">
                      <div>{item?.project?.name}</div>
                      <span>{item?.project?.niche}</span>
                    </div>
                  </div>
                  <div className="investment">
                    <div className="investment-header">
                      <span>Initial Investment: </span>
                      <span className="investment-value">
                        ${clarifyAmount(item.initialInvestment)} ({item.round},{" "}
                        {moment(item.roundDate).format("MMMM YYYY")})
                      </span>
                    </div>
                    <span>{moment(item.date).format("ll")}</span>
                  </div>
                </div>
                <div className="description">{item.description}</div>
                <div className="details">
                  <div className="exit">
                    <div>Exit Amount:</div>
                    <span>${clarifyAmount(item.exitAmount)}</span>
                  </div>
                  <div className="roi">
                    <div>ROI:</div>
                    <span className={item.roi > 0 ? "green" : "red"}>
                      {item.roi > 0 ? "+" : "-"}
                      {item.roi}%
                    </span>
                  </div>
                </div>
              </Item>
            );
          })}
        </Items>
      ) : (
        <>
          <br />
          <EmptySection />
          <br />
        </>
      )}
    </Wrapper>
  );
};

export default RecentExits;
