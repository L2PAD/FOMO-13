import React, { useState } from "react";
import {
  HeaderCard,
  HeaderLeft,
  HeaderTopRow,
  ProjectIdentity,
  ProjectLogo,
  ProjectMeta,
  TitleRow,
  ProjectName,
  CategoryText,
  DescriptionText,
  SocialLinksRow,
  SocialIcon,
  HeaderRight,
  StatsRow,
  StatItem,
  StatValue,
  StatLabel,
  StatusBadge,
} from "./styles";
import { LaunchpadProjectDetailData } from "./types";
import {
  IconGlobe,
  IconTwitter,
  IconTelegram,
  IconDiscord,
  IconLink,
} from "../../../global/Icons/Launchpad/icons";

interface ProjectHeaderProps {
  project: LaunchpadProjectDetailData;
}

const DESCRIPTION_LIMIT = 160;

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  const [expanded, setExpanded] = useState(false);

  const isLong = project.description.length > DESCRIPTION_LIMIT;
  const displayedText =
    isLong && !expanded
      ? project.description.slice(0, DESCRIPTION_LIMIT).trimEnd() + "..."
      : project.description;

  return (
    <HeaderCard>
      <HeaderLeft>
        <HeaderTopRow>
          <ProjectIdentity>
            <ProjectLogo>
              {project.logo ? <img src={project.logo} alt={project.name} /> : null}
            </ProjectLogo>
            <ProjectMeta>
              <TitleRow>
                <ProjectName>{project.name}</ProjectName>
                <StatusBadge variant="yellow">{project.statusBadge}</StatusBadge>
                <StatusBadge variant="gray">{project.typeBadge}</StatusBadge>
              </TitleRow>
              <CategoryText>{project.category}</CategoryText>
            </ProjectMeta>
          </ProjectIdentity>
          <DescriptionText>
            {displayedText}{" "}
            {isLong && (
              <span className="see-more" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "See less" : "See more"}
              </span>
            )}
          </DescriptionText>
        </HeaderTopRow>
        <SocialLinksRow>
          {project.socialLinks.website && (
            <SocialIcon href={project.socialLinks.website} target="_blank" rel="noopener noreferrer">
              <IconGlobe />
            </SocialIcon>
          )}
          {project.socialLinks.twitter && (
            <SocialIcon href={project.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
              <IconTwitter />
            </SocialIcon>
          )}
          {project.socialLinks.telegram && (
            <SocialIcon href={project.socialLinks.telegram} target="_blank" rel="noopener noreferrer">
              <IconTelegram />
            </SocialIcon>
          )}
          {project.socialLinks.discord && (
            <SocialIcon href={project.socialLinks.discord} target="_blank" rel="noopener noreferrer">
              <IconDiscord />
            </SocialIcon>
          )}
          {project.socialLinks.whitepaper && (
            <SocialIcon href={project.socialLinks.whitepaper} target="_blank" rel="noopener noreferrer" style={{ width: 24, height: 24 }}>
              <IconLink />
            </SocialIcon>
          )}
        </SocialLinksRow>
      </HeaderLeft>
      <HeaderRight>
        <StatsRow>
          <StatItem>
            <StatValue>{project.totalRaised}</StatValue>
            <StatLabel>Total Raised</StatLabel>
          </StatItem>
          <StatItem>
            <StatValue>{project.tokenPrice}</StatValue>
            <StatLabel>Token Price</StatLabel>
          </StatItem>
          {project.display.showParticipants && (
            <StatItem>
              <StatValue>{project.participants}</StatValue>
              <StatLabel>Participants</StatLabel>
            </StatItem>
          )}
        </StatsRow>
      </HeaderRight>
    </HeaderCard>
  );
};

export default ProjectHeader;
