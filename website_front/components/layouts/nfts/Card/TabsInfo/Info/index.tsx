import React from "react";
import UserAvatar from "../../../../../global/common/UserAvatar";
import { InfoItem, PersonWrapper, Title, Wrapper } from "./styles";

const key = "0x5f465df4f6askdjgfkajhlsdflgahk43pqt165df";

const Info = () => {
  return (
    <Wrapper variant="default">
      <Title variant="p">Creator</Title>
      <PersonWrapper>
        <UserAvatar
          avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
          name="name"
          variant="default"
          size="xSmall"
        />
        John Doe
      </PersonWrapper>
      <div>
        <InfoItem variant="p">
          Contact address
          <span>
            {key.slice(0, 12)}...{key.slice(key.length - 5, key.length)}
          </span>
        </InfoItem>
        <InfoItem variant="p">
          Token ID
          <span>54989</span>
        </InfoItem>
        <InfoItem variant="p">
          Token standart
          <span>ERC721</span>
        </InfoItem>
        <InfoItem variant="p">
          Blockchain
          <span>Ethereum</span>
        </InfoItem>
      </div>
    </Wrapper>
  );
};

export default Info;
