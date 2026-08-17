import React, { FC, useState } from "react";
import { DescriptionWrapper, Item, Items, Title, Wrapper } from "./styles";
import InfoIcon from "../../../../../global/Icons/InfoIcon";
import UserAvatar from "../../../../../global/common/UserAvatar";
import imageLoader from "../../../../../../helpers/imageLoader";
import DescriptionComponent from "../../../../../global/common/DescriptionComponent";
import { IFundProps } from "..";
import moment from "moment";
import EmptySection from "../../../../../global/EmptySection";
import CreateButton from "../../../../../global/common/CreateButton";
import { IFundActivity, IProject } from "../../../../../../types/global_types";
import { generateId } from "../../../../../../helpers/generateId";
import ProjectsSearch from "../../../../../global/common/ProjectsSearch";
import CustomTextarea from "../../../../../global/common/CustomTextarea";
import { CloseIcon } from "../../../../../global/Icons";

interface IProps {}

// const activities = [
//     {
//         logo: '/c64d5df45b10d601e2da3657396bb307.png',
//         rating: 94,
//         event: 'Strategic Investment',
//         name: 'QuantumAI',
//         niche: 'AI & DeFi',
//         description: 'Alpha Ventures strategically invested $20 million into QuantumAI, a next-generation AI-powered predictive analytics platform designed to optimize DeFi automation.',
//         date: 'Feb 10, 2025'
//     },
//     {
//         logo: '/c64d5df45b10d601e2da3657396bb307.png',
//         rating: 94,
//         event: 'Series A',
//         name: 'MetaAi',
//         niche: 'AI & Trading',
//         description: 'Alpha Ventures led a $15 million Series A round for MetaAI, an AI-driven automated trading protocol.',
//         date: 'Jan 03, 2025'
//     },
//     {
//         logo: '/c64d5df45b10d601e2da3657396bb307.png',
//         rating: 94,
//         event: 'Seed Round',
//         name: 'DeFiX',
//         niche: 'DeFi & Liquidity',
//         description: 'Alpha Ventures participated in a $10 million seed round for DeFiX, a cross-chain liquidity aggregator built to reduce slippage and optimize capital efficiency across multiple blockchain networks.',
//         date: 'Dec 05, 2024'
//     },
//     {
//         logo: '/c64d5df45b10d601e2da3657396bb307.png',
//         rating: 94,
//         event: 'Strategic Investment',
//         name: 'PlayFi',
//         niche: 'AI & DeFi',
//         description: 'Alpha Ventures strategically invested $20 million into QuantumAI, a next-generation AI-powered predictive analytics platform designed to optimize DeFi automation.',
//         date: 'Feb 10, 2025'
//     },
//     {
//         logo: '/c64d5df45b10d601e2da3657396bb307.png',
//         rating: 94,
//         event: 'Series A',
//         name: 'MetaAi',
//         niche: 'AI & Trading',
//         description: 'Alpha Ventures led a $15 million Series A round for MetaAI, an AI-driven automated trading protocol.',
//         date: 'Jan 03, 2025'
//     },
// ]

const FundActivities: FC<IFundProps> = ({
  fund,
  fundDataToUpdate,
  isEditState,
  inputsHandler,
}) => {
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const addItem = (): void => {
    const id: string = generateId();

    const updatedItems: Array<IFundActivity> = fundDataToUpdate?.activities
      ?.length
      ? [
          ...fundDataToUpdate.activities,
          {
            id,
            description: "",
            round: "",
            date: new Date(),
          },
        ]
      : [
          {
            id,
            description: "",
            round: "",
            date: new Date(),
          },
        ];

    inputsHandler("activities", updatedItems);
  };

  const deleteItem = (id: string): void => {
    if (!fundDataToUpdate?.activities) return;

    const updatedItems: Array<IFundActivity> =
      fundDataToUpdate.activities.filter(
        (item: IFundActivity) => item.id !== id
      );

    inputsHandler("activities", updatedItems);
  };

  const onChange = (id: string, name: string, value: any): void => {
    if (!fundDataToUpdate?.activities) return;

    const updatedItems: Array<IFundActivity> = fundDataToUpdate.activities.map(
      (item: IFundActivity) => {
        if (item.id === id) {
          return { ...item, [name]: value };
        }

        return item;
      }
    );

    inputsHandler("activities", updatedItems);
  };

  return (
    <Wrapper>
      <Title>
        <span>Recent Fund Activities</span>
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
            text={`
                    Displays the latest investment actions taken by the fund, including new capital allocations, funding rounds, and strategic acquisitions. 
                    It helps track where the fund is investing and how it supports emerging projects.
                `}
          />
        </DescriptionWrapper>
      </Title>
      {isEditState ? (
        <Items>
          {fundDataToUpdate?.activities?.length ? (
            fundDataToUpdate?.activities?.map((item: IFundActivity, i) => {
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
                      <div className="row-key">Invested Round:</div>
                      <input
                        placeholder="Enter invested round"
                        value={item.round}
                        onChange={(e: any) =>
                          onChange(item.id, "round", e.target.value)
                        }
                      />
                    </div>
                    <div className="row-item">
                      <div className="row-key">Date:</div>
                      <input
                        className="date-input"
                        type="date"
                        value={String(item.date)}
                        onChange={(e: any) =>
                          onChange(item.id, "date", e.target.value)
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
              Add Activity
            </CreateButton>
          </div>
        </Items>
      ) : (
        <Items>
          {fund?.activities?.length ? (
            fund?.activities?.map((item: IFundActivity, i) => {
              return (
                <Item variant="main" key={item.id}>
                  <div className="header">
                    <div className="project">
                      <UserAvatar
                        variant="default"
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
                      <div>{item.round}</div>
                      <span>{moment(item.date).format("ll")}</span>
                    </div>
                  </div>
                  <div className="description">{item.description}</div>
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
        </Items>
      )}
    </Wrapper>
  );
};

export default FundActivities;
