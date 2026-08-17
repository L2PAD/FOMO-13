import React from "react";
import {
  Card,
  CardTitle,
  FlagsList,
  FlagItem,
  FlagDot,
  FlagText,
  FlagsDivider,
  ParticipationCard,
  ParticipationTitle,
  ParticipationList,
} from "./styles";
import { FlagsData } from "./types";

interface SidebarFlagsProps {
  flags: FlagsData;
  participationRules: string[];
}

const SidebarFlags: React.FC<SidebarFlagsProps> = ({ flags, participationRules }) => {
  const hasFlags = flags.greenFlags.length + flags.yellowFlags.length + flags.redFlags.length > 0;
  if (!hasFlags && participationRules.length === 0) return null;

  return (
    <>
      {hasFlags && (
        <Card>
          <CardTitle>Green &amp; Red Flags</CardTitle>
          {flags.greenFlags.length > 0 && (
            <FlagsList>
              {flags.greenFlags.map((flag) => <FlagItem key={`green-${flag}`}><FlagDot variant="green" /><FlagText>{flag}</FlagText></FlagItem>)}
            </FlagsList>
          )}
          {flags.yellowFlags.length > 0 && (
            <><FlagsDivider /><FlagsList>
              {flags.yellowFlags.map((flag) => <FlagItem key={`yellow-${flag}`}><FlagDot variant="yellow" /><FlagText>{flag}</FlagText></FlagItem>)}
            </FlagsList></>
          )}
          {flags.redFlags.length > 0 && (
            <><FlagsDivider /><FlagsList>
              {flags.redFlags.map((flag) => <FlagItem key={`red-${flag}`}><FlagDot variant="red" /><FlagText>{flag}</FlagText></FlagItem>)}
            </FlagsList></>
          )}
        </Card>
      )}
      {participationRules.length > 0 && (
        <ParticipationCard>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <ParticipationTitle>Participation Rules</ParticipationTitle>
            <ParticipationList>{participationRules.map((rule) => <li key={rule}>{rule}</li>)}</ParticipationList>
          </div>
        </ParticipationCard>
      )}
    </>
  );
};

export default SidebarFlags;
