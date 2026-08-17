import React, { useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import Image from "next/image";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import { PageTitle, Wrapper } from "../nfts/Projects/Project/NFTs/styles";
import fetchProjects from "../../../http/projects/fetchProjects";
import nft from "../../../public/static/nft_card.png";
import useProjectState from "../../../smart/hooks/useProjectState";
import ClaimCard from "./stakeCards/RewardCard";
import RewardCard from "../../global/RewardCard";
import ProjectTable from "../../global/Tables/RewardsTable";
import Pagination from "../../global/Pagintaion";
import StakeModal from "./modals/StakeModal";
import UnStakeModal from "./modals/UnstakeModal";
import CrossModal from "./modals/CrossModal";
import Typography from "../../global/common/Typography";
import { PageDescription } from "../gemslab/News/styles";
import { Subtitle } from "../projects/FomoChat/styles";
import { SearchInput, SearchWrapper } from "../mainpage/styles";
import {
  PageDescriptionWrapper,
  SearchIconStyle,
} from "../projects/Networks/styles";
import { SpaceportTabs } from "../../../staticContent/tabs";
import StakeCard from "./stakeCards/StakeCard";
import Tabs from "../../global/Tabs";
import StakingTable from "./stakingTable/StakingTable";
import { AuthContext, LoadingContext } from "../../global/Layout";
import {
  ActionsWrapper,
  ButtonsWrapper,
  BuyButton,
  ContentWrapper,
  FilterBtn,
  FiltersWrapper,
  ImageWrapper,
  NFTDataWrapper,
  NFTName,
  NFTNameWrapper,
  OrderButton,
  OwnerDetailsWrapper,
  PageWrapper,
  ProgressCardWrapper,
  ProgressDataWrapper,
  ProgressImageWrapper,
  RewardCardsWrapper,
  TextWrapper,
  CardsRow,
  TableWrapper,
} from "./styles";
import { IProject } from "../../../types/global_types";
import {
  getNoNameNFTBalance,
  getNoNameNFTStakedBalance,
  getUserClaimValue,
} from "../../../smart/initialSmartMain";

const Cave = () => {
  const { data } = useQuery("poolProject", () => fetchProjects("gemslab"));
  const [currentProject, setCurrentProject] = useState<IProject | null>(null);
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [activeTab, setActiveTab] = useState(SpaceportTabs[0]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [isStakeModal, setIsStakeModal] = useState(false);
  const [isUnStakeModal, setIsUnStakeModal] = useState(false);
  const [page, setPage] = useState(1);
  const [isCrossModal, setIsCrossModal] = useState(false);
  const [stakeData, setStakeData] = useState<{
    allNftsValue: number;
    stakedNftsValue: number;
    availableNfts: number;
    claimData: any;
  }>({ allNftsValue: 0, stakedNftsValue: 0, availableNfts: 0, claimData: {} });

  const updateActiveTab = (value: string) => {
    setActiveTab(value);
  };

  const getProjectStakeData = async (project: IProject): Promise<void> => {
    const allNftsValue = await getNoNameNFTBalance(userData?.wallet || "");
    const stakedNftsValue = await getNoNameNFTStakedBalance(
      userData?.wallet || ""
    );
    const availableNfts: number =
      Number(allNftsValue.sum) - Number(stakedNftsValue.sum);
    const claimData = await getUserClaimValue(
      Number(project.poolId),
      userData?.wallet || ""
    );

    setStakeData({
      allNftsValue: Number(allNftsValue.sum),
      stakedNftsValue: Number(stakedNftsValue.sum),
      availableNfts,
      claimData,
    });
  };

  useEffect(() => {
    if (!data?.projects?.length) return;

    const currentProject = data?.projects.find((pr) => pr.isMainProject);

    if (!currentProject?.poolId) return;

    getProjectStakeData(currentProject);
    setCurrentProject(currentProject);
  }, [data?.projects]);

  return (
    <PageWrapper>
      <Typography variant="h1">Spaceport</Typography>
      <br />
      <Subtitle>
        NFTs marketplace for zkSync projects where you can buy/sell your NFT.
      </Subtitle>
      <br />
      <PageDescription variant="p">
        FOMO has developed its own NFT Marketplace so you can easily trade your
        NFTs. You no longer have to look for other places to trade. FOMO has
        everything you need for comfortable investing and dealing with your
        assets.
      </PageDescription>
      <SearchWrapper>
        <SearchInput
          value={searchValue}
          onChange={(value) => setSearchValue(value)}
          placeholder="Search for the desired deal"
          type="text"
          leftIcon={<SearchIconStyle />}
        />
      </SearchWrapper>
      <FiltersWrapper>
        <Tabs
          isDisabled
          items={SpaceportTabs}
          activeItem={activeTab}
          onClick={updateActiveTab}
        />
      </FiltersWrapper>
      <TextWrapper>
        Upcoming and active top tier IDOs & crypto launchpad offerings.
      </TextWrapper>
      <ContentWrapper>
        <ImageWrapper>
          <Image width={100} height={100} src={nft.src} alt="SharkRace Club" />
        </ImageWrapper>
        <NFTDataWrapper>
          <NFTNameWrapper>
            <NFTName variant="h1">NFT Name</NFTName>
          </NFTNameWrapper>
          <ProgressCardWrapper variant="default">
            <ProgressImageWrapper>
              {/*//@ts-ignore*/}
              <CircularProgressbar
                value={35}
                text=""
                styles={buildStyles({
                  rotation: 0,
                  pathColor: `rgba(5, 201, 161, 1)`,
                  textColor: "#05C9A1",
                  trailColor: "#EEEEEE",
                })}
              >
                {25}
              </CircularProgressbar>
              <Image
                width={100}
                height={100}
                src={nft.src}
                alt="SharkRace Club"
              />
            </ProgressImageWrapper>
            <ProgressDataWrapper>
              <div>
                <p>FREE NFT</p>
                <span>SOON</span>
              </div>
            </ProgressDataWrapper>
          </ProgressCardWrapper>
          <OwnerDetailsWrapper>
            <p>Owner details</p>
            <div>
              <Image
                width={100}
                height={100}
                src={nft.src}
                alt="SharkRace Club"
              />
              <span>0x541g651...dfg65g1</span>
            </div>
          </OwnerDetailsWrapper>
        </NFTDataWrapper>
      </ContentWrapper>
      <TextWrapper>Stake your FOMO NFT so as to be ready to invest</TextWrapper>
      <CardsRow>
        <StakeCard
          poolId={currentProject?.poolId || -1}
          alreadyStake={stakeData.stakedNftsValue}
          availableStake={stakeData.availableNfts}
        />
        <ClaimCard
          isAlreadyClaimed={
            !!userData?.claimedProjects?.find(
              (id: string) => id === currentProject?._id
            )
          }
          user={userData}
          rewards={stakeData.claimData?.claimValue || 0}
          project={currentProject}
        />
      </CardsRow>
      <TableWrapper>
        <StakingTable />
      </TableWrapper>
      {/* <Wrapper>
        <PageTitle variant="p">Rewards</PageTitle>
        <ProjectTable />
        <Pagination
          page={page}
          total={20}
          limit={10}
          totalPage={20}
          onChange={(value) => setPage(value)}
        />
      </Wrapper> */}
      {isStakeModal && <StakeModal onClose={() => setIsStakeModal(false)} />}
      {isUnStakeModal && (
        <UnStakeModal onClose={() => setIsUnStakeModal(false)} />
      )}
      {isCrossModal && <CrossModal onClose={() => setIsCrossModal(false)} />}
      <Wrapper>
        <PageTitle variant="p">Rewards NFT</PageTitle>
        <div className="container">
          <RewardCardsWrapper>
            <RewardCard onCross={() => setIsCrossModal(true)} />
            <RewardCard onCross={() => setIsCrossModal(true)} />
            <RewardCard onCross={() => setIsCrossModal(true)} />
            <RewardCard onCross={() => setIsCrossModal(true)} />
            <RewardCard onCross={() => setIsCrossModal(true)} />
          </RewardCardsWrapper>
        </div>
      </Wrapper>
    </PageWrapper>
  );
};

export default Cave;
