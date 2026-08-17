import React, { FC } from "react";
import { Body, Header, Row, Wrapper } from "./styles";
import {
  IAchievement,
  IProject,
} from "../../../../../../../types/global_types";
import CreateButton from "../../../../../../global/common/CreateButton";
import { CloseIcon } from "../../../../../../global/Icons";
import { generateId } from "../../../../../../../helpers/generateId";
import EmptySection from "../../../../../../global/EmptySection";

const items = [
  {
    achievement: "Launch of Solana Mainnet (March 2020)",
    description:
      "The Solana team successfully launched the Solana mainnet, introducing a high-performance blockchain capable of processing thousands of transactions per second with low fees",
  },
  {
    achievement: "$314 Million Funding Round (June 2021)",
    description:
      "Solana Labs raised $314 million in a funding round led by Andreessen Horowitz and Polychain Capital, bolstering the development and expansion of the Solana ecosystem",
  },
  {
    achievement: "Processing 276 Billion Transactions",
    description:
      "As of March 2024, the Solana network processed over 276 billion transactions, demonstrating its scalability and widespread adoption",
  },
  {
    achievement: "Over 1,600 Validators",
    description:
      "The network’s decentralization is supported by more than 1,600 validators globally, enhancing security and resilience",
  },
  {
    achievement: "Integration with Leading DeFi Projects",
    description:
      "Solana has integrated with top decentralized finance (DeFi) projects, expanding its ecosystem and offering users access to a variety of financial services",
  },
];

export interface IEditProps {
  project: IProject;
  projectDataToUpdate?: IProject | null;
  isEditState?: boolean;
  inputsHandler?: (name: string, value: any) => void;
}

const TeamAchievements: FC<IEditProps> = ({
  project,
  projectDataToUpdate,
  isEditState,
  inputsHandler,
}) => {
  const teamAchievements: Array<IAchievement> | undefined = isEditState
    ? projectDataToUpdate?.achievements
    : project.achievements;

  const addAchievement = (): void => {
    inputsHandler &&
      inputsHandler(
        "achievements",
        teamAchievements
          ? [
              ...teamAchievements,
              { id: generateId(), name: "", description: "" },
            ]
          : [{ id: generateId(), name: "", description: "" }]
      );
  };

  const removeInput = (id: string): void => {
    teamAchievements &&
      inputsHandler &&
      inputsHandler(
        "achievements",
        teamAchievements.filter((item, i: number) => {
          return item.id !== id;
        })
      );
  };

  const textInputHandler = (id: string, name: string, value: string): void => {
    if (!teamAchievements) return;

    const updatedLinks: Array<IAchievement> = teamAchievements.map(
      (item: IAchievement) => {
        if (item.id === id) {
          return { ...item, [name]: value };
        }

        return item;
      }
    );

    inputsHandler && inputsHandler("achievements", updatedLinks);
  };

  return (
    <Wrapper variant="main">
      <Header>
        <div>Achievement</div>
        <div>Description</div>
      </Header>
      {isEditState ? (
        <Body>
          {teamAchievements?.length ? (
            teamAchievements.map((item, i: number) => {
              return (
                <Row key={`${item.id}${i}`}>
                  <input
                    value={item.name}
                    onChange={(e: any) =>
                      textInputHandler(item.id, "name", e.target.value)
                    }
                    placeholder="Enter team achievement"
                  />
                  <input
                    value={item.description}
                    onChange={(e: any) =>
                      textInputHandler(item.id, "description", e.target.value)
                    }
                    placeholder="Enter description"
                  />
                  <button onClick={() => removeInput(item.id)}>
                    <CloseIcon fill="var(--main-gray)" />
                  </button>
                </Row>
              );
            })
          ) : (
            <>
              <br />
              <EmptySection />
            </>
          )}
        </Body>
      ) : (
        <Body>
          {teamAchievements?.length ? (
            teamAchievements.map((item, i: number) => {
              return (
                <Row key={`${item.id}${i}`}>
                  <div className="key">{item.name}</div>
                  <div className="value">{item.description}</div>
                </Row>
              );
            })
          ) : (
            <>
              <br />
              <EmptySection />
            </>
          )}
        </Body>
      )}
      {isEditState ? (
        <CreateButton type="add" onClick={addAchievement}>
          Add Achievement
        </CreateButton>
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default TeamAchievements;
