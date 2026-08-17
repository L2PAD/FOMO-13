import React from "react";
import {
  Card,
  CardTitle,
  AboutInfoBar,
  AboutInfoItem,
  AboutInfoLabel,
  AboutInfoValue,
  ProblemSolutionRow,
  ProblemSolutionCard,
  ProblemSolutionHeader,
  ProblemSolutionTitle,
  ProblemSolutionText,
  InvestorsGrid,
  InvestorItem,
  InvestorLogo,
  InvestorName,
  TeamRow,
  TeamCard,
  TeamAvatar,
  TeamInfo,
  TeamName,
  TeamRole,
  SectionContentText,
} from "./styles";
import { LaunchpadProjectDetailData } from "./types";
import { IconBullish, IconAlertSmall, IconTarget } from "../../../global/Icons/Launchpad/icons";
import { FaqCard, RiskNoticeCard } from "./FaqSection";

interface DetailsTabProps {
  project: LaunchpadProjectDetailData;
  openFaqId: string | null;
  onFaqToggle: (id: string) => void;
}

const DetailsTab: React.FC<DetailsTabProps> = ({ project, openFaqId, onFaqToggle }) => (
  <>
    <Card>
      <CardTitle>About</CardTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
        <SectionContentText>
          <strong style={{ color: "#05a584" }}>{project.name}</strong>
          {" "}
          {project.aboutText}
        </SectionContentText>
      </div>
      <AboutInfoBar>
        <AboutInfoItem>
          <IconBullish />
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <AboutInfoLabel>Total Raised:</AboutInfoLabel>
            <AboutInfoValue>{project.aboutTotalRaised}</AboutInfoValue>
          </div>
        </AboutInfoItem>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <AboutInfoLabel>Type:</AboutInfoLabel>
          <AboutInfoValue>{project.aboutFundingType}</AboutInfoValue>
        </div>
      </AboutInfoBar>
    </Card>

    <ProblemSolutionRow>
      <ProblemSolutionCard>
        <ProblemSolutionHeader>
          <IconAlertSmall />
          <ProblemSolutionTitle>Problem</ProblemSolutionTitle>
        </ProblemSolutionHeader>
        <ProblemSolutionText>{project.problem}</ProblemSolutionText>
      </ProblemSolutionCard>
      <ProblemSolutionCard>
        <ProblemSolutionHeader>
          <IconTarget />
          <ProblemSolutionTitle>Solution</ProblemSolutionTitle>
        </ProblemSolutionHeader>
        <ProblemSolutionText>{project.solution}</ProblemSolutionText>
      </ProblemSolutionCard>
    </ProblemSolutionRow>

    <Card>
      <CardTitle>Token Utility</CardTitle>
      <SectionContentText>{project.tokenUtility}</SectionContentText>
    </Card>

    {project.investors.length > 0 && (
      <Card>
        <CardTitle>Investors</CardTitle>
        <InvestorsGrid>
          {project.investors.map((investor) => (
            <InvestorItem key={investor.id}>
              <InvestorLogo>
                {investor.logo ? <img src={investor.logo} alt={investor.name} /> : null}
              </InvestorLogo>
              <InvestorName>{investor.name}</InvestorName>
            </InvestorItem>
          ))}
        </InvestorsGrid>
      </Card>
    )}

    {project.team.length > 0 && (
      <Card>
        <CardTitle>Team</CardTitle>
        <TeamRow>
          {project.team.map((member) => (
            <TeamCard key={member.id}>
              <TeamAvatar>
                {member.avatar ? <img src={member.avatar} alt={member.name} /> : null}
              </TeamAvatar>
              <TeamInfo>
                <TeamName>{member.name}</TeamName>
                <TeamRole>{member.role}</TeamRole>
              </TeamInfo>
            </TeamCard>
          ))}
        </TeamRow>
      </Card>
    )}

    <Card>
      <CardTitle>Revenue Model</CardTitle>
      <SectionContentText>{project.revenueModel}</SectionContentText>
    </Card>

    <FaqCard items={project.faq} openId={openFaqId} onToggle={onFaqToggle} />
    <RiskNoticeCard />
  </>
);

export default DetailsTab;
