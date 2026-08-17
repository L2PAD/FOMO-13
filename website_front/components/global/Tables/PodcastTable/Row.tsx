import React, { useState } from "react";
import moment from "moment/moment";
import UserAvatar from "../../common/UserAvatar";
import {
  FingerDownIcon,
  FingerTopIcon,
  PauseIcon,
  PlayIcon,
  StarIcon,
} from "../../Icons";
import RedFlag from "../../RedFlag";
import Typography from "../../common/Typography";
import PinIcon from "../../Icons/PinIcon";
import {
  ActionsWrapper,
  AudionWrapper,
  CardWrapper,
  ContentWrapper,
  DropdownWrapper,
  PinButton,
  PlayerAudio,
  RatingWrapper,
  ReactionButton,
  ThemeWrapper,
} from "./styles";

const Row = () => {
  const [isPlayed, setIsPlayed] = useState(false);

  return (
    <CardWrapper variant="default">
      <ContentWrapper isOpen={isPlayed}>
        <AudionWrapper>
          <button onClick={() => setIsPlayed((state) => !state)}>
            <UserAvatar
              size="small"
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              name="name"
              variant="default"
            />
            {isPlayed ? <PauseIcon fill="white" /> : <PlayIcon fill="white" />}
          </button>
          <div>
            <p>Day 31: Frogs, Gnats, and Flies (2023)</p>
            <span>{moment().format("DD.MM.YYYY HH:mm")}</span>
          </div>
        </AudionWrapper>
        <RatingWrapper>
          <p>Rating:</p>
          <div>
            <RedFlag count={14} />
            <div>
              <StarIcon fill="#FFC702" />
              <Typography variant="p">94/100</Typography>
            </div>
          </div>
        </RatingWrapper>
        <ThemeWrapper>
          <p>Themes</p>
          <div>Podcast themes; podcast theme</div>
        </ThemeWrapper>
        <ActionsWrapper>
          <ReactionButton active>
            <FingerTopIcon />
            2,5k
          </ReactionButton>
          <ReactionButton active={false}>
            <FingerDownIcon />
            148
          </ReactionButton>
          <PinButton>
            <PinIcon fill="#00C099" />
          </PinButton>
        </ActionsWrapper>
      </ContentWrapper>
      {isPlayed && (
        <DropdownWrapper>
          <PlayerAudio
            autoPlay
            src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
          />
          <p>
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
            sint. Velit officia consequat duis enim velit mollit. Exercitation
            veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
            ullamco est sit aliqua dolor do amet sint. Velit officia consequat
            duis enim velit mollit. Amet minim mollit non deserunt ullamco est
            sit aliqua dolor do amet sint.
          </p>
        </DropdownWrapper>
      )}
    </CardWrapper>
  );
};

export default Row;
