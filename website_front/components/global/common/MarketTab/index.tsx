import React, { FC, useState } from "react";
import { CopyIcon, VerticalDotsIcon } from "../../Icons";
import AttatchmentIcon from "../../Icons/AttatchmentIcon";
import HorizontalDotsIcon from "../../Icons/HorizontalDots";
import { ICryptoTab } from "../../../layouts/projects/CryptoMarket/createTabContext";
import {
  ActionButton,
  ActionsButtons,
  ActionsModal,
  Overlay,
  TabImage,
  TabBody,
  Wrapper,
} from "./styles";
import moment from "moment";
import imageLoader from "../../../../helpers/imageLoader";

interface IProps {
  tab: ICryptoTab;
  isPinned?: boolean;
  onDelete: (tab: ICryptoTab) => void;
  onUpdate: (tab: ICryptoTab) => void;
  confirmPin: (id: string) => Promise<void>;
  confirmDuplicate: (tab: ICryptoTab) => Promise<void>;
}

const MarketTab: FC<IProps> = ({
  tab,
  isPinned,
  onUpdate,
  onDelete,
  confirmPin,
  confirmDuplicate,
}) => {
  const [isActionModal, setIsActionModal] = useState<boolean>(false);
  const tabImage = String((tab as any)?.image || (tab as any)?.logo || "").trim();

  return (
    <Wrapper>
      <VerticalDotsIcon />
      {tabImage ? (
        <TabImage src={imageLoader(tabImage)} alt={tab.name} />
      ) : null}
      <TabBody>
        <div className="name">{tab.name}</div>
        <div className="description">{tab.description}</div>
        <div className="date">
          {tab.dateUpdate ? (
            moment(new Date(tab.dateUpdate)).format("ll")
          ) : (
            <></>
          )}
        </div>
      </TabBody>
      <ActionsButtons>
        <button onClick={() => confirmPin(tab._id || "")}>
          <AttatchmentIcon color={isPinned ? "#04A584" : "#738094"} />
        </button>
        <ActionButton
          onClick={() => setIsActionModal((prev: boolean) => !prev)}
        >
          <HorizontalDotsIcon />
        </ActionButton>
        <ActionsModal isVisible={isActionModal}>
          {tab.canEdit !== false ? (
            <button
              onClick={() => {
                onUpdate(tab);
                setIsActionModal((prev: boolean) => !prev);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="13"
                viewBox="0 0 14 13"
                fill="none"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.11753 1.37751C7.83253 0.207495 6.16747 0.207495 5.88247 1.37751C5.83991 1.55333 5.75645 1.71661 5.63887 1.85408C5.5213 1.99155 5.37292 2.09931 5.20583 2.1686C5.03873 2.2379 4.85764 2.26676 4.67728 2.25284C4.49692 2.23893 4.3224 2.18263 4.16791 2.08852C3.13888 1.46152 1.96134 2.63903 2.58836 3.66805C2.99337 4.33256 2.63411 5.19957 1.87809 5.38333C0.707303 5.66758 0.707303 7.33336 1.87809 7.61686C2.05395 7.65947 2.21727 7.743 2.35474 7.86067C2.49221 7.97833 2.59994 8.1268 2.66917 8.29399C2.7384 8.46117 2.76716 8.64234 2.75312 8.82274C2.73908 9.00314 2.68263 9.17768 2.58836 9.33214C1.96134 10.3612 3.13888 11.5387 4.16791 10.9117C4.32237 10.8174 4.49691 10.7609 4.67732 10.7469C4.85772 10.7329 5.03889 10.7616 5.20608 10.8309C5.37326 10.9001 5.52174 11.0078 5.6394 11.1453C5.75707 11.2827 5.84061 11.4461 5.88322 11.6219C6.16747 12.7927 7.83328 12.7927 8.11679 11.6219C8.15953 11.4462 8.24315 11.283 8.36085 11.1456C8.47854 11.0082 8.62699 10.9005 8.79412 10.8313C8.96126 10.7621 9.14236 10.7333 9.32272 10.7473C9.50307 10.7613 9.67759 10.8176 9.83209 10.9117C10.8611 11.5387 12.0387 10.3612 11.4116 9.33214C11.3175 9.17764 11.2612 9.00313 11.2473 8.82277C11.2333 8.64242 11.2621 8.46132 11.3313 8.29419C11.4005 8.12706 11.5082 7.97861 11.6456 7.86092C11.7829 7.74323 11.9461 7.65961 12.1219 7.61686C13.2927 7.33261 13.2927 5.66683 12.1219 5.38333C11.946 5.34072 11.7827 5.25718 11.6453 5.13952C11.5078 5.02185 11.4001 4.87338 11.3308 4.7062C11.2616 4.53902 11.2328 4.35785 11.2469 4.17745C11.2609 3.99704 11.3174 3.82251 11.4116 3.66805C12.0387 2.63903 10.8611 1.46152 9.83209 2.08852C9.67763 2.18279 9.50309 2.23924 9.32268 2.25328C9.14228 2.26732 8.96111 2.23856 8.79392 2.16933C8.62674 2.1001 8.47826 1.99237 8.3606 1.8549C8.24293 1.71744 8.15939 1.55413 8.11679 1.37826L8.11753 1.37751Z"
                  stroke="#738094"
                />
                <path
                  d="M8.33333 6.5C8.33333 7.23638 7.73638 7.83333 7 7.83333C6.26362 7.83333 5.66667 7.23638 5.66667 6.5C5.66667 5.76362 6.26362 5.16667 7 5.16667C7.73638 5.16667 8.33333 5.76362 8.33333 6.5Z"
                  stroke="#738094"
                />
              </svg>
              Customize
            </button>
          ) : (
            <></>
          )}
          <button onClick={() => confirmDuplicate(tab)}>
            <CopyIcon fill="#738094" />
            Duplicate
          </button>
          {tab.canDelete !== false ? (
            <button
              onClick={() => {
                onDelete(tab);
                setIsActionModal(false);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="13"
                viewBox="0 0 12 13"
                fill="none"
              >
                <path
                  d="M0.666992 2.61765H11.3337M4.00033 0.5H8.00033M8.33366 12.5H3.66699C2.93061 12.5 2.33366 11.8679 2.33366 11.0882L2.02926 3.35292C2.01348 2.95189 2.31627 2.61765 2.69535 2.61765H9.3053C9.68438 2.61765 9.98717 2.95189 9.97139 3.35292L9.66699 11.0882C9.66699 11.8679 9.07004 12.5 8.33366 12.5Z"
                  stroke="#738094"
                  strokeLinecap="round"
                />
              </svg>
              Delete
            </button>
          ) : (
            <></>
          )}
        </ActionsModal>
      </ActionsButtons>
      {isActionModal ? (
        <Overlay onClick={() => setIsActionModal(false)} />
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default MarketTab;
