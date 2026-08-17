import Image from "next/image";
import moment from "moment";
import { StarIcon } from "../../../Icons";
import OtcLike from "../../../../../assets/icons/otc/like-active.svg";
import UserAvatar from "../../UserAvatar";
import { simplifyAmount } from "../../../../../helpers/simplifyAmount";
import { clarifyAmount } from "../../../../../helpers/clarifyAmount";
import changeDateType from "../../../../../helpers/changeDateType";
import RedFlag from "../../../RedFlag";
import FomoScore from "../../../FomoScore";
import {
  ProgressBar,
  ProjectData,
  UpDownWrapper,
} from "../../UniversalTableRow/styles";
import imageLoader from "../../../../../helpers/imageLoader";
import SocialLinks from "../../SocialLinks";
import {
  LikeWrapper,
  StageWrapper,
  Actions,
  PricePercentChange,
  PriceWrapper,
  UnlockingActionButton,
  UnlockProgressBar,
  UnlockProgressWrapper,
} from "../styles";
import UsersRow from "../../../UsersRow";
import StatusTag from "../../../StatusTag";
import EngagementBadge from "../../../EngagementBadge";
import PercentValue from "../../PercentValue";
import {
  DealStatus,
  ISocialMediaItem,
} from "../../../../../types/global_types";
import { getServiceByUrl } from "../../../../../helpers/getServiceKeyByUrl";
import TablePriceChart from "../../../TablePriceChart";
import sliceAddress from "../../../../../helpers/sliceAddress";
import upperCaseFirstLetter from "../../../../../helpers/upperCaseFirstLetter";
import EntityInfo from "../../EntityInfo";
import ScoreProgress from "../../ScoreBar";
import FollowersDisplay from "../../../../layouts/projects/Connection/FollowersDisplay";
import { TableTypes } from "../types";
import type { ICustomTableColumn } from "../types";
import HighlightedText from "../../../HighlightedText";

export interface UniversalTableCaseProps {
  item: any;
  type: TableTypes;
  customColumns?: Array<ICustomTableColumn>;
  userData?: any;
  searchValue?: string;
  onFollowersClick?: (
    type: "followers" | "following",
    data: any[],
    accountName: string
  ) => void;
  onFundingFeedInvestorsClick?: (investors: any[], round: any) => void;
  onBackerProjectsClick?: (backer: any) => void;
}

export const formatPriceChangePercent = (value?: number | string | null) => {
  const percent = Number(value || 0);

  if (!Number.isFinite(percent)) return "--";

  const absolutePercent = Math.abs(percent);

  if (absolutePercent > 9999) {
    return percent < 0 ? "<-9999%" : ">9999%";
  }

  if (absolutePercent > 0 && absolutePercent < 0.01) {
    return `${percent < 0 ? "-" : ""}<0.01%`;
  }

  return `${percent.toFixed(2)}%`;
};

export const formatPercent = formatPriceChangePercent;

export const PriceChangeCell = ({
  value,
}: {
  value?: number | string | null;
}) => {
  const percent = Number(value);

  if (!Number.isFinite(percent) || percent === 0) {
    return <div>--</div>;
  }

  return (
    <UpDownWrapper type={percent > 0 ? "up" : "down"}>
      {formatPriceChangePercent(percent)}
    </UpDownWrapper>
  );
};

export const getProjectSymbol = (item: any): string => {
  return String(item?.symbol || item?.ticker || item?.niche || "")
    .trim()
    .toUpperCase();
};

export const getCirculatingSupplyProgress = (item: any): number => {
  const maxSupply = Number(item?.maxSupply || 0);
  if (!Number.isFinite(maxSupply) || maxSupply <= 0) return 0;

  const progress = Number(item?.circulatingSupplyPercent || 0);
  if (!Number.isFinite(progress)) return 0;

  return Math.max(0, Math.min(100, progress));
};

export const getDealStatus = (status: DealStatus): string => {
  switch (status) {
    case "waiting":
      return "Pending";
    case "started":
      return "Pending";
    case "blocked":
      return "Pending";
    case "forced-termination":
      return "Cancelled";
    case "ended":
      return "Completed";
    default:
      return "-";
  }
};

export {
  Actions,
  changeDateType,
  clarifyAmount,
  EngagementBadge,
  EntityInfo,
  FollowersDisplay,
  FomoScore,
  getServiceByUrl,
  HighlightedText,
  Image,
  imageLoader,
  LikeWrapper,
  moment,
  OtcLike,
  PercentValue,
  PricePercentChange,
  PriceWrapper,
  ProgressBar,
  ProjectData,
  RedFlag,
  ScoreProgress,
  simplifyAmount,
  sliceAddress,
  SocialLinks,
  StageWrapper,
  StarIcon,
  StatusTag,
  TablePriceChart,
  UpDownWrapper,
  UnlockingActionButton,
  UnlockProgressBar,
  UnlockProgressWrapper,
  upperCaseFirstLetter,
  UserAvatar,
  UsersRow,
};

export type { ISocialMediaItem };
