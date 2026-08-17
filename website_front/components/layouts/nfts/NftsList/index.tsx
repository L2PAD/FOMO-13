import React from "react";
import { List, Wrapper } from "./styles";
import NftItem from "../Nft";

const list = [
  {
    id: 2643,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Epic",
    views: 234,
    logo: "/4c4424dc4878731e376f0422aefe43f9.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
  {
    id: 132,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Legendary",
    views: 1200,
    logo: "/4c4424dc4878731e376f0422aefe43f9.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
  {
    id: 34,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Mythic",
    views: 2200,
    logo: "/4c4424dc4878731e376f0422aefe43f9.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
  {
    id: 4600,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Rare",
    views: 456,
    logo: "/4c4424dc4878731e376f0422aefe43f9.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
  {
    id: 1904,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Epic",
    views: 14,
    logo: "/4c4424dc4878731e376f0422aefe43f9.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
  {
    id: 12,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Legendary",
    views: 2100,
    logo: "/4c4424dc4878731e376f0422aefe43f9.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
];

const trendingList = [
  {
    id: 2643,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Epic",
    views: 234,
    logo: "/119a71737a410855fdb083bcf154d290.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
  {
    id: 132,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Legendary",
    views: 1200,
    logo: "/119a71737a410855fdb083bcf154d290.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
  {
    id: 34,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Mythic",
    views: 2200,
    logo: "/119a71737a410855fdb083bcf154d290.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
  {
    id: 4600,
    name: "SharkRace Club",
    niche: "NFT & Collectibles",
    isFavorite: true,
    type: "Rare",
    views: 456,
    logo: "/119a71737a410855fdb083bcf154d290.png",
    projectLogo: "/77711.95742840278_img1.jpg",
    ethPrice: 1.004,
    usdPrice: 2760.67,
  },
];

const NftsList = () => {
  return (
    <Wrapper>
      <List>
        {list.map((item) => {
          return <NftItem key={item.id} nft={item} />;
        })}
      </List>
      <h2 className="title">Trending NFTs</h2>
      <List>
        {trendingList.map((item) => {
          return <NftItem key={item.id} nft={item} />;
        })}
      </List>
    </Wrapper>
  );
};

export default NftsList;
