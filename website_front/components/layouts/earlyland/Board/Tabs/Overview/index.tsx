import React from "react";
import {
  OverviewLeftWrapper,
  OverviewRatingWrapper,
  OverviewTabWrapper,
  TabTitle,
} from "../../styles";

const OverviewTab = () => {
  return (
    <OverviewTabWrapper>
      <OverviewLeftWrapper>
        <TabTitle>NFD’s team review:</TabTitle>
        <p>
          The Contributor Program is a community incentive program designed to
          encourage community members of different backgrounds and skillsets to
          steward and take ownership of key aspects of the ecosystem.
          Participants of the program will be given points based on the quality
          of their contributions to the ecosystem using evaluation criteria
          developed by existing leaders in the community.
          <br />
          <br />
          When the NEXT token goes live, the project plans to submit a proposal
          to the Connext DAO to retroactively reward participants proportional
          to points received.
          <br />
          <br />
          The program starts on the 20th of April 2022. Phase One of the program
          will run until the NEXT token launches. After the token and DAO are
          live, the taem expects to continue with further phases of the program.
          <br />
          <br />
          Program Structure The program consists of 5 Tracks that are operated
          by Track Operators; experienced leaders within the community that are
          not part of the core team:
        </p>
      </OverviewLeftWrapper>
      <div>
        <TabTitle>Rating</TabTitle>
        <OverviewRatingWrapper>94</OverviewRatingWrapper>
      </div>
    </OverviewTabWrapper>
  );
};

export default OverviewTab;
