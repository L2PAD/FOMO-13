import React, { FC, useState } from "react";
import { CopyIcon, VerticalDotsIcon } from "../../Icons";
import AttatchmentIcon from "../../Icons/AttatchmentIcon";
import HorizontalDotsIcon from "../../Icons/HorizontalDots";
import {
  ActionButton,
  ActionsButtons,
  ActionsModal,
  Overlay,
  TabImage,
  TabBody,
  Wrapper,
} from "./styles";
import UserAvatar from "../UserAvatar";
import imageLoader from "../../../../helpers/imageLoader";
import SaveButton from "../SaveButton";
import { ICryptoTab } from "../../../layouts/projects/CryptoMarket/createTabContext";
import moment from "moment";

interface IProps {
  tab: ICryptoTab;
  isSaved?: boolean;
  isUserTab?: boolean;
  isCompact?: boolean;
  confirmSave?: (id: string) => Promise<void>;
}

const ExploreTab: FC<IProps> = ({
  tab,
  isSaved,
  isUserTab,
  isCompact,
  confirmSave,
}) => {
  const [isActionModal, setIsActionModal] = useState<boolean>(false);
  const tabImage = String((tab as any)?.image || (tab as any)?.logo || "").trim();

  return (
    <Wrapper>
      {tabImage ? (
        <TabImage
          src={imageLoader(tabImage)}
          alt={tab.name}
          $compact={Boolean(isCompact)}
        />
      ) : null}
      <TabBody>
        <div className="name">{tab.name}</div>
        {tab.description ? (
          <div className="description">{tab.description}</div>
        ) : (
          <></>
        )}
        <div className="bottom-info">
          <UserAvatar
            variant="default"
            avatar={
              tab.creator?.photo
                ? imageLoader(String(tab.creator.photo))
                : tab?.creator?.twitterData?.photo ||
                  tab?.creator?.discordData?.photo
            }
            name={tab.name}
            size="xxSmall"
          />
          <div className="username">
            {tab.creator?.username || tab.creator?.twitterData}
          </div>
          <svg
            className="dote"
            xmlns="http://www.w3.org/2000/svg"
            width="6"
            height="6"
            viewBox="0 0 6 6"
            fill="none"
          >
            <rect
              x="1.5"
              y="1.5"
              width="3"
              height="3"
              rx="1.5"
              fill="#738094"
            />
          </svg>
          <div className="date">
            {moment(String(tab.dateUpdate)).format("ll")}
          </div>
        </div>
      </TabBody>
      {isUserTab ? (
        <></>
      ) : (
        <ActionsButtons>
          <SaveButton
            value={tab.saved.length}
            onClick={() => confirmSave && confirmSave(tab?._id || "")}
            isActive={!!isSaved}
          />
        </ActionsButtons>
      )}
    </Wrapper>
  );
};

export default ExploreTab;
