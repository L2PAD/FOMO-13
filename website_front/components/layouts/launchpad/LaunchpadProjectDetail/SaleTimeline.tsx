import React from "react";
import {
  Card,
  CardTitle,
  TimelineStepsRow,
  TimelineStep,
  TimelineIconCircle,
  TimelineDoneBadge,
  TimelineInfo,
  TimelineStepTitle,
  TimelineStepDesc,
  TimelineVariant,
  TimelineConnector,
  TabsRow,
  Tab,
} from "./styles";
import { LaunchpadProjectDetailData, TabVariant, TimelineStep as TimelineStepData } from "./types";
import { IconLayers, IconCart, IconGift } from "../../../global/Icons/Launchpad/icons";

interface SaleTimelineProps {
  project: LaunchpadProjectDetailData;
  activeTimelineIndex: number;
  onTimelineClick: (index: number) => void;
  activeTab: TabVariant;
  onTabChange: (tab: TabVariant) => void;
}

const getStepVariant = (step: TimelineStepData): TimelineVariant => {
  if (step.isDone) return "done";
  if (step.isActive) return "active";
  return "inactive";
};

const getTimelineIcon = (icon: string, variant: TimelineVariant) => {
  const color = variant === "inactive" ? "#728094" : "white";
  if (icon === "layers") return <IconLayers color={color} />;
  if (icon === "cart") return <IconCart color={color} />;
  return <IconGift color={color} />;
};

const SaleTimeline: React.FC<SaleTimelineProps> = ({
  project,
  activeTimelineIndex,
  onTimelineClick,
  activeTab,
  onTabChange,
}) => (
  <>
    <Card style={{ marginBottom: 40 }}>
      <CardTitle style={{ fontSize: 24, lineHeight: "30px" }}>Sale Timeline</CardTitle>
      <TimelineStepsRow>
        {project.saleTimeline.map((step, index) => {
          const variant = getStepVariant(step);
          return (
            <React.Fragment key={step.id}>
              <TimelineStep variant={variant}>
                <TimelineIconCircle variant={variant}>
                  {getTimelineIcon(step.icon, variant)}
                  {variant === "done" && (
                    <TimelineDoneBadge>
                      <svg viewBox="0 0 24 24" fill="none" width={24} height={24}>
                        <circle cx="12" cy="12" r="11" fill="#05a584" stroke="white" strokeWidth="1" />
                        <path d="M7 12.5l3.5 3.5 6.5-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </TimelineDoneBadge>
                  )}
                </TimelineIconCircle>
                <TimelineInfo variant={variant}>
                  <TimelineStepTitle variant={variant}>{step.label}</TimelineStepTitle>
                  <TimelineStepDesc variant={variant}>
                    {step.descriptionLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </TimelineStepDesc>
                </TimelineInfo>
              </TimelineStep>
              {index < project.saleTimeline.length - 1 && <TimelineConnector />}
            </React.Fragment>
          );
        })}
      </TimelineStepsRow>
    </Card>

    <TabsRow>
      <Tab isActive={activeTab === "details"} onClick={() => onTabChange("details")}>
        <p>Project Details</p>
      </Tab>
      <Tab isActive={activeTab === "ido"} onClick={() => onTabChange("ido")}>
        <p>IDO Details</p>
      </Tab>
      {project.display.showLeaderboard && (
        <Tab isActive={activeTab === "leaderboard"} onClick={() => onTabChange("leaderboard")}>
          <p>Leaderboard</p>
        </Tab>
      )}
    </TabsRow>
  </>
);

export default SaleTimeline;
