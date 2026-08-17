import React, { FC } from "react";
import { Item, List, Wrapper } from "./styles";
import { IProject } from "../../../../../../types/global_types";
import CreateButton from "../../../../../global/common/CreateButton";
import Checkbox from "../../../../../global/common/Checkbox";
import { CloseIcon } from "../../../../../global/Icons";
import SearchProject from "../../../../../global/SearchProject";
import ProjectsSearch from "../../../../../global/common/ProjectsSearch";
import CustomNumberInput from "../../../../../global/common/components_for_modals/custom_number_input";

export interface IPersonPortfolioItem {
  id: number;
  project?: IProject;
  investedRound: string;
  investedAmount: number;
  preValuation?: number;
  stage?: string;
  currentRoi: number;
  status: "Active" | "Exit" | "Ended";
  exitDate: Date | string;
  exitRoi: number;
}

interface IProps {
  items: Array<IPersonPortfolioItem>;
  onChange: (items: Array<IPersonPortfolioItem>) => void;
}

const AddPortfolioItem: FC<IProps> = ({ items, onChange }) => {
  const addPortfolioItem = (): void => {
    const updatedItems: Array<IPersonPortfolioItem> = [
      ...items,
      {
        id: new Date().getTime(),
        investedRound: "",
        investedAmount: 0,
        currentRoi: 0,
        status: "Active",
        exitDate: new Date(),
        exitRoi: 0,
      },
    ];

    onChange(updatedItems);
  };

  const deleteItem = (id: number): void => {
    const updatedItems: Array<IPersonPortfolioItem> = items.filter(
      (item: IPersonPortfolioItem) => item.id !== id
    );

    onChange(updatedItems);
  };

  const inputsHandler = (id: number, name: string, value: any): void => {
    const updatedItems: Array<IPersonPortfolioItem> = items.map(
      (item: IPersonPortfolioItem) => {
        if (item.id === id) {
          return { ...item, [name]: value };
        }

        return item;
      }
    );

    onChange(updatedItems);
  };

  return (
    <Wrapper>
      <List>
        {items.map((item: IPersonPortfolioItem) => {
          return (
            <Item key={item.id} variant="main">
              <button
                onClick={() => deleteItem(item.id)}
                className="remove-btn"
              >
                <CloseIcon fill="var(--main-gray)" />
              </button>
              <div className="row-item">
                <div className="row-key">Project Name:</div>
                <ProjectsSearch
                  className="project-input"
                  isOneProject
                  projects={item.project ? [item.project] : []}
                  onChange={(items: Array<IProject>) =>
                    inputsHandler(item.id, "project", items[0])
                  }
                  placeholder="Enter project name"
                />
              </div>

              <div className="row-item">
                <div className="row-key">Invested Round:</div>
                <input
                  placeholder="Enter invested round"
                  value={item.investedRound}
                  onChange={(e: any) =>
                    inputsHandler(item.id, "investedRound", e.target.value)
                  }
                />
              </div>

              <div className="row-item">
                <div className="row-key">Amount Invested:</div>
                <CustomNumberInput
                  icon="dollar"
                  placeholder="Enter amount"
                  value={item.investedAmount}
                  onChange={(value: number) =>
                    inputsHandler(item.id, "investedAmount", value)
                  }
                />
              </div>

              <div className="row-item">
                <div className="row-key">Current ROI:</div>
                <CustomNumberInput
                  isPrice={false}
                  icon="close"
                  placeholder="Enter amount"
                  value={item.currentRoi}
                  onChange={(value: number) =>
                    inputsHandler(item.id, "currentRoi", value)
                  }
                />
              </div>

              <div className="row-item">
                <div className="row-key">Status:</div>
                <div className="status-items">
                  <div className="status-item green">
                    <Checkbox
                      label="Active"
                      checked={item.status === "Active"}
                      onChange={() =>
                        inputsHandler(item.id, "status", "Active")
                      }
                    />
                  </div>

                  <div className="status-item red">
                    <Checkbox
                      label="Exit"
                      checked={item.status === "Exit"}
                      onChange={() => inputsHandler(item.id, "status", "Exit")}
                    />
                  </div>
                </div>
              </div>

              <div className="row-item">
                <div className="row-key">Exit Date:</div>
                <input
                  className="date-input"
                  type="date"
                  value={String(item.exitDate)}
                  onChange={(e: any) =>
                    inputsHandler(item.id, "exitDate", e.target.value)
                  }
                />
              </div>

              <div className="row-item">
                <div className="row-key">Exit ROI:</div>
                <CustomNumberInput
                  isPrice={false}
                  icon="close"
                  placeholder="Enter amount"
                  value={item.exitRoi}
                  onChange={(value: number) =>
                    inputsHandler(item.id, "exitRoi", value)
                  }
                />
              </div>
            </Item>
          );
        })}
      </List>
      <CreateButton onClick={addPortfolioItem} type="add">
        Add Investment
      </CreateButton>
    </Wrapper>
  );
};

export default AddPortfolioItem;
