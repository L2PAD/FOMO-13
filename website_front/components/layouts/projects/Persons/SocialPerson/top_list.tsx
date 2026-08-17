import React, { FC } from "react";
import UserAvatar from "../../../../global/common/UserAvatar";
import { ArrowDownIcon } from "../../../../global/Icons";
import BaseCard from "../../../../global/common/BaseCard";
import {
  UsersListWrapper,
  UsersScoreTitle,
  UsersScoreUserButton,
  UsersScoreUserWrapper,
} from "./styles";

interface Props {
  title: string;
  onClick: () => void;
  delta?: number;
  totalAmount: number;
  data: { name: string; amount?: string; avatar: string; desc: string }[];
}

const TopList: FC<Props> = ({
  title,
  data,
  onClick,
  totalAmount,
  delta = 0,
}) => {
  return (
    <BaseCard variant="default">
      <UsersScoreTitle delta={delta}>
        <p>{title}</p>
        <p>
          {totalAmount}{" "}
          {delta !== 0 && (
            <span>
              <ArrowDownIcon fill="#00C099" /> {delta}
            </span>
          )}
        </p>
      </UsersScoreTitle>
      <UsersListWrapper>
        {data.map((item, i) => {
          if (i < 10) {
            return (
              <UsersScoreUserWrapper key={i}>
                <div>
                  <UserAvatar
                    size="small"
                    variant="default"
                    avatar={item.avatar}
                    name={item.name}
                  />
                  <div>
                    <p>{item.name}</p>
                    <span>{item.desc}</span>
                  </div>
                </div>
                <div>{item.amount}</div>
              </UsersScoreUserWrapper>
            );
          }
          return null;
        })}
      </UsersListWrapper>
      <UsersScoreUserButton onClick={onClick}>
        See all &gt;
      </UsersScoreUserButton>
    </BaseCard>
  );
};

export default TopList;
