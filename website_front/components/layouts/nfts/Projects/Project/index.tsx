import React, { useState, useContext } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";
import BreadCrumbs from "../../../../global/BreadCrumbs";
import {
  CommentsTitle,
  FlagsList,
  FlagsListItem,
  FlagsListsWrapper,
  FlagsListTitle,
  FlagsTitle,
  FlagsWrapper,
} from "../../Persons/Person/styles";
import News from "../../../../global/News";
import {
  HeaderPersonNameWrapper,
  RangeDescription,
  RangeDescriptionWrapper,
  RangeTitle,
  RangeValue,
  RangeWrapper,
  RatingCircleWrapper,
} from "../../../gemslab/Accelerator/Project/styles";
import RatingCircle from "../../../../global/RatingCircle";
import {
  HeaderActionsWrapperMobile,
  HeaderDescriptionItemsWrapperMobile,
} from "../../../projects/Projects/Project/styles";
import Typography from "../../../../global/common/Typography";
import {
  CalendarIcon,
  CheckIcon,
  CloseIcon,
  CopyIcon,
  EditIcon,
  FacebookIcon,
  IdeaIcon,
  InstagramIcon,
  LikeIcon,
  LinkedinIcon,
  LinkIcon,
  NotificationIcon,
  ShareIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import UserAvatar from "../../../../global/common/UserAvatar";
import StatusTag from "../../../../global/StatusTag";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import { clarifyDate } from "../../../../../helpers/clarifyDate";
import ShareModal from "../../../../global/modals/ShareModal";
import { authState } from "../../../../../store/slices/authSlice";
import CommentBlock from "../../../../global/CommentBlock";
import Investors from "../../../projects/Crypto/Project/Investors";
import PersonsTabs from "../../../projects/Crypto/Project/PersonsTabs";
import NFTs from "./NFTs";
import { ProjectDataContext } from "../../../../../pages/nfts/minting/[id]";
import {
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
  HeaderUsersRow,
  HeaderUserWrapper,
  HeaderWrapper,
  LeftHeaderPersonInfoWrapper,
  LeftHeaderWrapper,
  NewsWrapper,
  PageWrapper,
  PersonPriceWrapper,
  ProgressWrapper,
  ProjectDescriptionDataWrapper,
  ProjectDescriptionItem,
  RatingMediaList,
  RatingMediaListItem,
  RatingMediaWrapper,
  RightHeaderHead,
  RightHeaderWrapper,
  ShareButton,
  ShareTagText,
  ShareTagWrapper,
} from "./styles";
import imageLoader from "../../../../../helpers/imageLoader";
import { participantsItems } from "../../../projects/Crypto/Project";
import { IComment, IFlag } from "../../../../../types/global_types";
import { AuthContext } from "../../../../global/Layout";
import addComment from "../../../../../http/comments/addComment";

const keyString = "0x70asdfhalsflasjdf34ggff02";

const Project = () => {
  const { userData } = useContext(AuthContext);
  const nft = useContext(ProjectDataContext);
  const [newComments, setNewComments] = useState<Array<IComment>>([]);
  const [participantActiveTab, setParticipantActiveTab] = useState(
    participantsItems[0]
  );
  const [isHideDesc, setIsHideDesc] = useState(true);
  const [isShareModal, setIsShareModal] = useState(false);
  const { isLogin } = useSelector(authState);

  const [isUpdateInvestors, setIsUpdateInvestors] = useState<boolean>(false);
  const [isUpdateParticipants, setIsUpdateParticipants] =
    useState<boolean>(false);

  const confirmAddComment = async (text: string): Promise<void> => {
    if (!userData.isFullAuth) {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>You need to be fully logged in to add comments</p>
        </div>
      );
      return;
    }

    const newComment: IComment = {
      text,
      author: [userData],
      date: new Date(),
    };

    const { isSuccess } = await addComment(
      `projects/comment/${nft._id}`,
      newComment
    );

    if (isSuccess) {
      setNewComments((prev: Array<IComment>) => {
        return [newComment, ...prev];
      });
    }
  };

  const copySmartContract = () => {
    navigator.clipboard.writeText(keyString);
    toast.success("Smart contract was copied");
  };

  return (
    <>
      <PageWrapper>
        <BreadCrumbs
          items={[
            { title: "Projects", link: "/nfts/minting" },
            { title: nft.name, link: `/nfts/project/${nft._id}` },
          ]}
        />
        <ShareTagWrapper>
          <ShareTagText variant="p">
            <span>Important: </span>
            {nft.banner}
            <i />
          </ShareTagText>
          <ShareButton onClick={() => setIsShareModal(true)}>
            <ShareIcon fill="#04A584" />
            Share
          </ShareButton>
        </ShareTagWrapper>
        <HeaderWrapper>
          <LeftHeaderWrapper>
            <LeftHeaderPersonInfoWrapper>
              <UserAvatar
                avatar={imageLoader(String(nft.logo))}
                variant="default"
                size="medium"
                name={nft.name}
              />
              <div>
                <HeaderPersonNameWrapper>
                  <HeaderPersonTitle variant="p">{nft.name}</HeaderPersonTitle>
                  <RatingCircleWrapper>
                    <RatingCircle
                      rating={Number(nft.rating)}
                      variant="success"
                    />
                  </RatingCircleWrapper>
                </HeaderPersonNameWrapper>
                <HeaderPersonDescription>
                  <Typography variant="p">{nft.niche}</Typography>
                  <StatusTag variant={nft.status.toLowerCase()} />
                  {/* <LinkIcon fill="#00C099" />
                  <LinkedinIcon fill="#00C099" />
                  <FacebookIcon fill="#00C099" />
                  <InstagramIcon fill="#00C099" />
                  <TwitterIcon fill="#00C099" /> */}
                </HeaderPersonDescription>
              </div>
              <HeaderActionsWrapperMobile>
                <button>
                  <CalendarIcon fill="#738094" />
                </button>
                <button>
                  <IdeaIcon fill="#738094" />
                </button>
                <button>
                  <NotificationIcon fill="#738094" />
                </button>
                <button>
                  <LikeIcon fill="#738094" />
                </button>
              </HeaderActionsWrapperMobile>
            </LeftHeaderPersonInfoWrapper>
            <PersonPriceWrapper>
              <ProgressWrapper>
                <RangeTitle variant="p">Token sale ended</RangeTitle>
                <RangeWrapper>
                  <RangeValue percentage={0} />
                </RangeWrapper>
                <RangeDescriptionWrapper>
                  <RangeDescription variant="p">
                    $0
                    <span>of</span>
                    <i>$0 (0%)</i>
                  </RangeDescription>
                </RangeDescriptionWrapper>
              </ProgressWrapper>
            </PersonPriceWrapper>
          </LeftHeaderWrapper>
          <RightHeaderWrapper>
            <RightHeaderHead>
              <div style={{ display: "flex", gap: 10 }}>
                {isLogin && (
                  <HeaderEditButton>
                    <EditIcon fill="#00C099" />
                  </HeaderEditButton>
                )}
                <HeaderDataTextWrapper>
                  <HeaderDataText variant="p">
                    ${clarifyAmount(Number(nft.totalRaised))}
                    <span>Total Raised</span>
                  </HeaderDataText>
                  <HeaderDataText variant="p">
                    {clarifyDate(nft.ending || String(moment()))}
                    <span>Ending</span>
                  </HeaderDataText>
                  <HeaderDataText variant="p">
                    {nft.type || "-"}
                    <span>Type</span>
                  </HeaderDataText>
                </HeaderDataTextWrapper>
              </div>
              <div>
                <HeaderActionsWrapper>
                  <button>
                    <CalendarIcon fill="#738094" />
                  </button>
                  <button>
                    <IdeaIcon fill="#738094" />
                  </button>
                  <button>
                    <NotificationIcon fill="#738094" />
                  </button>
                  <button>
                    <LikeIcon fill="#738094" />
                  </button>
                </HeaderActionsWrapper>
                <HeaderDescriptionItemsWrapperMobile>
                  <div>
                    <HeaderDescriptionItemsTitle variant="p">
                      Smart contracts:
                    </HeaderDescriptionItemsTitle>
                    <HeaderCopyKey onClick={copySmartContract}>
                      {keyString.slice(0, 4)}...
                      {keyString.slice(keyString.length - 8, keyString.length)}
                      <div>
                        <CopyIcon fill="#738094" />
                      </div>
                    </HeaderCopyKey>
                  </div>
                  <div>
                    <HeaderDescriptionItemsTitle variant="p">
                      <TwitterIcon fill="#738094" />
                      Top Followers
                    </HeaderDescriptionItemsTitle>
                    <HeaderUsersRow>
                      {/* <HeaderUserWrapper>
                        <UserAvatar
                          size="xSmall"
                          avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                          name="name"
                          variant="default"
                        />
                        <Typography variant="p">John Doe</Typography>
                      </HeaderUserWrapper>
                      <HeaderUserWrapper>
                        <UserAvatar
                          size="xSmall"
                          avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                          name="name"
                          variant="default"
                        />
                        <Typography variant="p">John Doe</Typography>
                      </HeaderUserWrapper> */}
                    </HeaderUsersRow>
                  </div>
                </HeaderDescriptionItemsWrapperMobile>
              </div>
            </RightHeaderHead>
            <div>
              <HeaderDescription variant="p">
                {nft.bio}
                <i onClick={() => setIsHideDesc((state) => !state)}>
                  {/* {isHideDesc ? "Show more" : "Hide"} */}
                </i>
              </HeaderDescription>
              <HeaderDescriptionItemsWrapper>
                <div>
                  <HeaderDescriptionItemsTitle variant="p">
                    Smart contracts:
                  </HeaderDescriptionItemsTitle>
                  <HeaderCopyKey onClick={copySmartContract}>
                    {/* {keyString.slice(0, 4)}...
                    {keyString.slice(keyString.length - 8, keyString.length)} */}
                    -
                    <div>
                      <CopyIcon fill="#738094" />
                    </div>
                  </HeaderCopyKey>
                </div>
                <div>
                  <HeaderDescriptionItemsTitle variant="p">
                    <TwitterIcon fill="#738094" />
                    Top Followers
                  </HeaderDescriptionItemsTitle>
                  <HeaderUsersRow>
                    {/* <HeaderUserWrapper>
                      <UserAvatar
                        size="xSmall"
                        avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                        name="name"
                        variant="default"
                      />
                      <Typography variant="p">John Doe</Typography>
                    </HeaderUserWrapper>
                    <HeaderUserWrapper>
                      <UserAvatar
                        size="xSmall"
                        avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                        name="name"
                        variant="default"
                      />
                      <Typography variant="p">John Doe</Typography>
                    </HeaderUserWrapper> */}
                    -
                  </HeaderUsersRow>
                </div>
              </HeaderDescriptionItemsWrapper>
            </div>
          </RightHeaderWrapper>
        </HeaderWrapper>
        <ProjectDescriptionDataWrapper>
          <ProjectDescriptionItem variant="p">
            <span>Market Cap</span>${clarifyAmount(nft.marketCap || 0)}
          </ProjectDescriptionItem>
          <ProjectDescriptionItem percentage={0} variant="p">
            <span>Volume 24H</span>${clarifyAmount(nft.volume || 0)}
            <br />
            <i>0%</i>
          </ProjectDescriptionItem>
          <ProjectDescriptionItem percentage={0} variant="p">
            <span>Circulating Supply</span>
            {nft.circulatingSupply || 0} M GFI
            <br />
            <i>0%</i>
          </ProjectDescriptionItem>
          <ProjectDescriptionItem variant="p">
            <span>Total Supply</span>
            {nft.totalSupply || 0} M GFI
          </ProjectDescriptionItem>
          <ProjectDescriptionItem variant="p">
            <span>Total Supply</span>-
          </ProjectDescriptionItem>
          <div>
            <HeaderDescriptionItemsTitle variant="p">
              Owners
            </HeaderDescriptionItemsTitle>
            {/* <HeaderUsersRow>
              <HeaderUserWrapper>
                <UserAvatar
                  size="xSmall"
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  variant="default"
                />
                <Typography variant="p">John Doe</Typography>
              </HeaderUserWrapper>
              <HeaderUserWrapper>
                <UserAvatar
                  size="xSmall"
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  variant="default"
                />
                <Typography variant="p">John Doe</Typography>
              </HeaderUserWrapper>
            </HeaderUsersRow> */}
            -
          </div>
        </ProjectDescriptionDataWrapper>
        <NFTs />
        <Investors
          toggleUpdateModal={() =>
            setIsUpdateInvestors((prev: boolean) => !prev)
          }
          items={nft.investors || []}
        />
        <PersonsTabs
          activeTab={participantActiveTab}
          setActiveTab={setParticipantActiveTab}
          toggleUpdateModal={() =>
            setIsUpdateParticipants((prev: boolean) => !prev)
          }
          team={nft.team || []}
          advisors={nft.advisors || []}
          partners={nft.partners || []}
        />
        <FlagsWrapper>
          <FlagsTitle variant="p">Flags</FlagsTitle>
          <FlagsListsWrapper>
            <FlagsList>
              <FlagsListTitle variant="p">Green</FlagsListTitle>
              <ul>
                {nft.greenFlagsList?.length ? (
                  nft.greenFlagsList.map((item: IFlag, i: number) => {
                    return (
                      <FlagsListItem key={i}>
                        <CheckIcon fill="#04A584" />
                        {item.text}
                      </FlagsListItem>
                    );
                  })
                ) : (
                  <></>
                )}
              </ul>
            </FlagsList>
            <FlagsList>
              <FlagsListTitle variant="p">Red</FlagsListTitle>
              <ul>
                {nft.redFlagsList?.length ? (
                  nft.redFlagsList.map((item: IFlag, i: number) => {
                    return (
                      <FlagsListItem key={i}>
                        <CheckIcon fill="#E42736" />
                        {item.text}
                      </FlagsListItem>
                    );
                  })
                ) : (
                  <></>
                )}
              </ul>
            </FlagsList>
          </FlagsListsWrapper>
        </FlagsWrapper>
      </PageWrapper>

      <NewsWrapper>
        <CommentsTitle variant="p">News</CommentsTitle>
        <News />
      </NewsWrapper>

      <PageWrapper>
        <CommentBlock
          addComment={confirmAddComment}
          items={nft.comments ? [...newComments, ...nft.comments] : newComments}
        />
        <RatingMediaWrapper>
          <CommentsTitle variant="p">Ratings & Media</CommentsTitle>
          <RatingMediaList>
            -
            {/* <RatingMediaListItem>
              <a href="#">
                ArcBlock Rating Review
                <LinkIcon fill="#04A584" />
              </a>
            </RatingMediaListItem>
            <RatingMediaListItem>
              <a href="#">
                ArcBlock Coin Guide
                <LinkIcon fill="#04A584" />
              </a>
            </RatingMediaListItem> */}
          </RatingMediaList>
        </RatingMediaWrapper>
        {isShareModal && (
          <ShareModal
            onClose={() => setIsShareModal(false)}
            link="/nfts/minting/share/123"
          />
        )}
      </PageWrapper>
    </>
  );
};

export default Project;
