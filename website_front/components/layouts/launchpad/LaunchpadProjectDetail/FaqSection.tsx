import React from "react";
import {
  Card,
  CardTitle,
  FaqContent,
  FaqItemWrapper,
  FaqDivider,
  FaqQuestion,
  FaqQuestionText,
  FaqAnswer,
  FaqChevron,
  RiskNotice,
  RiskNoticeInner,
  RiskNoticeContent,
  RiskNoticeTitle,
  RiskNoticeText,
} from "./styles";
import { FaqItem } from "./types";
import { IconAlert, IconChevronUp, IconChevronDown } from "../../../global/Icons/Launchpad/icons";

interface FaqCardProps {
  items: FaqItem[];
  openId: string | null;
  onToggle: (id: string) => void;
}

export const FaqCard: React.FC<FaqCardProps> = ({ items, openId, onToggle }) => (
  <Card>
    <CardTitle>Frequently Asked Questions</CardTitle>
    <FaqContent>
      {items.map((item, index) => (
        <FaqItemWrapper key={item.id}>
          {index > 0 && <FaqDivider style={{ marginBottom: 20 }} />}
          <FaqQuestion onClick={() => onToggle(item.id)} style={{ cursor: "pointer" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
              <FaqQuestionText>{item.question}</FaqQuestionText>
              {openId === item.id && item.answer && (
                <FaqAnswer>{item.answer}</FaqAnswer>
              )}
            </div>
            <FaqChevron>
              {openId === item.id ? <IconChevronUp /> : <IconChevronDown />}
            </FaqChevron>
          </FaqQuestion>
        </FaqItemWrapper>
      ))}
      <FaqDivider />
    </FaqContent>
  </Card>
);

export const RiskNoticeCard: React.FC = () => (
  <RiskNotice>
    <RiskNoticeInner>
      <IconAlert />
      <RiskNoticeContent>
        <RiskNoticeTitle>Risk Notice</RiskNoticeTitle>
        <RiskNoticeText>
          Participating in token sales involves significant risk. The value of tokens can fluctuate, and you may
          lose some or all of your investment. Do your own research before participating. This is not financial
          advice.
        </RiskNoticeText>
      </RiskNoticeContent>
    </RiskNoticeInner>
  </RiskNotice>
);
