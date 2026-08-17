import React, { useState } from "react";
import Rollup from "../../../../../global/common/Rollup";
import {
  ProgressHeaderWrapper,
  ProgressWrapper,
  RollupContentWrapper,
  RollupHelpButton,
  RollupNextButton,
} from "../../../Compendium/Project/styles";
import { AskIcon } from "../../../../../global/Icons";
import { TabTitle } from "../../styles";
import { ProgressBar } from "../../../../../global/common/UniversalTableRow/styles";
// import {ProgressBar} from '../../../../../global/CryptoMarketTable/table_row/styles';

const StagesTab = () => {
  const [doneStages, setDoneStages] = useState(0);

  return (
    <>
      <TabTitle>How to participate</TabTitle>
      <Rollup
        title="Community Leadership"
        progress={doneStages >= 1 ? 1 : 0}
        isDone={doneStages >= 1}
        maxProgress={1}
        onChange={() => setDoneStages(1)}
      >
        <RollupContentWrapper>
          <p>
            The Contributor Program is a community incentive program designed to
            encourage community members of different backgrounds and skillsets
            to steward and take ownership of key aspects of the ecosystem.
            Participants of the program will be given points based on the
            quality of their contributions to the ecosystem using evaluation
            criteria developed by existing leaders in the community.
          </p>
          <div>
            <RollupHelpButton>
              <AskIcon fill="#00C099" />
              Need some help?
            </RollupHelpButton>
            <RollupNextButton
              isDone={doneStages >= 1}
              disabled={doneStages >= 1}
              onClick={() => setDoneStages(1)}
            >
              Next step
            </RollupNextButton>
          </div>
        </RollupContentWrapper>
      </Rollup>
      <Rollup
        title="Community Leadership"
        progress={doneStages >= 2 ? 1 : 0}
        isDone={doneStages >= 2}
        maxProgress={1}
        onChange={() => setDoneStages(2)}
      >
        <RollupContentWrapper>
          <p>
            The Contributor Program is a community incentive program designed to
            encourage community members of different backgrounds and skillsets
            to steward and take ownership of key aspects of the ecosystem.
            Participants of the program will be given points based on the
            quality of their contributions to the ecosystem using evaluation
            criteria developed by existing leaders in the community.
          </p>
          <div>
            <RollupHelpButton>
              <AskIcon fill="#00C099" />
              Need some help?
            </RollupHelpButton>
            <RollupNextButton
              isDone={doneStages >= 2}
              disabled={doneStages >= 2}
              onClick={() => setDoneStages(2)}
            >
              Next step
            </RollupNextButton>
          </div>
        </RollupContentWrapper>
      </Rollup>
      <Rollup
        title="Community Leadership"
        progress={doneStages >= 3 ? 1 : 0}
        isDone={doneStages >= 3}
        maxProgress={1}
        onChange={() => setDoneStages(3)}
      >
        <RollupContentWrapper>
          <p>
            The Contributor Program is a community incentive program designed to
            encourage community members of different backgrounds and skillsets
            to steward and take ownership of key aspects of the ecosystem.
            Participants of the program will be given points based on the
            quality of their contributions to the ecosystem using evaluation
            criteria developed by existing leaders in the community.
          </p>
          <div>
            <RollupHelpButton>
              <AskIcon fill="#00C099" />
              Need some help?
            </RollupHelpButton>
            <RollupNextButton
              isDone={doneStages >= 3}
              disabled={doneStages >= 3}
              onClick={() => setDoneStages(3)}
            >
              Next step
            </RollupNextButton>
          </div>
        </RollupContentWrapper>
      </Rollup>
      <ProgressWrapper>
        <ProgressHeaderWrapper>
          <p>Progress</p>
          <div>
            <p>
              Current: <span>30%</span>
            </p>
            <p>
              Total (5p reward):: <span>100%</span>
            </p>
          </div>
        </ProgressHeaderWrapper>
        <ProgressBar progress={30}>
          <div />
        </ProgressBar>
      </ProgressWrapper>
    </>
  );
};

export default StagesTab;
