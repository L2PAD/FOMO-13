import React, { useState } from "react";
import Image from "next/image";
import { toast } from "react-toastify";
import nft from "../../../../../public/static/nft_card.png";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import UserAvatar from "../../../../global/common/UserAvatar";
import Typography from "../../../../global/common/Typography";
import MyCartModal from "../../../nfts/modals/MyCartModal";
import TabsInfo from "./TabsInfo";
import {
  ActionsUser,
  ActionsUserTitle,
  ActionsUserWrapper,
  ActionsWrapper,
  AuthorWrapper,
  ButtonsWrapper,
  BuyButton,
  ConfirmOrderWrapper,
  ContentWrapper,
  DataDescription,
  ImageWrapper,
  NFTDataWrapper,
  NFTName,
  NFTNameWrapper,
  NFTTag,
  OrderButton,
  PageWrapper,
} from "./styles";

const items = [
  { title: "Projects", link: "/gemslab/projects" },
  { title: "SharkRace Club", link: "/gemslab/project/234" },
  { title: "SharkRace Club NFT", link: "/gemslab/card/234" },
];

const Project = () => {
  const [showAll, setShowAll] = useState(false);
  const [cartModal, setCartModal] = useState(false);
  const [isOrder, setIsOrder] = useState(false);

  const confirmOrder = () => {
    toast.success("Order confirmed");
  };

  return (
    <PageWrapper>
      <BreadCrumbs items={items} />
      <ContentWrapper>
        <ImageWrapper>
          <Image width={100} height={100} src={nft.src} alt="SharkRace Club" />
        </ImageWrapper>
        <NFTDataWrapper>
          <div>
            <AuthorWrapper>
              <UserAvatar
                avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                name="name"
                size="xSmall"
                variant="default"
              />
              <Typography variant="p">John Doe</Typography>
            </AuthorWrapper>
            <NFTNameWrapper>
              <NFTName variant="h1">SharkRace Club</NFTName>
              <NFTTag>#7003</NFTTag>
            </NFTNameWrapper>
            <div>
              <DataDescription>
                Amet minim mollit non deserunt ullamco est sit aliqua dolor do
                amet sint. Velit officia consequat duis enim velit mollit.{" "}
                <span onClick={() => setShowAll((state) => !state)}>
                  {showAll ? "Hide all" : "Show more"}
                </span>
              </DataDescription>
            </div>
            <ActionsWrapper>
              <ActionsUserWrapper>
                <ActionsUser
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="small"
                  variant="default"
                />
                <ActionsUserTitle variant="p">
                  Listed on <i>x2y2</i> for
                  <br />
                  <span>1.004 ETH</span>
                </ActionsUserTitle>
              </ActionsUserWrapper>
              <ButtonsWrapper>
                <BuyButton variant="primary" onClick={() => setCartModal(true)}>
                  Buy
                </BuyButton>
                {!isOrder ? (
                  <OrderButton onClick={() => setIsOrder(true)}>
                    + Make order
                  </OrderButton>
                ) : (
                  <ConfirmOrderWrapper onClick={confirmOrder}>
                    <input type="text" placeholder="0" />
                    <button>Confirm</button>
                  </ConfirmOrderWrapper>
                )}
              </ButtonsWrapper>
            </ActionsWrapper>
          </div>
          <TabsInfo />
        </NFTDataWrapper>
      </ContentWrapper>
      {cartModal && <MyCartModal onClose={() => setCartModal(false)} />}
    </PageWrapper>
  );
};

export default Project;
