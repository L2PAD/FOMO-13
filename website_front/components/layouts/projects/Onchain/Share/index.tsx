import React, { useState } from "react";
import moment from "moment";
import Link from "next/link";
import { PageWrapper } from "../styles";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import UserAvatar from "../../../../global/common/UserAvatar";
import { InstagramIcon, LinkIcon, TwitterIcon } from "../../../../global/Icons";
import Typography from "../../../../global/common/Typography";
import { simplifyAmount } from "../../../../../helpers/simplifyAmount";
import Tabs from "../../../../global/Tabs";
import { ProjectsProjectsCards } from "../../../../../staticContent/projects/projects";
import { ProjectCardItem, ProjectCardLink } from "../../Projects/styles";
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
} from "../Project/styles";

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

const ShareOnchainProject = () => {
  const [activePortfolioTab, setActivePortfolioTab] = useState(
    portfolioTabs[0]
  );

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
            <p>a16z 0xxf65x4f654f654ds6f54sd6f54ds65fsd65f4</p>
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
          <Link href="/crypto/onchain/visualize">Visualize</Link>
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
    </PageWrapper>
  );
};

export default ShareOnchainProject;
