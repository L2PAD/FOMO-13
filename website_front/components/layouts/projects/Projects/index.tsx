import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import ResponsivePagination from "react-responsive-pagination";
import "react-responsive-pagination/themes/minimal.css";
import ViewTable from "../../../global/Tables/ViewTable";
import Typography from "../../../global/common/Typography";
import { NFTsProjectsTabs } from "../../../../staticContent/tabs";
import TopCard from "../../../lib/TopCard";
import { CardsWrapper } from "../../../lib/TopCard/styles";
import { PageDescription } from "../News/styles";
import { Sort } from "../../../global/common/Sort";
import {
  GraphicButton,
  GraphicButtonsWrapper,
  PageWrapper,
  PaginationWrapper,
  ProjectsWrapper,
} from "./styles";

const LIMIT = 10;

const Projects = () => {
  const [activeTab, setActiveTab] = useState(NFTsProjectsTabs[0]);
  const [collections, setСollections] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage] = useState(50);
  const [total] = useState(0);
  const [date, setDate] = useState("");
  const router = useRouter();
  const { tab } = router.query;

  const fetchData = async () => {
    const data = new Array(10).fill("");

    const newCollections: any[] = data.map((_, i) => ({
      type: "nft",
      cardData: {
        userAvatar:
          "https://cs13.pikabu.ru/post_img/big/2023/02/13/8/1676295806122712757.png",
        userName: "JohnDoe123",
        variant: "default",
        title: "My Awesome NFT",
        description: "This is an amazing NFT card.",
        floorPrice: 100,
        volume1: 50,
        volume7: 350,
        totalVolume: 1500,
        sellers: "Seller123",
        marketCap: 50000,
        floorPrice1: 120,
        listed: "2023",
        royalty_fee: "10%",
        supplyListed: 20,
        owners: 5,
        supply: 1000,
        contractAddress: "0xabc123def456",
        id: i,
      },
    }));

    setСollections(newCollections);
  };

  useEffect(() => {
    NFTsProjectsTabs.forEach((item) => {
      if (tab) {
        if (item.toLowerCase() === tab) {
          router.push(
            "",
            { query: { tab: item.toLowerCase() } },
            { shallow: true }
          );
          setActiveTab(item);
        }
      }
    });
  }, [router, tab]);

  useEffect(() => {
    // setTotalPage(0)
    // setTotal(0)
    setPage(1);
    setСollections([]);
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <PageWrapper>
      <Typography variant="h1">NFT Market</Typography>
      <br />
      <PageDescription variant="p">
        Explore the NFT marketplace for zkSync projects where you can discover,
        buy, and sell your favorite NFTs with real-time insights.{" "}
      </PageDescription>
      <br />
      <CardsWrapper>
        <TopCard title="Top floor movers" variant="TopMovers" />
        <TopCard title="Top sales" variant="sales" />
        <TopCard title="Bottom floor movers" variant="BottomMovers" />
        <TopCard title="Top folowers growth" variant="folowers" />
      </CardsWrapper>
      {/* <Tabs
        items={NFTsProjectsTabs}
        activeItem={activeTab}
        onClick={updateActiveTab}
      /> */}
      <h1>Project list</h1>
      <GraphicButtonsWrapper>
        <div>
          {NFTsProjectsTabs.map((NFTsProjectsTab, i: number) => (
            <GraphicButton key={i}>{NFTsProjectsTab}</GraphicButton>
          ))}
        </div>
        <div>
          <Sort
            label="Sort by"
            type="date"
            options={[
              {
                label: "Date",
                items: ["New", "Old"],
                value: date,
                setValue: setDate,
              },
            ]}
          />
        </div>
      </GraphicButtonsWrapper>
      <ProjectsWrapper>
        <ViewTable
          type="nft"
          cardsData={{
            cards: collections?.map((item) => ({
              ...item.cardData,
              onClick: () => {
                router.push(`nfts/project/${item.cardData.id}`);
              },
            })),
          }}
        />
        <PaginationWrapper>
          <div>
            <ResponsivePagination
              current={page}
              total={totalPage}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
          <Typography variant="p">
            <span className="showing">Showing</span> {LIMIT} of {total || 0}
          </Typography>
        </PaginationWrapper>
      </ProjectsWrapper>
    </PageWrapper>
  );
};

export default Projects;
