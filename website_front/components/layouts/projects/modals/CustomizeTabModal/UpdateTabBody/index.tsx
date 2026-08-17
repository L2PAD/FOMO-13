import React, { FC, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import Modal from "../../../../../global/common/Modal";
import Checkbox from "../../../../../global/common/Checkbox";
import { CloseIcon, VerticalDotsIcon } from "../../../../../global/Icons";
import {
  CustomTabsDefault,
  getCustomTabDisplayLabel,
  ICustomTabs,
} from "../../../../../../staticContent/tabs";
import {
  ActionsWrapper,
  Body,
  CheckboxesWrapper,
  LeftColumn,
  RightColumn,
  TableRow,
  TablesWrapper,
} from "../styles";
import MainModal from "../../../../../global/common/MainModal";
import {
  ResetButton,
  Actions,
} from "../../../../../global/UniversalFilter/styles";
import { Action } from "../../../../../global/LeftNav/styles";
import Button from "../../../../../global/common/Button";
import { InputError } from "../../CreateOwnAsset/styles";

export const DescriptionText = styled.div`
  font-weight: var(--font-weight-regular);
  font-size: 16px;
  color: var(--main-black);
  margin: 20px 0 10px;
`;

interface Props {
  tabsInitial: Array<ICustomTabs>;
  buttonText?: string;
  leftButtonText?: string;
  description?: string;
  onClose: () => void;
  onConfirm?: (tabs: Array<ICustomTabs>) => void;
}

const UpdateCustomizeTabBody: FC<Props> = ({
  onClose,
  onConfirm,
  buttonText = "Apply",
  leftButtonText,
  description,
  tabsInitial,
}) => {
  const [tabs, setTabs] = useState<Array<ICustomTabs>>(tabsInitial);
  const [isError, setIsError] = useState<boolean>(false);

  const updateTabs = (key: string): void => {
    const exists = tabs.find((tab) => tab.key === key);
    if (exists) {
      setTabs((prev) =>
        prev.map((tab) =>
          tab.key === key ? { ...tab, isActive: !tab.isActive } : tab
        )
      );
    } else {
      const defaultTab = CustomTabsDefault.find((tab) => tab.key === key);
      if (defaultTab) {
        setTabs((prev) => [...prev, { ...defaultTab, isActive: true }]);
      }
    }
  };

  const confirmTabs = (): void => {
    const activeTabs = tabs.filter((tab) => tab.isActive);
    if (!activeTabs.length) {
      setIsError(true);
      setTimeout(() => setIsError(false), 3000);
      return;
    }
    onConfirm?.(
      activeTabs.map((item: ICustomTabs, i: number) => {
        return { ...item, index: i };
      })
    );
  };

  const onReset = (): void => {
    setTabs([]);
  };

  const isTabActive = (key: string): boolean => {
    return tabs.some((tab) => tab.key === key && tab.isActive);
  };

  const activeTabs = useMemo(() => {
    return tabs.filter((tab) => tab.isActive);
  }, [tabs]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("draggedTabIndex", index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    const draggedIndex = e.dataTransfer.getData("draggedTabIndex");
    if (draggedIndex) {
      const newTabs = [...tabs];
      const draggedTab = newTabs.splice(Number(draggedIndex), 1)[0];
      newTabs.splice(index, 0, draggedTab);
      setTabs(newTabs);
    }
  };

  const groupedDefaultTabs = useMemo(() => {
    const group: Record<string, ICustomTabs[]> = {};
    CustomTabsDefault.forEach((tab) => {
      if (!group[tab.blockName]) group[tab.blockName] = [];
      group[tab.blockName].push(tab);
    });
    return group;
  }, []);

  useEffect(() => {
    setTabs(tabsInitial);
  }, [tabsInitial]);

  return (
    <>
      {description && <DescriptionText>{description}</DescriptionText>}
      <Body>
        <LeftColumn>
          {Object.entries(groupedDefaultTabs).map(([blockName, items]) => (
            <CheckboxesWrapper key={blockName}>
              <p>{blockName}</p>
              <div>
                {items.map((item) => (
                  <Checkbox
                    key={item.key}
                    label={item.label}
                    checked={isTabActive(item.key)}
                    onChange={() => updateTabs(item.key)}
                  />
                ))}
              </div>
            </CheckboxesWrapper>
          ))}
        </LeftColumn>

        <RightColumn>
          <TablesWrapper>
            {activeTabs.map((item, index) => (
              <TableRow
                key={item.key}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                className="task-item"
              >
                <div>
                  <VerticalDotsIcon />
                  <p>{getCustomTabDisplayLabel(item)}</p>
                </div>
                <button onClick={() => updateTabs(item.key)}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="8"
                    height="8"
                    viewBox="0 0 8 8"
                    fill="none"
                  >
                    <path
                      d="M7.33366 0.667969L0.666992 7.33463M7.33366 7.33463L0.666993 0.667967"
                      stroke="#738094"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </TableRow>
            ))}
          </TablesWrapper>
        </RightColumn>
      </Body>

      {isError && (
        <InputError>
          <br />
          Your tab’s feeling a little empty. Pick some metrics to give it life!
        </InputError>
      )}

      <Actions>
        <Action onClick={onClose} actionType="red">
          {leftButtonText || "Cancel"}
        </Action>
        <Button onClick={confirmTabs} variant="primary">
          {buttonText}
        </Button>
      </Actions>

      <ResetButton>
        <button onClick={onReset}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="12"
            viewBox="0 0 13 12"
            fill="none"
          >
            <path
              d="M1.74776 7.66797C2.42642 9.79726 4.37008 11.3346 6.66194 11.3346C9.5182 11.3346 11.8337 8.94682 11.8337 6.0013C11.8337 3.05578 9.5182 0.667969 6.66194 0.667969C4.74768 0.667969 3.07632 1.7405 2.18211 3.33464M3.75285 4.0013H1.16699V1.33464"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Reset</span>
        </button>
      </ResetButton>
    </>
  );
};

export default UpdateCustomizeTabBody;
