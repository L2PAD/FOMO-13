import React, { FC } from "react";
import { toast } from "react-toastify";
import Modal from "../../../../global/common/Modal";
import { ItemWrapper, SubmitButton, TextWrapper } from "./styles";
import UserAvatar from "../../../../global/common/UserAvatar";

interface Props {
  onClose: () => void;
}

const ApproveCollectionModal: FC<Props> = ({ onClose }) => {
  return (
    <Modal onClose={onClose} title="Approve listing">
      <ItemWrapper>
        <UserAvatar
          avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
          variant="default"
          size="small"
          name="SharkRace Club"
        />
        <div>
          <b>Secret NFT Key #2</b>
          <p>No name key</p>
        </div>
      </ItemWrapper>
      <TextWrapper>
        Go to your wallet You&#39;ll be asked to approve this collection from
        your wallet. You only need to approve each collection once.
      </TextWrapper>
      <SubmitButton
        onClick={() => {
          toast.success(
            <div>
              <h3>Souccess!</h3>
              <p>You have successfully placed a listing NFTs</p>
            </div>
          );
          onClose();
        }}
      >
        Continue
      </SubmitButton>
    </Modal>
  );
};

export default ApproveCollectionModal;
