import React, { useState } from "react";
import ResponsivePagination from "react-responsive-pagination";
import "react-responsive-pagination/themes/minimal.css";
import {
  CardIem,
  CardWrapper,
  ItemsWrapper,
  DataTitle,
  ProjectInfo,
  ProjectTitle,
  ProjectTitleWrapper,
  ProjectWrapper,
  Value,
} from "./styles";
import UserAvatar from "../../../../../global/common/UserAvatar";
import { PaginationWrapper } from "../../styles";
import Modal from "../../../../../global/common/Modal";
import Typography from "../../../../../global/common/Typography";
import { UsersScoreUserButton } from "../../../Persons/SocialPerson/styles";

export interface Item {
  avatar: string;
  name: string;
  description: string;
  value: string;
  variant: "default" | "green" | "red";
}

interface Props {
  title: string;
  items: Item[];
  style?: any;
}

const LiveMints = ({ title, items, style }: Props) => {
  const [open, setOpen] = useState(false);
  items = open ? [...items, ...items] : items;
  const content = items.map(
    ({ avatar, name, description, value, variant }, i: number) => (
      <CardIem key={i}>
        <ProjectWrapper>
          <UserAvatar
            size="small"
            variant="default"
            avatar={avatar}
            name={name}
          />
          <ProjectTitleWrapper>
            <ProjectTitle variant="p">{name}</ProjectTitle>
            <ProjectInfo variant="p">{description}</ProjectInfo>
          </ProjectTitleWrapper>
        </ProjectWrapper>
        <Value variant={variant}>{value}</Value>
      </CardIem>
    )
  );

  return (
    <>
      <CardWrapper variant="default">
        <DataTitle variant="p">{title}</DataTitle>
        <ItemsWrapper style={style}>{content}</ItemsWrapper>
        {!open && (
          <UsersScoreUserButton onClick={() => setOpen(true)}>
            See all &gt;
          </UsersScoreUserButton>
        )}
      </CardWrapper>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)}>
          <ItemsWrapper style={{ height: 500 }}>{content}</ItemsWrapper>
          <PaginationWrapper>
            <div>
              <ResponsivePagination
                current={1}
                total={10}
                onPageChange={() => {}}
              />
            </div>
            <Typography variant="p">{items.length} of 100</Typography>
          </PaginationWrapper>
        </Modal>
      )}
    </>
  );
};

export default LiveMints;
