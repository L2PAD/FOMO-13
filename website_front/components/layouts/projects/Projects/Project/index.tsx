import React, { useEffect, useState } from "react";
import {
  GraphicItemData,
  HeaderPersonDescription,
  HeaderPersonTitle,
  HeaderWrapper,
  PageWrapper,
  ProjectDataWrapper,
  ProjectDataItem,
  ProjectData,
  CardsWrapper,
  ChardWrapper,
  TwoCards,
  Separator,
} from "./styles";
import { useRouter } from "next/router";
import Link from "next/link";
import DataCard from "./DataCard";
import NFTS from "./NFTS";
import LiveMints, { Item } from "./LiveMints";
import {
  DiscordIcon,
  FacebookIcon,
  InstagramIcon,
  LinkIcon,
  LinkedinIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import CandlestickChart from "./CandlestickChart";
import NFTGraphic from "./NFTGraphic";
import StackGlass from "./StackGlass";
import FormCard from "./FormCard";
import PictureIcon from "../../../../global/Icons/PictureIcon";
import { GradientButton } from "../../../gemslab/Profile/styles";
import ListNFTsModal from "../../../../global/modals/ListNFTsModal";

const dataitems = [
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: -18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
  { name: "BREED", floor: 1.8, change: 18, vol: 184 },
];

const mints: Item[] = [
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
  {
    avatar:
      "https://yt3.googleusercontent.com/-CFTJHU7fEWb7BYEb6Jh9gm1EpetvVGQqtof0Rbh-VQRIznYYKJxCaqv_9HeBcmJmIsp2vOO9JU=s900-c-k-c0x00ffffff-no-rj",
    name: "SharkRace Club",
    description: "0.546 | 37 gwei",
    value: "✓ Mint",
    variant: "green",
  },
];

const bottom = [
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6740 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6741 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6742 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6743 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6744 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6745 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6740 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6741 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6742 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6743 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6744 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6745 },
];

const top = [
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6740 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6741 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6742 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6743 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6744 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6745 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6740 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6741 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6742 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6743 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6744 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6745 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6740 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6741 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6742 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6743 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6744 },
  { floor: "6,71", amount: 3, total: "15,6", rarity: 6745 },
];

const details = {
  id: "1",
  contract_address: "0x0000000000000000000000000000000000000001",
  asset_platform_id: "ethereum",
  name: "Token1",
  symbol: "TKN1",
  image: {
    small: "https://example.com/tkn1.png",
  },
  description: "This is Token1 description.",
  native_currency: "ETH",
  native_currency_symbol: "Ξ",
  floor_price: {
    native_currency: 0.001,
    usd: 3.5,
  },
  market_cap: {
    native_currency: 10000,
    usd: 350000,
  },
  volume_24h: {
    native_currency: 500,
    usd: 17500,
  },
  floor_price_in_usd_24h_percentage_change: 2.5,
  floor_price_24h_percentage_change: {
    usd: 0.1,
    native_currency: 0.03,
  },
  market_cap_24h_percentage_change: {
    usd: -1.2,
    native_currency: -0.5,
  },
  volume_24h_percentage_change: {
    usd: 3.2,
    native_currency: 0.8,
  },
  number_of_unique_addresses: 1000,
  number_of_unique_addresses_24h_percentage_change: 1.5,
  volume_in_usd_24h_percentage_change: 1.7,
  total_supply: 1000000,
  links: {
    homepage: "https://token1.com",
    twitter: "https://twitter.com/token1",
    discord: "https://discord.gg/token1",
  },
  floor_price_7d_percentage_change: {
    usd: 4.8,
    native_currency: 1.2,
  },
  floor_price_14d_percentage_change: {
    usd: 6.2,
    native_currency: 1.8,
  },
  floor_price_30d_percentage_change: {
    usd: 9.3,
    native_currency: 2.5,
  },
  floor_price_60d_percentage_change: {
    usd: 14.7,
    native_currency: 3.8,
  },
  floor_price_1y_percentage_change: {
    usd: 25.5,
    native_currency: 7.2,
  },
  explorers: [
    {
      name: "Etherscan",
      link: "https://etherscan.io/token/0x0000000000000000000000000000000000000001",
    },
    {
      name: "BscScan",
      link: "https://bscscan.com/token/0x0000000000000000000000000000000000000001",
    },
  ],
};

const Project = () => {
  const [collection, setСollection] = useState<any>();
  const [modal, setMoal] = useState(false);
  const router = useRouter();
  const { id } = router.query;

  const items = [
    { title: "Crypto", link: "crypto" },
    { title: collection?.name || "", link: `/project/${collection?.id}` },
  ];

  useEffect(() => {
    (async () => {
      if (id) {
        setСollection(details);
      }
    })();
  }, [id]);

  // eslint-disable-next-line
  if (!collection) return <></>;

  return (
    <PageWrapper>
      <BreadCrumbs items={items} />
      <HeaderWrapper>
        <div>
          <HeaderPersonTitle variant="p">
            <p>{collection?.name || ""}</p>
            <b>75.789</b>
            <span>
              <GraphicItemData variant="green">
                +
                {collection.floor_price_in_usd_24h_percentage_change.toFixed(2)}
                %
              </GraphicItemData>
            </span>
          </HeaderPersonTitle>
          <b>0xf5gd....75h0</b>
          <HeaderPersonDescription>
            {collection.links.homepage && (
              <Link href={collection.links.homepage}>
                <LinkIcon fill="#00C099" />
              </Link>
            )}
            {collection.website && (
              <Link href={collection.website}>
                <LinkedinIcon fill="#00C099" />
              </Link>
            )}
            {collection.website && (
              <Link href={collection.website}>
                <FacebookIcon fill="#00C099" />
              </Link>
            )}
            <InstagramIcon fill="#00C099" />
            {collection.links.discord && (
              <Link href={collection.links.discord}>
                <DiscordIcon fill="#00C099" />
              </Link>
            )}
            {collection.links.twitter && (
              <Link href={collection.links.twitter}>
                <TwitterIcon fill="#00C099" />
              </Link>
            )}
          </HeaderPersonDescription>
        </div>
        <GradientButton onClick={() => setMoal(true)}>
          +List NFTs <PictureIcon />
        </GradientButton>
      </HeaderWrapper>
      <ProjectData>
        <ProjectDataWrapper>
          <ProjectDataItem variant="p">
            <span>Created:</span>--
          </ProjectDataItem>
          <ProjectDataItem variant="p">
            <span>Royalty Fee:</span>--
          </ProjectDataItem>
          <ProjectDataItem variant="p">
            <span>Project Revenue:</span>--
          </ProjectDataItem>
          <ProjectDataItem variant="p">
            <span>Mint Price:</span>--
          </ProjectDataItem>
          <ProjectDataItem variant="p">
            <span>Total Supply:</span>
            {collection.total_supply}
          </ProjectDataItem>
        </ProjectDataWrapper>
        <ProjectDataWrapper>
          <ProjectDataItem variant="p">
            <span>Holders:</span>--
          </ProjectDataItem>
          <ProjectDataItem variant="p">
            <span>Holders to Supply:</span>--
          </ProjectDataItem>
          <ProjectDataItem variant="p">
            <span># Listed:</span>--
          </ProjectDataItem>
          <ProjectDataItem variant="p">
            <span>% Supply Listed:</span>--
          </ProjectDataItem>
          <br />
        </ProjectDataWrapper>
        <DataCard collection={collection} />
      </ProjectData>
      <ChardWrapper>
        <div>
          <CandlestickChart />
        </div>
        <div>
          <NFTGraphic items={dataitems} />
        </div>
      </ChardWrapper>
      <CardsWrapper>
        <StackGlass
          title="Stock glass"
          bottom={bottom}
          top={top}
          separator={{ value: "23,627.50", price: 23.054, variant: "red" }}
        />
        <TwoCards variant="default">
          <FormCard title="Buying" variant="Buy" />
          <Separator />
          <FormCard title="Selling" variant="Sell" />
        </TwoCards>
        <LiveMints title="Live Mints" items={mints} style={{ height: 290 }} />
      </CardsWrapper>
      <NFTS />
      {modal && <ListNFTsModal onClose={() => setMoal(false)} />}
    </PageWrapper>
  );
};

export default Project;
