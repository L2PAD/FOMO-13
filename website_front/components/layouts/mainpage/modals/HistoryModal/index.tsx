import React, { FC } from "react";
import moment from "moment";
import UserAvatar from "../../../../global/common/UserAvatar";
import {
  ChatWrapper,
  MessageDataWrapper,
  MessageWrapper,
  ModalWrapper,
} from "./styles";

interface Props {
  onClose: () => void;
}

const HistoryModal: FC<Props> = ({ onClose }) => {
  return (
    <ModalWrapper variant="medium" title="History" onClose={onClose}>
      <ChatWrapper>
        <MessageWrapper isUser>
          <UserAvatar
            size="small"
            avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
            name="name"
            variant="default"
            className="user-image"
          />
          <MessageDataWrapper>
            <div>
              <p>Your question: </p>
              <p>{moment().format("DD.MM.YYYY HH:mm")}</p>
            </div>
            <div>
              While valuations are being meaningfully reset and the bar for a
              significant Seed round being significantly higher than it was in
              2021 (some level of product-market fit is now table stakes), most
              crypto VCs remain both pat.
            </div>
          </MessageDataWrapper>
        </MessageWrapper>
        <MessageWrapper isUser={false}>
          <UserAvatar
            size="small"
            avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
            name="name"
            variant="default"
            className="user-image"
          />
          <MessageDataWrapper>
            <div>
              <p>Answer:</p>
            </div>
            <div>
              While valuations are being meaningfully reset and the bar for a
              significant Seed round being significantly higher than it was in
              2021 (some level of product-market fit is now table stakes), most
              crypto VCs remain both pat. While valuations are being
              meaningfully reset and the bar for a significant Seed round being
              significantly higher than it was in 2021 (some level of
              product-market fit is now table stakes), most crypto VCs remain
              both pat.While valuations are being meaningfully reset and the bar
              for a significant Seed round being significantly higher than it
              was in 2021 (some level of product-market fit is now table
              stakes), most crypto VCs remain both pat.While valuations are
              being meaningfully reset and the bar for a significant Seed round
              being significantly higher than it was in 2021 (some level of
              product-market fit is now table stakes), most crypto VCs remain
              both pat.While valuations are being meaningfully reset and the bar
              for a significant Seed round being significantly higher than it
              was in 2021 (some level of product-market fit is now table
              stakes), most crypto VCs remain both pat.
            </div>
          </MessageDataWrapper>
        </MessageWrapper>
        <MessageWrapper isUser={false}>
          <UserAvatar
            size="small"
            avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
            name="name"
            variant="default"
            className="user-image"
          />
          <MessageDataWrapper>
            <div>
              <p>Answer:</p>
            </div>
            <div>
              While valuations are being meaningfully reset and the bar for a
              significant Seed round being significantly higher than it was in
              2021 (some level of product-market fit is now table stakes), most
              crypto VCs remain both pat. While valuations are being
              meaningfully reset and the bar for a significant Seed round being
              significantly higher than it was in 2021 (some level of
              product-market fit is now table stakes), most crypto VCs remain
              both pat.While valuations are being meaningfully reset and the bar
              for a significant Seed round being significantly higher than it
              was in 2021 (some level of product-market fit is now table
              stakes), most crypto VCs remain both pat.While valuations are
              being meaningfully reset and the bar for a significant Seed round
              being significantly higher than it was in 2021 (some level of
              product-market fit is now table stakes), most crypto VCs remain
              both pat.While valuations are being meaningfully reset and the bar
              for a significant Seed round being significantly higher than it
              was in 2021 (some level of product-market fit is now table
              stakes), most crypto VCs remain both pat.
            </div>
          </MessageDataWrapper>
        </MessageWrapper>
      </ChatWrapper>
    </ModalWrapper>
  );
};

export default HistoryModal;
