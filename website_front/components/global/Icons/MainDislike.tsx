import React, { FC } from "react";
import Image from "next/image";
import styled from "styled-components";
import dislikeDefault from "../../../assets/icons/otc/dislike-default.svg";
import dislikeActive from "../../../assets/icons/otc/dislike-active.svg";

interface IProps {
  isActive?: boolean;
  likesCount?: number;
  onClick?: () => void;
}

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #738094;
`;

const MainDislike: FC<IProps> = ({ isActive, likesCount, onClick }) => {
  return (
    <Button onClick={onClick}>
      <Image src={isActive ? dislikeActive : dislikeDefault} alt="dislike" />
      <span>{likesCount || 0}</span>
    </Button>
  );
};

export default MainDislike;
