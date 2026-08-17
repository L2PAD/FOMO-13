import React from "react";
import { FlexContainer, DefaultCard, UserBlock } from "../styles";
import { LikeIcon, ShareIcon } from "../../../global/Icons";
import UserAvatar from "../../../global/common/UserAvatar";
import Typography from "../../../global/common/Typography";
import FireIcon from "../../../global/Icons/FireIcon";

interface Props {
  header: string;
}

const collection = {
  userAvatar:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
  userName: "name",
  userRating: 94,
  userStatus: "warn",
  name: "SharkRace",
  desc: "NFT & Collectibles",
  price: "$111.8M",
};

export const Crypto = ({ header }: Props) => {
  return (
    <DefaultCard variant="default">
      <div className="header">
        <div>
          <ShareIcon />
          <b>{header}</b>
        </div>
        <div>
          <LikeIcon fill="#000" />
          <div className="circle" />
        </div>
      </div>
      <br />
      <FlexContainer>
        <UserBlock>
          <UserAvatar
            size="medium"
            variant="warn"
            avatar={collection.userAvatar}
            name={collection.userName}
            rating={collection.userRating}
          />
          <Typography variant="h2">{collection.name}</Typography>
          <p>{collection.desc}</p>
          <b>
            <FireIcon /> {collection.price}
          </b>
        </UserBlock>
        <UserBlock>
          <UserAvatar
            size="medium"
            variant="warn"
            avatar={collection.userAvatar}
            name={collection.userName}
            rating={collection.userRating}
          />
          <Typography variant="h2">{collection.name}</Typography>
          <p>{collection.desc}</p>
          <b>
            <FireIcon /> {collection.price}
          </b>
        </UserBlock>
        <UserBlock>
          <UserAvatar
            size="medium"
            variant="warn"
            avatar={collection.userAvatar}
            name={collection.userName}
            rating={collection.userRating}
          />
          <Typography variant="h2">{collection.name}</Typography>
          <p>{collection.desc}</p>
          <b>
            <FireIcon /> {collection.price}
          </b>
        </UserBlock>
      </FlexContainer>
    </DefaultCard>
  );
};
