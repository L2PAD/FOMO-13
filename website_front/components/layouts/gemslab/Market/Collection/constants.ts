import mock2 from "../../../../../assets/images/nft/shark.png";
import mock3 from "../../../../../assets/images/nft/starter.png";
import mock4 from "../../../../../assets/images/nft/shark2.png";
import mock6 from "../../../../../assets/images/nft/cloud.png";
import mock7 from "../../../../../assets/images/nft/skull.png";

export interface MockedNftItem {
  _id: string;
  name: string;
  floorPrice: string;
  hiddenRarity: boolean;
  chain: string;
  rarity: string;
  price: string;
  image: any;
}

export const mockedNft: MockedNftItem[] = [
  {
    _id: "2643",
    name: "NFT Name",
    floorPrice: "$100",
    hiddenRarity: false,
    chain: "Solana",
    rarity: "Epic",
    price: "0.05",
    image: mock3,
  },
  {
    _id: "2644",
    name: "NFT Name 2",
    floorPrice: "$200",
    hiddenRarity: true,
    chain: "Ethereum",
    rarity: "Legendary",
    price: "0.1",
    image: mock4,
  },
  {
    _id: "2645",
    name: "NFT Name 3",
    floorPrice: "$300",
    hiddenRarity: false,
    chain: "Polygon",
    rarity: "Rare",
    price: "0.15",
    image: mock2,
  },
  {
    _id: "2646",
    name: "NFT Name 4",
    floorPrice: "$400",
    hiddenRarity: true,
    chain: "Solana",
    rarity: "Epic",
    price: "0.2",
    image: mock7,
  },
  {
    _id: "2647",
    name: "NFT Name 5",
    floorPrice: "$500",
    hiddenRarity: false,
    chain: "Ethereum",
    rarity: "Legendary",
    price: "0.25",
    image: mock6,
  },
];

export const collectionTabs = ["All", "fav", "Trending", "New (7d)"];
