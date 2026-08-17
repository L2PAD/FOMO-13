import React, { FC, useState } from "react";
import Modal from "../../../../global/common/Modal";
import UserAvatar from "../../../../global/common/UserAvatar";
import RedFlag from "../../../../global/RedFlag";
import { RatingWrapper } from "../../OTC/TopMembers/styles";
import { MessageWrapper } from "../CreateDealModal/styles";
import { IUser } from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";
import sliceAddress from "../../../../../helpers/sliceAddress";
import sendMessage from "../../../../../http/messages/sendMessage";
import { StarIcon } from "../../../../global/Icons";
import {
  ContentWrapper,
  InfoWrapper,
  RatingFlagsWrapper,
  UserAvatarWrapper,
  UserWrapper,
} from "./styles";
import { toast } from "react-toastify";
import { icons } from "../../../../global/common/SocialLinks";
import { Buttons } from "../../../../global/Filter/otc-styles";
import { Button } from "../../../../global/common/Button";
import MainModal from "../../../../global/common/MainModal";

interface Props {
  onClose: () => void;
  isVisible?: boolean
  userData?: IUser | null;
  title: string;
}

const ContactWithPerson: FC<Props> = ({ onClose, isVisible, userData, title }) => {
  const [message, setMessage] = useState<string>("");

  const confirmSendClink = async () => {
    const { success } = await sendMessage({
      message,
      date: new Date(),
      title: "OTC Market",
      to: userData?._id || "",
    });

    if (success) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>Message sent!</p>
        </div>
      );
      onClose();
    }
  };

  return (
    <MainModal
      isVisible={!!isVisible}
      onClose={onClose} title={title}>
      <ContentWrapper>
        <UserWrapper>
          <UserAvatarWrapper>
            <UserAvatar
              size="big"
              avatar={
                userData?.photo
                  ? imageLoader(String(userData.photo))
                  : userData?.twitterData?.photo || ""
              }
              name={userData?.username || ""}
              variant="default"
            />
            <b>{userData?.username || userData?.twitterData?.username}</b>
            <span>{sliceAddress(userData?.wallet)}</span>
          </UserAvatarWrapper>
          <InfoWrapper>
            <div className="">
              <RatingWrapper>
                <StarIcon fill="#FFC702" />
                <b>{userData?.rating || 0}/100</b>
              </RatingWrapper>
              <RatingFlagsWrapper>
                <RedFlag count={userData?.redFlags || 0} />
              </RatingFlagsWrapper>
            </div>
            <div className="">
              <a
                href={`https://t.me/${userData?.telegramData?.username}`}
                target="_blank"
                rel="noreferrer"
              >
                {icons.tg}
              </a>
              <a
                href={`https://discord.com/users/${userData?.discordData?.id}`}
                target="_blank"
                rel="noreferrer"
              >
                {icons.ds}
              </a>
              <a
                href={`https://x.com/${userData?.twitterData?.username}`}
                target="_blank"
                rel="noreferrer"
              >
                {icons.x}
              </a>
            </div>
          </InfoWrapper>
        </UserWrapper>
        <MessageWrapper>
          <p>Your Message</p>
          <textarea
            value={message}
            onChange={(e: any) => setMessage(e.target.value)}
            placeholder="Type your message..."
          />
        </MessageWrapper>
        <Buttons onClick={confirmSendClink} className="buttons">
          <Button variant="secondary" className="red-btn" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={confirmSendClink}>
            Send
          </Button>
        </Buttons>
      </ContentWrapper>
    </MainModal>
  );
};

export default ContactWithPerson;
