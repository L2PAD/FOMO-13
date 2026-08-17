import React, { useState } from "react";
import ResponsivePagination from "react-responsive-pagination";
import "react-responsive-pagination/themes/minimal.css";
import {
  ButtonWraper,
  GraphicHeader,
  GraphicItem,
  GraphicItemData,
  GraphicItems,
  GraphicWrapper,
  HeaderItem,
  ModalWrapper,
  Wrapper,
} from "../styles";
import { ActionButton } from "../../../Persons/Person/styles";
import Tabs from "../../../../../global/Tabs";
import { LikeIcon } from "../../../../../global/Icons";
import Modal from "../../../../../global/common/Modal";
import { UsersScoreUserButton } from "../../../Persons/SocialPerson/styles";

interface Item {
  name: string;
  floor: number;
  change: number;
  vol: number;
}

interface Props {
  items: Item[];
}

const NFTGraphic = ({ items }: Props) => {
  const [activeTab, setActiveTab] = useState("Watchlist");
  const [open, setOpen] = useState(false);

  const content = (
    <>
      <ModalWrapper>
        <Tabs
          items={["Watchlist", "Market"]}
          activeItem={activeTab}
          onClick={setActiveTab}
        />
      </ModalWrapper>
      <Wrapper>
        <GraphicHeader>
          <HeaderItem>Name</HeaderItem>
          <HeaderItem>Floor</HeaderItem>
          <HeaderItem>24h</HeaderItem>
          <HeaderItem>Vol</HeaderItem>
        </GraphicHeader>
        <GraphicItems>
          {items.map((item) => (
            <GraphicItem key={item.name}>
              <GraphicItemData variant="bold">{item.name}</GraphicItemData>
              <GraphicItemData variant="bold">{item.floor}</GraphicItemData>
              <GraphicItemData variant={item.change < 0 ? "red" : "green"}>
                {item.change} %
              </GraphicItemData>
              <GraphicItemData variant="default">
                {item.vol} D
                <ActionButton>
                  <LikeIcon fill="#738094" />
                </ActionButton>
              </GraphicItemData>
            </GraphicItem>
          ))}
        </GraphicItems>
        {!open && (
          <ButtonWraper>
            <UsersScoreUserButton onClick={() => setOpen(true)}>
              See all &gt;
            </UsersScoreUserButton>
          </ButtonWraper>
        )}
      </Wrapper>
    </>
  );
  return (
    <>
      <GraphicWrapper variant="default">{content}</GraphicWrapper>
      {open && (
        <Modal title="" onClose={() => setOpen(false)}>
          {content}
          <ResponsivePagination
            current={1}
            total={10}
            onPageChange={() => {}}
          />
        </Modal>
      )}
    </>
  );
};

export default NFTGraphic;
