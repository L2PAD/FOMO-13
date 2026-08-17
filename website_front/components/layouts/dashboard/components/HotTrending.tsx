import React, { useState } from "react";
import { FlexContainer, DefaultCard, UserBlock } from "../styles";
import { LikeIcon, ShareIcon } from "../../../global/Icons";
import UserAvatar from "../../../global/common/UserAvatar";
import Typography from "../../../global/common/Typography";
import FireIcon from "../../../global/Icons/FireIcon";
import Checkbox from "../../../global/common/Checkbox";

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

export const HotTrending = () => {
  const [projects, setProjects] = useState(false);
  const [funds, setFunds] = useState(false);
  const [platforms, setPlatforms] = useState(false);

  return (
    <DefaultCard variant="default">
      <div className="header">
        <div>
          <ShareIcon />
          <b>Hot Trending</b>
        </div>
        <div>
          <Checkbox
            checked={projects}
            onChange={() => setProjects((prevState) => !prevState)}
            label="Projects"
          />
          <Checkbox
            checked={funds}
            onChange={() => setFunds((prevState) => !prevState)}
            label="Funds"
          />
          <Checkbox
            checked={platforms}
            onChange={() => setPlatforms((prevState) => !prevState)}
            label="Platforms"
          />
          <LikeIcon fill="#000" />
        </div>
      </div>
      <br />
      <FlexContainer>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(() => (
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
        ))}
      </FlexContainer>
    </DefaultCard>
  );
};
