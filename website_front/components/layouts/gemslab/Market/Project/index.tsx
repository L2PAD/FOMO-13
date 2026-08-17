import React, { FC, useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import moment from "moment";
import RatingCircle from "../../../../global/RatingCircle";
import { HeaderActionsWrapperMobile } from "../../../projects/Projects/Project/styles";
import Typography from "../../../../global/common/Typography";
import {
  CopyIcon,
  EditIcon,
  FacebookIcon,
  InstagramIcon,
  LikeIcon,
  LinkedinIcon,
  LinkIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import StatusTag from "../../../../global/StatusTag";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import ShareModal from "../../../../global/modals/ShareModal";
import { authState } from "../../../../../store/slices/authSlice";
import NFTs from "../NFTs";
import { AddFavAction } from "../../News/Parsing/styles";
import Filter from "../../../../global/Filter";
import { CryptoCurrencies } from "../../../../../staticContent/global";
import Pagination from "../../../../global/Pagintaion";
import MakeOrderIcon from "../../../../global/Icons/MakeOrderIcon";
import Link from "next/link";
import { ICollectionNft } from "../../../../../types/global_types";
import imageLoader from "../../../../../helpers/imageLoader";
import { AuthContext, LoadingContext } from "../../../../global/Layout";
import {
  FillterWrapper,
  HeaderActionsWrapper,
  HeaderCopyKey,
  HeaderDataText,
  HeaderDataTextWrapper,
  HeaderDescription,
  HeaderDescriptionItemsTitle,
  HeaderDescriptionItemsWrapper,
  HeaderEditButton,
  HeaderPersonDescription,
  HeaderPersonTitle,
  HeaderWrapper,
  LeftHeaderPersonInfoWrapper,
  LeftHeaderWrapper,
  NFTsWrapper,
  PageWrapper,
  PersonPriceWrapper,
  ProgressWrapper,
  ProjectDescriptionDataWrapper,
  ProjectDescriptionItem,
  RightHeaderHead,
  RightHeaderWrapper,
  HeaderPersonNameWrapper,
  RangeDescriptionWrapper,
  RangeTitle,
  RangeValue,
  RangeWrapper,
  RatingCircleWrapper,
  SelectItems,
} from "./styles";
import {
  getCollectionData,
  getNftIntervalPrice,
} from "../../../../../smart/initialSmartMarketplace";

const filters = [
  {
    type: "checkbox",
    items: ["Buy now", "Rarity ranking"],
  },
  {
    type: "range",
    title: "Rarity rank range",
    range: [0, 150],
    step: 1,
  },
  {
    type: "currencyRange",
    title: "Price range",
    range: [0, 150],
    step: 1,
    currencies: CryptoCurrencies,
  },
  {
    type: "select",
    title: "Marketplace",
    placeholder: "Choose marketplace",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  {
    type: "select",
    title: "Trait count",
    placeholder: "Choose trait count",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  {
    type: "select",
    title: "Background",
    placeholder: "Choose color",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  {
    type: "select",
    title: "Beak",
    placeholder: "Choose beak",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  {
    type: "select",
    title: "Body",
    placeholder: "Choose trait count",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  {
    type: "select",
    title: "Eyes",
    placeholder: "Choose eyes",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  {
    type: "select",
    title: "Eyewear",
    placeholder: "Choose eyewear",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
  {
    type: "select",
    title: "Feathers",
    placeholder: "Choose feathers",
    items: [
      {
        name: "Fund name1",
        value: "fund_name1",
      },
      {
        name: "Fund name2",
        value: "fund_name2",
      },
      {
        name: "Fund name3",
        value: "fund_name3",
      },
      {
        name: "Fund name4",
        value: "fund_name4",
      },
    ],
  },
];

const keyString = "0x70asdfhalsflasjdf34ggff02";

export interface IPriceData {
  minPrice: number;
  maxPrice: number;
  percent: number;
  marketCap: number;
  totalVolume: number;
  supply: number;
}

const Project: FC<{ nftData: ICollectionNft }> = ({ nftData }) => {
  const smart: string = nftData?.collection
    ? nftData?.collection?.smart
    : keyString;
  const { query } = useRouter();
  const { isAuth } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [currency, setCurrency] = useState<"ETH" | "USDC">(
    query.currency === "USDC" ? "USDC" : "ETH"
  );
  const [page, setPage] = useState(1);
  const [isShareModal, setIsShareModal] = useState(false);
  const [interval, setInterval] = useState<string>("7D");
  const [priceData, setPriceData] = useState<IPriceData>({
    minPrice: 0,
    maxPrice: 0,
    percent: 0,
    marketCap: 0,
    totalVolume: 0,
    supply: 0,
  });

  const copySmartContract = () => {
    navigator.clipboard.writeText(smart);
    toast.success("Smart contract was copied");
  };

  const getNftPriceData = async () => {
    loadingStateHandler(true);

    const { minPrice, maxPrice } = await getNftIntervalPrice(
      interval,
      2529.69,
      nftData.nftId
    );
    const data = await getCollectionData(
      nftData.collection?.smart || "",
      currency,
      2529.69,
      nftData.project
    );
    const price: number =
      currency === "ETH"
        ? Number(Number(nftData.price * 2529.69).toFixed(2))
        : nftData.price;

    const percent = ((price - minPrice) / minPrice) * 100;

    setPriceData({
      minPrice,
      maxPrice,
      percent: percent > 100 ? 100 : percent,
      marketCap: Number(data.marketCap),
      totalVolume: Number(data.totalVolume),
      supply: Number(data.supply),
    });

    loadingStateHandler(false);
  };

  useEffect(() => {
    getNftPriceData();
  }, [interval]);

  return (
    <PageWrapper>
      <HeaderWrapper>
        <LeftHeaderWrapper>
          <LeftHeaderPersonInfoWrapper>
            <UserAvatar
              avatar={nftData.external_url}
              variant="default"
              size="medium"
              name="SharkRace Club"
            />
            <div>
              <HeaderPersonNameWrapper>
                <HeaderPersonTitle variant="p">
                  {nftData.name}
                </HeaderPersonTitle>
                {/* <RatingCircleWrapper>
                  <RatingCircle rating={75} variant="success" />
                </RatingCircleWrapper> */}
              </HeaderPersonNameWrapper>
              <HeaderPersonDescription>
                <Typography variant="p">{nftData.description}</Typography>
                {/* <StatusTag variant="active" />
                <LinkIcon fill="#00C099" />
                <LinkedinIcon fill="#00C099" />
                <FacebookIcon fill="#00C099" />
                <InstagramIcon fill="#00C099" />
                <TwitterIcon fill="#00C099" /> */}
              </HeaderPersonDescription>
            </div>
            <HeaderActionsWrapperMobile>
              <button>
                <LikeIcon fill="#738094" />
              </button>
            </HeaderActionsWrapperMobile>
          </LeftHeaderPersonInfoWrapper>
          <PersonPriceWrapper>
            <div className="left">
              <RangeTitle variant="p">NFT price</RangeTitle>
              <h3>
                {nftData.price} {currency}
                <span> 0%</span>
              </h3>
            </div>
            <ProgressWrapper>
              <RangeTitle variant="p">
                Floor price range:
                <SelectItems onChange={(e: any) => setInterval(e.target.value)}>
                  <option>24H</option>
                  <option>7D</option>
                  <option>1M</option>
                  <option>3M</option>
                  <option>1Y</option>
                </SelectItems>
              </RangeTitle>
              <RangeWrapper>
                <RangeValue percentage={priceData.percent} />
              </RangeWrapper>
              <RangeDescriptionWrapper>
                <div>
                  Low: <b>${priceData.minPrice}</b>
                </div>
                <div>
                  High: <b>${priceData.maxPrice}</b>
                </div>
              </RangeDescriptionWrapper>
            </ProgressWrapper>
          </PersonPriceWrapper>
        </LeftHeaderWrapper>
        <RightHeaderWrapper>
          <RightHeaderHead>
            <div style={{ display: "flex", gap: 10 }}>
              {/* {isAuth && (
                <HeaderEditButton>
                  <EditIcon fill="#00C099" />
                </HeaderEditButton>
              )} */}
              <HeaderDataTextWrapper>
                <HeaderDataText variant="p">
                  ${clarifyAmount(Number(nftData?.project?.totalRaised) || 0)}
                  <span>Total Raised</span>
                </HeaderDataText>
                <HeaderDataText variant="p">
                  -<span>Ending</span>
                </HeaderDataText>
                <HeaderDataText variant="p">
                  Seed
                  <span>{nftData?.project?.type || "-"}</span>
                </HeaderDataText>
              </HeaderDataTextWrapper>
            </div>
            <div>
              <HeaderActionsWrapper>
                <button>
                  <LikeIcon fill="#738094" />
                </button>
              </HeaderActionsWrapper>
            </div>
          </RightHeaderHead>
          <div>
            <HeaderDescription variant="p">
              {nftData?.project?.bio || "-"}
            </HeaderDescription>
            <HeaderDescriptionItemsWrapper>
              <Link
                href={`/utility/market/order/${nftData._id}?currency=${currency}`}
              >
                <AddFavAction>
                  + Make order <MakeOrderIcon />
                </AddFavAction>
              </Link>
            </HeaderDescriptionItemsWrapper>
          </div>
        </RightHeaderWrapper>
      </HeaderWrapper>
      <ProjectDescriptionDataWrapper>
        <ProjectDescriptionItem variant="p">
          <span>Market Cap</span>${clarifyAmount(priceData.marketCap || 0)}
        </ProjectDescriptionItem>
        <ProjectDescriptionItem percentage={58.17} variant="p">
          <span>Supply</span>
          {priceData.supply || 0}
        </ProjectDescriptionItem>
        <ProjectDescriptionItem percentage={7.01} variant="p">
          <span>Listed</span>
          {nftData?.collection ? nftData.collection.nfts.length : "0"}
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Owners</span>0
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Total Volume</span>${clarifyAmount(priceData.totalVolume || 0)}
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Mint price</span>$
          {nftData?.collection ? nftData?.collection.mintPrice : "0"}
        </ProjectDescriptionItem>
        <ProjectDescriptionItem variant="p">
          <span>Royalty Fee</span>
          {nftData?.collection ? nftData?.collection?.royalty : "0"}%
        </ProjectDescriptionItem>
      </ProjectDescriptionDataWrapper>
      <FillterWrapper>
        <Filter filters={filters} />
        <div>
          <HeaderDescriptionItemsTitle variant="p">
            Smart contracts:
          </HeaderDescriptionItemsTitle>
          <HeaderCopyKey onClick={copySmartContract}>
            {smart.slice(0, 4)}...
            {smart.slice(smart.length - 8, smart.length)}
            <div>
              <CopyIcon fill="#738094" />
            </div>
          </HeaderCopyKey>
        </div>
      </FillterWrapper>
      <NFTsWrapper>
        <NFTs nfts={nftData.collection?.nfts || []} />
        {/* <Pagination
          page={page}
          total={20}
          limit={50}
          totalPage={20}
          onChange={(value) => setPage(value)}
        /> */}
      </NFTsWrapper>
      {isShareModal && (
        <ShareModal
          onClose={() => setIsShareModal(false)}
          link="/nfts/minting/share/123"
        />
      )}
    </PageWrapper>
  );
};

export default Project;
