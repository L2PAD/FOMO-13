import React from "react";
import styled from "styled-components";

const CardWrapper = styled.div<{ forCompare?: boolean }>`
  background: #f5fbfd;
  border-radius: 12px;
  padding: 20px;
  width: 100%;

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const CardTitle = styled.h3`
  font-size: 24px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 8px 0;
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const Subtitle = styled.p`
  font-size: 12px;
  color: #738094;
  margin: 0 0 20px 0;
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
`;

const Label = styled.span`
  font-size: 14px;
  color: #070b35;
  min-width: max-content;
`;

const Value = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  text-align: right;
`;

const Section = styled.div`
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e6ed;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;
  margin: 0 0 10px 0;
`;

const ProjectRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;

  &:last-child {
    border-bottom: none;
  }
`;

const ProjectInfo = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
`;

const ProjectName = styled.span`
  font-size: 14px;
  color: #070b35;
`;

const ProjectTags = styled.div`
  display: flex;
  gap: 6px;
`;

const Tag = styled.span`
  font-size: 12px;
  color: #05a584;
  padding: 2px 8px;
  background: #e9f8f8;
  border-radius: 4px;
`;

const ProjectRole = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  text-align: right;
`;

const EcosystemRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
`;

const EcosystemLabel = styled.span`
  font-size: 14px;
  color: #070b35;
`;

const EcosystemValue = styled.span`
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: #070b35;

  min-width: max-content;
`;

const FooterNote = styled.p`
  font-size: 12px;
  color: #738094;
  line-height: 1.6;
`;

interface ProjectMatch {
  id: string;
  name: string;
  tags: string[];
  role: string;
}

interface ConnectedEntity {
  id: string;
  name: string;
  tags: string[];
  role: string;
}

interface EcosystemOverlap {
  trackedProjects: number;
  fundsExchanges: number;
}

interface EcosystemLink {
  id: string;
  label: string;
  value: string;
}

interface NetworkRelationsProps {
  projectMatches?: ProjectMatch[];
  connectedEntities?: ConnectedEntity[];
  ecosystemOverlap?: EcosystemOverlap;
  footerNote?: string;
  forCompare?: boolean;
  // LinkedIn Company variant props
  forLinkedIn?: boolean;
  trackingStatus?: string;
  category?: string[];
  token?: string;
  teamMembers?: { count: number; label: string };
  advisors?: { count: number; label: string };
  ecosystemLinks?: EcosystemLink[];
}

const NetworkRelations: React.FC<NetworkRelationsProps> = ({
  projectMatches = [
    {
      id: "1",
      name: "SharkRace Club",
      tags: ["NFT", "GameFi"],
      role: "Advisor since 2023",
    },
    {
      id: "2",
      name: "LayerZero Analytics",
      tags: ["Infra", "Analytics"],
      role: "Research lead 2021–2024",
    },
    {
      id: "3",
      name: "EchoScan Protocol",
      tags: ["DeFi", "L2"],
      role: "Angel investor",
    },
  ],
  connectedEntities = [
    {
      id: "1",
      name: "NightShift Capital",
      tags: ["VC Fund"],
      role: "Portfolio advisor",
    },
    {
      id: "2",
      name: "ZeroPoint Exchange",
      tags: ["CEX"],
      role: "Former listings analyst",
    },
  ],
  ecosystemOverlap = {
    trackedProjects: 3,
    fundsExchanges: 2,
  },
  footerNote = "Based on matching LinkedIn experience & advisory roles with projects and funds listed in FOMO Crypto Projects",
  forCompare = false,
  // LinkedIn Company variant props
  forLinkedIn = false,
  trackingStatus = "Listed in FOMO",
  category = ["Token", "Defi", "Repos DEX"],
  token = "$FMO",
  teamMembers = { count: 4, label: "Team members with other FOMO projects" },
  advisors = { count: 2, label: "Advisors linked to tracked funds" },
  ecosystemLinks = [
    { id: "1", label: "Backed by", value: "Backed by NightShift Capital" },
    { id: "2", label: "Launched via", value: "Launched via EchoPad" },
    { id: "3", label: "Integrated with", value: "Integrated with LayerZero" },
  ],
}) => {
  if (forCompare) {
    return (
      <CardWrapper forCompare={forCompare}>
        <Row
          style={{
            marginBottom: "20px",
          }}
        >
          <Label>Tracked projects linked to this profile</Label>
          <Value>{ecosystemOverlap.trackedProjects}</Value>
        </Row>
        <Row>
          <Label>Funds/exchanges in common with FOMO</Label>
          <Value>{ecosystemOverlap.fundsExchanges}</Value>
        </Row>
      </CardWrapper>
    );
  }

  if (forLinkedIn) {
    return (
      <CardWrapper forCompare={forCompare}>
        <CardTitle>Network & Relations</CardTitle>
        <Subtitle>
          Tracking status & links overlaps with the FOMO ecosystem.
        </Subtitle>

        <Section>
          <SectionTitle>Tracking Status</SectionTitle>
          <Row style={{ marginTop: "10px" }}>
            <Label>Listed in FOMO</Label>
            <Value style={{ color: "#05a584" }}>Tracked</Value>
          </Row>
          <Row style={{ marginTop: "10px" }}>
            <Label>Category</Label>
            <ProjectTags>
              {category.map((cat, index) => (
                <Tag key={index}>{cat}</Tag>
              ))}
            </ProjectTags>
          </Row>
          <Row style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Label>Token</Label>
            <Value>{token}</Value>
          </Row>
        </Section>

        <Section>
          <SectionTitle>Team & Advisors in FOMO</SectionTitle>
          <EcosystemRow>
            <EcosystemLabel>{teamMembers.label}</EcosystemLabel>
            <EcosystemValue>{teamMembers.count} profiles</EcosystemValue>
          </EcosystemRow>
          <EcosystemRow>
            <EcosystemLabel>{advisors.label}</EcosystemLabel>
            <EcosystemValue>{advisors.count} advisors</EcosystemValue>
          </EcosystemRow>
          <FooterNote>{footerNote}</FooterNote>
        </Section>

        <Section
          style={{
            borderBottom: 0,
          }}
        >
          <SectionTitle>Ecosystem Links</SectionTitle>
          {ecosystemLinks.map((link) => (
            <Tag key={link.id}>{link.value}</Tag>
          ))}
          <FooterNote style={{ marginTop: "10px" }}>
            Shows how this project is connected to other entities already
            monitored in FOMO.
          </FooterNote>
        </Section>
      </CardWrapper>
    );
  }

  return (
    <CardWrapper forCompare={forCompare}>
      <CardTitle>Network & Relations</CardTitle>
      <Subtitle>Where this profile overlaps with the FOMO ecosystem.</Subtitle>

      <Section>
        <SectionTitle>FOMO Project Matches</SectionTitle>
        {projectMatches.map((project) => (
          <ProjectRow key={project.id}>
            <ProjectInfo>
              <ProjectName>{project.name}</ProjectName>
              <ProjectTags>
                {project.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </ProjectTags>
            </ProjectInfo>
            <ProjectRole>{project.role}</ProjectRole>
          </ProjectRow>
        ))}
      </Section>

      <Section>
        <SectionTitle>Connected FOMO Entities</SectionTitle>
        {connectedEntities.map((entity) => (
          <ProjectRow key={entity.id}>
            <ProjectInfo>
              <ProjectName>{entity.name}</ProjectName>
              <ProjectTags>
                {entity.tags.map((tag, index) => (
                  <Tag key={index}>{tag}</Tag>
                ))}
              </ProjectTags>
            </ProjectInfo>
            <ProjectRole>{entity.role}</ProjectRole>
          </ProjectRow>
        ))}
      </Section>

      <Section
        style={{
          borderBottom: 0,
        }}
      >
        <SectionTitle>Ecosystem Overlap</SectionTitle>
        <EcosystemRow>
          <EcosystemLabel>
            Tracked projects linked to this profile
          </EcosystemLabel>
          <EcosystemValue>{ecosystemOverlap.trackedProjects}</EcosystemValue>
        </EcosystemRow>
        <EcosystemRow>
          <EcosystemLabel>Funds/exchanges in common with FOMO</EcosystemLabel>
          <EcosystemValue>{ecosystemOverlap.fundsExchanges}</EcosystemValue>
        </EcosystemRow>
        <FooterNote>{footerNote}</FooterNote>
      </Section>
    </CardWrapper>
  );
};

export default NetworkRelations;
