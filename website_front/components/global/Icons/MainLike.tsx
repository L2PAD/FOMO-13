import React, { FC } from "react";
import Image from "next/image";
import styled from "styled-components";
import likeDefault from "../../../assets/icons/otc/like-default.svg";
import likeActive from "../../../assets/icons/otc/like-active.svg";

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

const MainLike: FC<IProps> = ({ isActive, likesCount, onClick }) => {
  return (
    <Button onClick={onClick}>
      <Image src={isActive ? likeActive : likeDefault} alt="like" />
      <span>{likesCount || 0}</span>
    </Button>
  );
};

export default MainLike;
