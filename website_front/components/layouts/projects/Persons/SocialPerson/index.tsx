import React, { useState } from "react";
import moment from "moment";
import dynamic from "next/dynamic";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import RatingCircle from "../../../../global/RatingCircle";
import Typography from "../../../../global/common/Typography";
import {
  ArrowDownIcon,
  FacebookIcon,
  InstagramIcon,
  LikeIcon,
  LinkedinIcon,
  LinkIcon,
  NotificationIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import News from "../../../../global/News";
import Tabs from "../../../../global/Tabs";
import BaseCard from "../../../../global/common/BaseCard";
import UserAvatar from "../../../../global/common/UserAvatar";
import UsersModal from "../../modals/UsersModal";
import {
  topData,
  topDataMore,
} from "../../../../../staticContent/projects/crypto_market";
// import UsersListModal from "../../../../global/modals";
import BoardUserListModal from "../../../../global/modals/BoardUsersListModal";
import CommentBlock from "../../../../global/CommentBlock";
import TopList from "./top_list";
import {
  ActionButton,
  ActionsWrapper,
  CommentsTitle,
  GraphicDataAccounts,
  GraphicDataDescription,
  GraphicDataProgress,
  GraphicDataTitle,
  GraphicDataUsersList,
  GraphicDataUsersListTitle,
  GraphicHeaderButton,
  GraphicHeaderButtonsWrapper,
  GraphicHeaderTagsWrapper,
  GraphicHeaderWrapper,
  GraphicWrapper,
  HeaderDataRightWrapper,
  HeaderDataWrapper,
  HeaderDateWrapper,
  HeaderDescription,
  HeaderInfoWrapper,
  HeaderUserDescriptionWrapper,
  HeaderUserInfoWrapper,
  HeaderUserName,
  HeaderWrapper,
  PageWrapper,
  RatingCircleWrapper,
  ScoreBlockWrapper,
  ScoreProgress,
  ScoreProgressPoints,
  ScoreTitle,
  ScoreValue,
  ScoreWrapper,
  SocialsWrapper,
  UserAvatarWrapper,
  UsersScoreUserButton,
} from "./styles";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const data = [
  {
    x: new Date(1538778600000),
    y: [6629.81, 6650.5, 6623.04, 6633.33],
  },
  {
    x: new Date(1538780400000),
    y: [6632.01, 6643.59, 6620, 6630.11],
  },
  {
    x: new Date(1538782200000),
    y: [6630.71, 6648.95, 6623.34, 6635.65],
  },
  {
    x: new Date(1538784000000),
    y: [6635.65, 6651, 6629.67, 6638.24],
  },
  {
    x: new Date(1538785800000),
    y: [6638.24, 6640, 6620, 6624.47],
  },
  {
    x: new Date(1538787600000),
    y: [6624.53, 6636.03, 6621.68, 6624.31],
  },
  {
    x: new Date(1538789400000),
    y: [6624.61, 6632.2, 6617, 6626.02],
  },
  {
    x: new Date(1538791200000),
    y: [6627, 6627.62, 6584.22, 6603.02],
  },
  {
    x: new Date(1538793000000),
    y: [6605, 6608.03, 6598.95, 6604.01],
  },
  {
    x: new Date(1538794800000),
    y: [6604.5, 6614.4, 6602.26, 6608.02],
  },
  {
    x: new Date(1538796600000),
    y: [6608.02, 6610.68, 6601.99, 6608.91],
  },
  {
    x: new Date(1538798400000),
    y: [6608.91, 6618.99, 6608.01, 6612],
  },
  {
    x: new Date(1538800200000),
    y: [6612, 6615.13, 6605.09, 6612],
  },
  {
    x: new Date(1538802000000),
    y: [6612, 6624.12, 6608.43, 6622.95],
  },
  {
    x: new Date(1538803800000),
    y: [6623.91, 6623.91, 6615, 6615.67],
  },
  {
    x: new Date(1538805600000),
    y: [6618.69, 6618.74, 6610, 6610.4],
  },
  {
    x: new Date(1538807400000),
    y: [6611, 6622.78, 6610.4, 6614.9],
  },
  {
    x: new Date(1538809200000),
    y: [6614.9, 6626.2, 6613.33, 6623.45],
  },
  {
    x: new Date(1538811000000),
    y: [6623.48, 6627, 6618.38, 6620.35],
  },
  {
    x: new Date(1538812800000),
    y: [6619.43, 6620.35, 6610.05, 6615.53],
  },
  {
    x: new Date(1538814600000),
    y: [6615.53, 6617.93, 6610, 6615.19],
  },
  {
    x: new Date(1538816400000),
    y: [6615.19, 6621.6, 6608.2, 6620],
  },
  {
    x: new Date(1538818200000),
    y: [6619.54, 6625.17, 6614.15, 6620],
  },
  {
    x: new Date(1538820000000),
    y: [6620.33, 6634.15, 6617.24, 6624.61],
  },
  {
    x: new Date(1538821800000),
    y: [6625.95, 6626, 6611.66, 6617.58],
  },
  {
    x: new Date(1538823600000),
    y: [6619, 6625.97, 6595.27, 6598.86],
  },
  {
    x: new Date(1538825400000),
    y: [6598.86, 6598.88, 6570, 6587.16],
  },
  {
    x: new Date(1538827200000),
    y: [6588.86, 6600, 6580, 6593.4],
  },
  {
    x: new Date(1538829000000),
    y: [6593.99, 6598.89, 6585, 6587.81],
  },
  {
    x: new Date(1538830800000),
    y: [6587.81, 6592.73, 6567.14, 6578],
  },
  {
    x: new Date(1538832600000),
    y: [6578.35, 6581.72, 6567.39, 6579],
  },
  {
    x: new Date(1538834400000),
    y: [6579.38, 6580.92, 6566.77, 6575.96],
  },
  {
    x: new Date(1538836200000),
    y: [6575.96, 6589, 6571.77, 6588.92],
  },
  {
    x: new Date(1538838000000),
    y: [6588.92, 6594, 6577.55, 6589.22],
  },
  {
    x: new Date(1538839800000),
    y: [6589.3, 6598.89, 6589.1, 6596.08],
  },
  {
    x: new Date(1538841600000),
    y: [6597.5, 6600, 6588.39, 6596.25],
  },
  {
    x: new Date(1538843400000),
    y: [6598.03, 6600, 6588.73, 6595.97],
  },
  {
    x: new Date(1538845200000),
    y: [6595.97, 6602.01, 6588.17, 6602],
  },
  {
    x: new Date(1538847000000),
    y: [6602, 6607, 6596.51, 6599.95],
  },
  {
    x: new Date(1538848800000),
    y: [6600.63, 6601.21, 6590.39, 6591.02],
  },
  {
    x: new Date(1538850600000),
    y: [6591.02, 6603.08, 6591, 6591],
  },
  {
    x: new Date(1538852400000),
    y: [6591, 6601.32, 6585, 6592],
  },
  {
    x: new Date(1538854200000),
    y: [6593.13, 6596.01, 6590, 6593.34],
  },
  {
    x: new Date(1538856000000),
    y: [6593.34, 6604.76, 6582.63, 6593.86],
  },
  {
    x: new Date(1538857800000),
    y: [6593.86, 6604.28, 6586.57, 6600.01],
  },
  {
    x: new Date(1538859600000),
    y: [6601.81, 6603.21, 6592.78, 6596.25],
  },
  {
    x: new Date(1538861400000),
    y: [6596.25, 6604.2, 6590, 6602.99],
  },
  {
    x: new Date(1538863200000),
    y: [6602.99, 6606, 6584.99, 6587.81],
  },
  {
    x: new Date(1538865000000),
    y: [6587.81, 6595, 6583.27, 6591.96],
  },
  {
    x: new Date(1538866800000),
    y: [6591.97, 6596.07, 6585, 6588.39],
  },
  {
    x: new Date(1538868600000),
    y: [6587.6, 6598.21, 6587.6, 6594.27],
  },
  {
    x: new Date(1538870400000),
    y: [6596.44, 6601, 6590, 6596.55],
  },
  {
    x: new Date(1538872200000),
    y: [6598.91, 6605, 6596.61, 6600.02],
  },
  {
    x: new Date(1538874000000),
    y: [6600.55, 6605, 6589.14, 6593.01],
  },
  {
    x: new Date(1538875800000),
    y: [6593.15, 6605, 6592, 6603.06],
  },
  {
    x: new Date(1538877600000),
    y: [6603.07, 6604.5, 6599.09, 6603.89],
  },
  {
    x: new Date(1538879400000),
    y: [6604.44, 6604.44, 6600, 6603.5],
  },
  {
    x: new Date(1538881200000),
    y: [6603.5, 6603.99, 6597.5, 6603.86],
  },
  {
    x: new Date(1538883000000),
    y: [6603.85, 6605, 6600, 6604.07],
  },
  {
    x: new Date(1538884800000),
    y: [6604.98, 6606, 6604.07, 6606],
  },
];

const crumbs = [
  { title: "Projects", link: "/crypto" },
  { title: "Analytics", link: "/crypto/analytics" },
  { title: "Dr. Laurent El Ghaul", link: "/crypto/analytics/234" },
];

const tabs = ["Score", "Activity", "Dynamics", "Price effect"];
const periods = ["24h", "7D", "30D", "90D", "6M", "1Y", "2Y"];

const Person = () => {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [activePeriod, setActivePeriod] = useState(periods[0]);
  const [influencersModal, setInfluencersModal] = useState(false);
  const [projectsModal, setProjectsModal] = useState(false);
  const [scoreModal, setScoreModal] = useState(false);
  const [accountsModal, setAccountsModal] = useState(false);

  return (
    <PageWrapper>
      <BreadCrumbs items={crumbs} />
      <HeaderWrapper>
        <HeaderInfoWrapper>
          <HeaderUserInfoWrapper>
            <UserAvatarWrapper
              size="giant"
              avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
              name="name"
              variant="success"
              rating={94}
            />
            <div>
              <HeaderUserName>
                <Typography variant="p">Dr. Laurent El Ghaul</Typography>
                <RatingCircleWrapper>
                  <RatingCircle rating={75} variant="success" />
                </RatingCircleWrapper>
              </HeaderUserName>
              <HeaderUserDescriptionWrapper>
                <Typography variant="p">Business manager</Typography>
                <SocialsWrapper>
                  <LinkIcon fill="#00C099" />
                  <LinkedinIcon fill="#00C099" />
                  <FacebookIcon fill="#00C099" />
                  <InstagramIcon fill="#00C099" />
                  <TwitterIcon fill="#00C099" />
                </SocialsWrapper>
              </HeaderUserDescriptionWrapper>
            </div>
          </HeaderUserInfoWrapper>
          <HeaderDataWrapper>
            <HeaderDataRightWrapper>
              <HeaderDateWrapper>
                <p>Created:</p>
                <span>{moment().format("MMM d, yyyy")}</span>
              </HeaderDateWrapper>
              <HeaderDateWrapper>
                <p>First post:</p>
                <span>{moment().format("MMM d, yyyy")}</span>
              </HeaderDateWrapper>
              <HeaderDateWrapper>
                <p>Last post:</p>
                <span>{moment().format("MMM d, yyyy")}</span>
              </HeaderDateWrapper>
              <ActionsWrapper>
                <ActionButton>
                  <NotificationIcon fill="#738094" />
                </ActionButton>
                <ActionButton>
                  <LikeIcon fill="#738094" />
                </ActionButton>
                <ActionButton>
                  <LinkIcon fill="#738094" />
                </ActionButton>
              </ActionsWrapper>
            </HeaderDataRightWrapper>
          </HeaderDataWrapper>
        </HeaderInfoWrapper>
        <div>
          <HeaderDescription variant="p">
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
            sint. Velit officia consequat duis enim velit mollit. Exercitation
            veniam consequat sunt nostrud amet. Amet minim mollit non deserunt
            ullamco est sit aliqua dolor do amet sint. Velit officia consequat
            duis enim velit mollit.
          </HeaderDescription>
        </div>
      </HeaderWrapper>
      <ScoreWrapper>
        <ScoreBlockWrapper variant="default">
          <ScoreTitle>
            Score <span>Top #91</span>
          </ScoreTitle>
          <ScoreValue>
            3213{" "}
            <span>
              <ArrowDownIcon fill="#00C099" /> 17
            </span>
          </ScoreValue>
          <div>
            <ScoreProgress />
            <ScoreProgressPoints>
              <div>0</div>
              <div>100</div>
              <div>1500</div>
              <div>4000</div>
            </ScoreProgressPoints>
          </div>
        </ScoreBlockWrapper>
        <TopList
          title="Top influencers"
          delta={42}
          totalAmount={13400}
          data={topData}
          onClick={() => setInfluencersModal(true)}
        />
        <TopList
          title="Projects"
          totalAmount={1990}
          data={topDataMore}
          onClick={() => setProjectsModal(true)}
        />
        <TopList
          title="Score"
          delta={-3}
          totalAmount={13400}
          data={topData}
          onClick={() => setScoreModal(true)}
        />
      </ScoreWrapper>
      <GraphicWrapper>
        <div>
          <Tabs
            items={tabs}
            activeItem={activeTab}
            onClick={(value) => setActiveTab(value)}
          />
          <GraphicHeaderWrapper>
            <div className="header">
              <GraphicHeaderButtonsWrapper>
                {periods.map((item, i) => {
                  return (
                    <GraphicHeaderButton
                      key={i}
                      active={activePeriod === item}
                      onClick={() => setActivePeriod(item)}
                    >
                      {item}
                    </GraphicHeaderButton>
                  );
                })}
              </GraphicHeaderButtonsWrapper>
              <GraphicHeaderTagsWrapper>
                <div>
                  <span />
                  Rating
                </div>
                <div>
                  <span />
                  Subscribers
                </div>
              </GraphicHeaderTagsWrapper>
            </div>
            <div className="chart">
              <ReactApexChart
                options={{
                  chart: {
                    type: "candlestick",
                    height: 285,
                  },
                  xaxis: {
                    type: "datetime",
                  },
                  yaxis: {
                    tooltip: {
                      enabled: true,
                    },
                  },
                }}
                series={[
                  {
                    data,
                  },
                ]}
                type="candlestick"
                width="100%"
                height={485}
              />
            </div>
          </GraphicHeaderWrapper>
        </div>
        <BaseCard variant="default">
          <GraphicDataTitle>Accounts comparison</GraphicDataTitle>
          <GraphicDataDescription>
            Amet minim mollit non deserunt ullamco est sit aliqua dolor do amet
            sint
          </GraphicDataDescription>
          <GraphicDataAccounts>
            <div>
              <p>Account #1</p>
              <input type="text" />
            </div>
            <div>
              <p>Account #2</p>
              <input type="text" />
            </div>
          </GraphicDataAccounts>
          <GraphicDataProgress value={75}>
            <div>
              <p>Аudience intersection</p>
              <span>75%</span>
            </div>
            <div>
              <div />
            </div>
          </GraphicDataProgress>
          <div>
            <GraphicDataUsersListTitle>Accounts</GraphicDataUsersListTitle>
            <GraphicDataUsersList>
              {topDataMore.map((item, i) => {
                if (i < 10) {
                  return (
                    <div key={i}>
                      <UserAvatar
                        size="small"
                        variant="default"
                        avatar={item.avatar}
                        name={item.name}
                      />
                      <div>
                        <p>{item.name}</p>
                        <span>{item.desc}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })}
            </GraphicDataUsersList>
            <UsersScoreUserButton onClick={() => setAccountsModal(true)}>
              See all &gt;
            </UsersScoreUserButton>
          </div>
        </BaseCard>
      </GraphicWrapper>
      <div>
        <CommentsTitle variant="p">News</CommentsTitle>
        <News />
      </div>
      <CommentBlock />

      {/* {influencersModal && (
        <UsersModal
          title="Top influencers"
          onClose={() => setInfluencersModal(false)}
        />
      )}
      {projectsModal && (
        <UsersModal title="Projects" onClose={() => setProjectsModal(false)} />
      )}
      {scoreModal && (
        <UsersModal title="Score" onClose={() => setScoreModal(false)} />
      )} */}
      {/* {accountsModal && (
        <UsersListModal
          title="Accounts"
          onClose={() => setAccountsModal(false)}
        />
      )} */}
    </PageWrapper>
  );
};

export default Person;
