/* eslint-disable */
import React, { useState } from "react";
import {
  DefaultCard,
  DropdownWrapper,
  ProjectsGrid,
  ProjectsWrapper,
} from "../styles";
import { ArrowDownIcon, LikeIcon, ShareIcon } from "../../../global/Icons";
import UserAvatar from "../../../global/common/UserAvatar";

interface Props {
  header: string;
}

const options = ["24H", "7D", "1M", "3M", "1Y", "All Time"];

const baseCollections = [
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "error",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "error",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "warn",
  },
  {
    userAvatar:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU",
    userName: "name",
    userRating: 94,
    userStatus: "success",
  },
];

const conllections = [
  ...baseCollections,
  ...baseCollections,
  ...baseCollections,
  ...baseCollections,
  ...baseCollections,
  ...baseCollections,
  ...baseCollections,
];

export const Projects = ({ header }: Props) => {
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [active, setActive] = useState("All Time");

  return (
    <DefaultCard variant="default">
      <div className="header">
        <div>
          <ShareIcon />
          <b>{header}</b>
        </div>
        <div>
          <LikeIcon fill="#000" />
          <DropdownWrapper active={activeDropdown}>
            <div>
              <div
                className="button"
                onClick={() => setActiveDropdown((state) => !state)}
              >
                <ArrowDownIcon /> {active}
              </div>
              {activeDropdown && (
                <ul>
                  {options.map((option) => (
                    <li
                      onClick={() => setActive(option)}
                      className={active === option ? "active" : ""}
                    >
                      {option}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </DropdownWrapper>
        </div>
      </div>
      <br />
      <ProjectsWrapper>
        <ProjectsGrid>
          {conllections.map((collection) => (
            <UserAvatar
              size="medium"
              variant={collection.userStatus as "success" | "error" | "warn"}
              avatar={collection.userAvatar}
              name={collection.userName}
              rating={collection.userRating}
            />
          ))}
        </ProjectsGrid>
        <div className="markers">
          <h1>50x</h1>
          <h1>25x</h1>
          <h1>5x</h1>
          <h1>0x</h1>
          <h1>-5x</h1>
          <h1>-25x</h1>
          <h1>-50x</h1>
        </div>
      </ProjectsWrapper>
    </DefaultCard>
  );
};
