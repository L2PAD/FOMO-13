/* eslint-disable */
import React, { FC, useState } from "react";
import moment from "moment";
import Arrow from "../../../assets/icons/left-arrow.svg";
import UserAvatar from "../common/UserAvatar";
import {
  AccInfo,
  CardWrapper,
  DateWrapper,
  NewsHeaderWrapper,
  NewsText,
  Title,
  Wrapper,
} from "./styles";
import imageLoader from "../../../helpers/imageLoader";
import { IProject } from "../../../types/global_types";
import Image from "next/image";
import { ShowMoreButton } from "../common/CompareGrowChart/styles";

interface IProps {
  variant?: "default" | "card";
  project?:
    | IProject
    | {
        name: string;
        logo?: string;
        twitterAcc: string;
        metadataLogo?: string;
      };
  items?: Array<any>;
}

const News: FC<IProps> = ({ items, project, variant }) => {
  const [showsIds, setShowIds] = useState<Array<string>>([]);

  return (
    <Wrapper className={variant}>
      {items?.map((item, i) => {
        return (
          <CardWrapper
            tabIndex={0}
            className={variant}
            onClick={() =>
              window.open(
                `${project?.twitterAcc}/status/${
                  item?.retweetId ? item.retweetId : item.id
                }`,
                "_blank"
              )
            }
            key={i}
            variant={"main"}
          >
            <NewsHeaderWrapper>
              <UserAvatar
                size="otc"
                variant="default"
                avatar={
                  project?.logo
                    ? imageLoader(String(project?.logo))
                    : project?.metadataLogo
                }
                name={item.name}
              />
              <AccInfo>
                <div className="name">
                  <div>{project?.name || ""}</div>
                  <span>@{project?.twitterAcc?.split("/")?.pop() || ""}</span>
                </div>
                <div className="followers">Followers: 2K</div>
              </AccInfo>
            </NewsHeaderWrapper>

            <NewsText variant="p">{item.text}</NewsText>
            <div className="arrow">
              <Image src={Arrow} alt="arrow" />
            </div>
            <div className="show-more-wrapper">
              {item?.photos?.length > 0 && (
                <>
                  <ShowMoreButton
                    onClick={(e) => {
                      e.stopPropagation(); // чтобы не срабатывал onClick у карточки
                      if (showsIds.includes(item.id)) {
                        setShowIds(showsIds.filter((id) => id !== item.id));
                      } else {
                        setShowIds([...showsIds, item.id]);
                      }
                    }}
                  >
                    {showsIds.includes(item.id) ? "Hide image" : "Show image"}
                  </ShowMoreButton>

                  {showsIds.includes(item.id) && (
                    <img
                      className="twitter-photo"
                      src={item.photos[0]}
                      alt={project?.name}
                    />
                  )}
                </>
              )}
            </div>
          </CardWrapper>
        );
      })}
    </Wrapper>
  );
};

export default News;
