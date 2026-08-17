import React from "react";
import {
  AdPopover,
  AdPopoverHeader,
  AdPopoverTitle,
  AdPopoverStatusBadge,
  AdPopoverDivider,
  AdPopoverRows,
  AdPopoverRow,
  AdPopoverLabel,
  AdPopoverValue,
  AdPopoverProgressSection,
  AdPopoverProgressHeader,
  AdPopoverProgressLabel,
  AdPopoverProgressValue,
  AdPopoverProgressTrack,
  AdPopoverProgressFill,
  AdPopoverDescription,
  AdPopoverProjectRow,
  AdPopoverProjectAvatar,
  AdPopoverProjectAvatarFallback,
  AdPopoverProjectDetails,
  AdPopoverProjectName,
  AdPopoverProjectCategories,
  AdPopoverButton,
} from "./styles";

interface AdBannerPopoverProps {
  title: string;
  status: string;
  dealType: string;
  project: string;
  allocation: string;
  tokenPrice: string;
  created: string;
  promotedUntil: string;
  fundingPercent: number;
  description: string;
  projectAvatarSrc?: string;
  projectName: string;
  projectCategories: string;
  onJoinClick?: () => void;
}

const AdBannerPopover: React.FC<AdBannerPopoverProps> = ({
  title,
  status,
  dealType,
  project,
  allocation,
  tokenPrice,
  created,
  promotedUntil,
  fundingPercent,
  description,
  projectAvatarSrc,
  projectName,
  projectCategories,
  onJoinClick,
}) => {
  return (
    <AdPopover>
      <AdPopoverHeader>
        <AdPopoverTitle>{title}</AdPopoverTitle>
        <AdPopoverStatusBadge>{status}</AdPopoverStatusBadge>
      </AdPopoverHeader>

      <AdPopoverDivider />

      <AdPopoverRows>
        <AdPopoverRow>
          <AdPopoverLabel>Deal Type:</AdPopoverLabel>
          <AdPopoverValue>{dealType}</AdPopoverValue>
        </AdPopoverRow>
        <AdPopoverRow>
          <AdPopoverLabel>Project:</AdPopoverLabel>
          <AdPopoverValue>{project}</AdPopoverValue>
        </AdPopoverRow>
        <AdPopoverRow>
          <AdPopoverLabel>Allocation:</AdPopoverLabel>
          <AdPopoverValue>{allocation}</AdPopoverValue>
        </AdPopoverRow>
        <AdPopoverRow>
          <AdPopoverLabel>Token Price:</AdPopoverLabel>
          <AdPopoverValue>{tokenPrice}</AdPopoverValue>
        </AdPopoverRow>
        <AdPopoverRow>
          <AdPopoverLabel>Created:</AdPopoverLabel>
          <AdPopoverValue>{created}</AdPopoverValue>
        </AdPopoverRow>
        <AdPopoverRow>
          <AdPopoverLabel>Promoted until:</AdPopoverLabel>
          <AdPopoverValue>{promotedUntil}</AdPopoverValue>
        </AdPopoverRow>
      </AdPopoverRows>

      <AdPopoverProgressSection>
        <AdPopoverProgressHeader>
          <AdPopoverProgressLabel>Funding Progress</AdPopoverProgressLabel>
          <AdPopoverProgressValue>{fundingPercent}%</AdPopoverProgressValue>
        </AdPopoverProgressHeader>
        <AdPopoverProgressTrack>
          <AdPopoverProgressFill $percent={fundingPercent} />
        </AdPopoverProgressTrack>
      </AdPopoverProgressSection>

      <AdPopoverDivider />

      <AdPopoverDescription>
        <strong>Description: </strong>
        {description}
      </AdPopoverDescription>

      <AdPopoverDivider />

      <AdPopoverProjectRow>
        {projectAvatarSrc ? (
          <AdPopoverProjectAvatar src={projectAvatarSrc} alt={projectName} />
        ) : (
          <AdPopoverProjectAvatarFallback>
            {projectName.slice(0, 1).toUpperCase()}
          </AdPopoverProjectAvatarFallback>
        )}
        <AdPopoverProjectDetails>
          <AdPopoverProjectName>{projectName}</AdPopoverProjectName>
          <AdPopoverProjectCategories>{projectCategories}</AdPopoverProjectCategories>
        </AdPopoverProjectDetails>
      </AdPopoverProjectRow>

      <AdPopoverDivider />

      <AdPopoverButton onClick={onJoinClick}>
        Join Launch &rarr;
      </AdPopoverButton>
    </AdPopover>
  );
};

export default AdBannerPopover;
