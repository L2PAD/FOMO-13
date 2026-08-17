import React, { useEffect, useState } from "react";
import ResponsivePagination from "react-responsive-pagination";
import "react-responsive-pagination/themes/minimal.css";
import { useRouter } from "next/router";
import UserAvatar from "../../global/common/UserAvatar";
import Modal from "../../global/common/Modal";
import Typography from "../../global/common/Typography";
import { PaginationWrapper } from "../../global/Pagintaion/styles";
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
import { UsersScoreUserButton } from "../../layouts/projects/Persons/SocialPerson/styles";
import {
  PeriodButton,
  PeriodButtonsWrapper,
} from "../../layouts/projects/CryptoMarket/styles";

export interface Item {
  avatar: string;
  name: string;
  description: string;
  value: string;
  variant: "default" | "green" | "red";
  contractAddress: string;
  onClick: () => void;
}

interface Props {
  title: string;
  variant?: "TopMovers" | "BottomMovers" | "sales" | "folowers";
  style?: any;
}

const LIMIT = 20;

const periods = ["24h", "7D"];

const TopCard = ({ title, variant, style }: Props) => {
  const [activePeriod, setActivePeriod] = useState(periods[0]);
  const [open, setOpen] = useState(false);
  const [collections, setСollections] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage] = useState(50);
  const [total] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const data = new Array(20).fill("");

    const newCollections: any[] = data.map((_, i) => ({
      avatar:
        "https://cs13.pikabu.ru/post_img/big/2023/02/13/8/1676295806122712757.png",
      name: "NFT Project 1",
      description: "This is the first NFT project.",
      value:
        variant === "BottomMovers"
          ? "-17.84%"
          : variant === "sales"
            ? "$1.8M"
            : "+77.84%",
      variant:
        variant === "BottomMovers"
          ? "red"
          : variant === "sales"
            ? "default"
            : "green",
      contractAddress: "0xabc123def456",
      onClick: () => {
        router.push(`crypto/project/${i}`);
      },
    }));

    setСollections(newCollections);
  }, [page, router, variant]);

  const content = collections.map(
    ({
      avatar,
      name,
      description,
      value,
      variant,
      contractAddress,
      onClick,
    }) => (
      <CardIem key={contractAddress} onClick={onClick}>
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
        <DataTitle variant="p">
          {title}
          <PeriodButtonsWrapper>
            {periods.map((item, i) => {
              return (
                <PeriodButton
                  key={i}
                  active={activePeriod === item}
                  onClick={() => setActivePeriod(item)}
                >
                  {item}
                </PeriodButton>
              );
            })}
          </PeriodButtonsWrapper>
        </DataTitle>
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
                current={page}
                total={totalPage}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
            <Typography variant="p">
              {LIMIT} of {total || 0}
            </Typography>
          </PaginationWrapper>
        </Modal>
      )}
    </>
  );
};

export default TopCard;
