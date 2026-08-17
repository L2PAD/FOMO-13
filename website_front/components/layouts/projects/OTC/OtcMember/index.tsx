import React, { FC, useState } from "react";
import Image from "next/image";
import OtcComment from "../../../../global/common/OtcComment";
import { IMember, IOtcMember } from "../../../../../types/global_types";
import OtcLike from "../../../../global/Icons/OtcLike";
import OtcDislike from "../../../../global/Icons/OtcDislike";
import RedFlag from "../../../../global/RedFlag";
import BuyIcon from "../../../../../assets/icons/otc/member-item.svg";
import { ShareIcon, StarIcon } from "../../../../global/Icons";
import { DefaultActionWrapper, RatingWrapper } from "../DealsList/styles";
import UserBadges from "../../../../global/UserBadges";
import {
  CommentText,
  DealActions,
  DealColumn,
  DealDetails,
  DealDetailsItem,
  DealIconWrapper,
  DealInfo,
  DealName,
  Wrapper,
  DealRightColumn,
  DealRightHeader,
} from "./styles";
import { Overflow } from "../../../../global/common/BarDoubleChart/styles";
import { BadgesRow } from "../../../gemslab/Profile/styles";
import { icons } from "../../../../global/common/SocialLinks";
import { Button } from "../../../../global/common/Button";
import { ShareWrapper } from "../Market/styles";
import ContactWithPerson from "../../modals/ContactWithPersonModal";
import { RankIcon, RankIconProps } from "../TopMembers/RankIcons";
import { DealHighlightWrapper, DealRealAssetWrapper, ShareDescriptionWrapper } from "../DealItem/styles";
import DescriptionComponent from "../../../../global/common/DescriptionComponent";
import { sanitizedHtml } from "../../../../../helpers/sanitizeHtml";

interface IProps {
  item: IOtcMember;
  onShare: (member: IOtcMember) => void
}


interface MemberStats {
  totalUsdcSales: number;
  totalEthSales: number;
  totalUsdcPurchases: number;
  totalEthPurchases: number;
  ethToUsdcRate: number;
}

function calculateRank({
  totalUsdcSales,
  totalEthSales,
  totalUsdcPurchases,
  totalEthPurchases,
  ethToUsdcRate,
}: MemberStats): RankIconProps['rank'] {
  const totalSalesInUsdc = totalUsdcSales + totalEthSales * ethToUsdcRate;
  const totalPurchasesInUsdc =
    totalUsdcPurchases + totalEthPurchases * ethToUsdcRate;

  const value = (totalPurchasesInUsdc + totalSalesInUsdc) / 100_000;

  if (value < 1) {
    return 1;
  }
  if (value < 10) {
    return 2;
  }
  if (value < 75) {
    return 3;
  }
  if (value < 200) {
    return 4;
  }
  if (value < 1000) {
    return 5;
  }
  if (value < 5000) {
    return 6;
  }
  return 1;
}

const formatLastDeal = (value?: string | Date | null): string => {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  return parsedDate.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const OtcMember: FC<IProps> = ({ item, onShare }) => {
  const [isOpen, setContactModal] = useState<boolean>(false);
  const [contactData, setContactData] = useState<any>(null);
  const [isShareHover, setIsShareHover] = useState<boolean>(false)
  const lastDealDate = formatLastDeal(item.lastDeal);
  const isVerified = !!item?.user?.verificationStatus;

  return (
    <DealHighlightWrapper id={`item-${item._id}`}>
      <Wrapper>
        <DealColumn>
          <OtcComment type="top-member" member={item} />
          <DealInfo>
            <DealName />
            <CommentText className="comment-text">
              <span>Bio: </span>
              <br />
              <div dangerouslySetInnerHTML={sanitizedHtml(item.user?.bio || '-')}>

              </div>
            </CommentText>
            <DealActions>
              <button>
                <OtcLike
                  status={
                    Number(item?.user?.reviewLikes?.length) > 0
                      ? "active"
                      : "default"
                  }
                />
                <span>{item?.user?.reviewLikes?.length || 0}</span>
              </button>
              <button>
                <OtcDislike
                  status={
                    Number(item?.user?.reviewDislikes?.length) > 0
                      ? "active"
                      : "default"
                  }
                />
                <span>{item?.user?.reviewDislikes?.length || 0}</span>
              </button>
            </DealActions>
          </DealInfo>
        </DealColumn>

        <DealIconWrapper>
          <Image src={BuyIcon} alt="buy" />
        </DealIconWrapper>

        <DealDetails>
          {Array.isArray((item.user as any)?.badges) && (item.user as any).badges.length > 0 && (
            <BadgesRow>
              <UserBadges badges={(item.user as any).badges} size={36} max={6} />
            </BadgesRow>
          )}
          <DealDetailsItem>
            <span>Risks:</span>
            <div>{item.user.risk}</div>
          </DealDetailsItem>
          <DealDetailsItem>
            <span>Completed deals:</span>
            <div>{item.deals.length}</div>
          </DealDetailsItem>
          <DealDetailsItem>
            <span>Sales:</span>
            <div>{item.totalSales}</div>
          </DealDetailsItem>
          <DealDetailsItem>
            <span>Purchases:</span>
            <div>{item.totalPurchases}</div>
          </DealDetailsItem>
          <DealDetailsItem>
            <span>Last Deal:</span>
            <div>{lastDealDate}</div>
          </DealDetailsItem>
        </DealDetails>
        <DealRightColumn>
          <DealRightHeader>
            <div className={`member-status ${isVerified ? "verified" : "not-verified"}`}>
              {isVerified ? "Verified" : "Not verified"}
            </div>
            <DefaultActionWrapper>
              <span>
                <div className="emoji">
                  {
                    (() => {
                      const value = calculateRank({
                        totalUsdcSales: item.totalUsdcSales,
                        totalEthSales: item.totalEthSales,
                        totalUsdcPurchases: item.totalUsdcPurchases,
                        totalEthPurchases: item.totalEthPurchases,
                        ethToUsdcRate: 1,
                      });
                      return <RankIcon rank={value} />;
                    })()
                  }
                </div>
                <DealRealAssetWrapper>
                  <ShareWrapper
                    onMouseEnter={() => setIsShareHover(true)}
                    onMouseLeave={() => setIsShareHover(false)}
                    onClick={() => onShare(item)}>
                    <ShareIcon fill="#04A584" />
                  </ShareWrapper>
                  <ShareDescriptionWrapper isVisible={isShareHover}>
                    <DescriptionComponent
                      className='risk'
                      isVisible={isShareHover}
                      date={new Date()}
                      isDate={false}
                      text={'Share this member profile'}
                    />
                  </ShareDescriptionWrapper>
                </DealRealAssetWrapper>
              </span>
            </DefaultActionWrapper>
            <DefaultActionWrapper>
              <span>
                <RatingWrapper>
                  <StarIcon fill="#FFC702" />
                  {item.user.rating || 0}/100
                </RatingWrapper>
                <RedFlag count={item.user?.redFlags || 0} />
              </span>
            </DefaultActionWrapper>
            <div className="links">
              <a
                id="link"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://t.me/${item.user.telegramData?.username}`}
              >
                {icons.tg}
              </a>
              <a
                id="link"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://discord.com/users/${item.user.discordData?.id}`}
              >
                {icons.ds}
              </a>
              <a
                id="link"
                target="_blank"
                rel="noopener noreferrer"
                href={`https://twitter.com/${item.user.twitterData?.username}`}
              >
                {icons.x}
              </a>
            </div>
          </DealRightHeader>
        </DealRightColumn>
      </Wrapper>
    </DealHighlightWrapper>
  );
};

export default OtcMember;
