import React, { useState } from "react";
import moment from "moment";
import Link from "next/link";
import { PageWrapper } from "../styles";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import UserAvatar from "../../../../global/common/UserAvatar";
import {
  InstagramIcon,
  LinkIcon,
  ShareIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import Typography from "../../../../global/common/Typography";
import { simplifyAmount } from "../../../../../helpers/simplifyAmount";
import Tabs from "../../../../global/Tabs";
import { ProjectsProjectsCards } from "../../../../../staticContent/projects/projects";
import { ProjectCardItem, ProjectCardLink } from "../../Projects/styles";
import ShareModal from "../../../../global/modals/ShareModal";
import {
  UserHeaderBottomDataItemWrapper,
  UserHeaderBottomDataWrapper,
  UserHeaderDataWrapper,
  UserHeaderLeftWrapper,
  UserHeaderRightWrapper,
  UserHeaderWrapper,
  ConnectionsPostContent,
  ConnectionsPostData,
  ConnectionWrapper,
  ConnectionsPostsWrapper,
  ContentWrapper,
  PortfolioCardsWrapper,
  GraphicsWrapper,
  TabsWrapper,
  ExchangeGraphicWrapper,
} from "./styles";
import TransactionsTab from "./TransactionsTabs/TransactionsTab";
import InflowTable from "./TransactionsTabs/InflowTable";
import OutflowTable from "./TransactionsTabs/OutflowTable";
import EchangeTab from "./EchangeTabs/EchangeTab";
import TopCounterTab from "./EchangeTabs/TopCounterTab";
import ComparisonTab from "./EchangeTabs/ComparisonTab";

const items = [
  { title: "Projects", link: "/crypto" },
  { title: "Onchain", link: "/crypto/onchain" },
  { title: "Address", link: "/crypto/onchain/123" },
];

const portfolioTabs = [
  "All networks",
  "Ethereum",
  "Arbitrum",
  "BSC",
  "Polygon",
];
const transactionTabs = ["Transactions", "Inflow", "Outflow"];
const exchangeTabs = ["Exchange", "Top counter", "Comparison"];
const graphicTabs = ["Balance history", "Profit & logs"];

const OnchainProjectPage = () => {
  const [activePortfolioTab, setActivePortfolioTab] = useState(
    portfolioTabs[0]
  );
  const [activeTransactionTab, setActiveTransactionTab] = useState(
    transactionTabs[0]
  );
  const [activeGraphicTab, setActiveGraphicTab] = useState(graphicTabs[0]);
  const [activeExchangeTab, setActiveExchangeTab] = useState(exchangeTabs[0]);
  const [isShareModal, setIsShareModal] = useState(false);

  const renderTransactionsTabs = () => {
    switch (activeTransactionTab) {
      case "Transactions":
        return <TransactionsTab />;
      case "Inflow":
        return <InflowTable />;
      case "Outflow":
        return <OutflowTable />;
      default:
        return <TransactionsTab />;
    }
  };

  const renderExchangeTabs = () => {
    switch (activeExchangeTab) {
      case "Exchange":
        return <EchangeTab />;
      case "Top counter":
        return <TopCounterTab />;
      case "Comparison":
        return <ComparisonTab />;
      default:
        return <EchangeTab />;
    }
  };

  return (
    <PageWrapper>
      <BreadCrumbs items={items} />
      <UserHeaderWrapper>
        <UserHeaderLeftWrapper>
          <UserAvatar
            size="medium"
            variant="warn"
            avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
            name="name"
            rating={94}
          />
          <UserHeaderDataWrapper delta={+311}>
            <p>0xxf65x4f654f654ds6f54sd6f54ds65fsd65f4</p>
            <div>
              <p>$12,099,524.14</p>
              <div>
                <span>+311.15K</span>
                <a href="#">
                  <InstagramIcon fill="#00C099" />
                </a>
                <a href="#">
                  <TwitterIcon fill="#00C099" />
                </a>
                <a href="#">
                  <LinkIcon fill="#00C099" />
                </a>
              </div>
            </div>
          </UserHeaderDataWrapper>
        </UserHeaderLeftWrapper>
        <UserHeaderRightWrapper>
          <Link href="/utility/onchain/visualize">Visualize</Link>
          <button onClick={() => setIsShareModal(true)}>
            <ShareIcon fill="#04A584" />
            Share
          </button>
        </UserHeaderRightWrapper>
      </UserHeaderWrapper>
      <UserHeaderBottomDataWrapper>
        <UserHeaderBottomDataItemWrapper>
          <p>Twitter</p>
          <span className="green">Verified</span>
        </UserHeaderBottomDataItemWrapper>
        <UserHeaderBottomDataItemWrapper>
          <p>Fishing addreses</p>
          <span className="red">Send and get</span>
        </UserHeaderBottomDataItemWrapper>
        <UserHeaderBottomDataItemWrapper>
          <p>Duration of holding</p>
          <span>75%</span>
        </UserHeaderBottomDataItemWrapper>
        <UserHeaderBottomDataItemWrapper>
          <p>Top NFT on balance</p>
          <span>none</span>
        </UserHeaderBottomDataItemWrapper>
        <UserHeaderBottomDataItemWrapper>
          <p>Big drops history</p>
          <span>
            Name <i>({moment().format("DD.MM.YYYY")})</i>
          </span>
        </UserHeaderBottomDataItemWrapper>
      </UserHeaderBottomDataWrapper>
      <ContentWrapper>
        <p>Connections</p>
        <ConnectionsPostsWrapper>
          {Array(8)
            .fill("")
            .map((item, i) => {
              return (
                <ConnectionWrapper variant="default" key={i + item}>
                  <UserAvatar
                    size="small"
                    variant="default"
                    avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                    name="name"
                  />
                  <ConnectionsPostContent>
                    <ConnectionsPostData>
                      <h6>Name</h6>
                      <Typography variant="p">0xxf65...54654</Typography>
                    </ConnectionsPostData>
                    <span>${simplifyAmount(1554015.04)}</span>
                  </ConnectionsPostContent>
                </ConnectionWrapper>
              );
            })}
        </ConnectionsPostsWrapper>
      </ContentWrapper>
      <ContentWrapper>
        <p>Portfolio</p>
        <Tabs
          items={portfolioTabs}
          activeItem={activePortfolioTab}
          onClick={(value) => setActivePortfolioTab(value)}
        />
        <PortfolioCardsWrapper>
          {ProjectsProjectsCards.map((item, i) => {
            if (i <= 7) {
              return (
                <ProjectCardLink href="/crypto/project/123" key={i}>
                  <ProjectCardItem
                    type="default"
                    //@ts-ignore
                    cardData={item}
                  />
                </ProjectCardLink>
              );
            }
            return null;
          })}
        </PortfolioCardsWrapper>
      </ContentWrapper>
      <GraphicsWrapper>
        <div>
          <Tabs
            items={transactionTabs}
            activeItem={activeTransactionTab}
            onClick={(value) => setActiveTransactionTab(value)}
          />
          <TabsWrapper>{renderTransactionsTabs()}</TabsWrapper>
        </div>
        <div>
          <Tabs
            items={graphicTabs}
            activeItem={activeGraphicTab}
            onClick={(value) => setActiveGraphicTab(value)}
          />
          <TabsWrapper>Graphic</TabsWrapper>
        </div>
      </GraphicsWrapper>
      <ContentWrapper>
        <Tabs
          items={exchangeTabs}
          activeItem={activeExchangeTab}
          onClick={(value) => setActiveExchangeTab(value)}
        />
        <ExchangeGraphicWrapper variant="default">
          {renderExchangeTabs()}
        </ExchangeGraphicWrapper>
      </ContentWrapper>
      {isShareModal && (
        <ShareModal
          onClose={() => setIsShareModal(false)}
          link="/projects/onchain/share/123"
        />
      )}
    </PageWrapper>
  );
};

export default OnchainProjectPage;
