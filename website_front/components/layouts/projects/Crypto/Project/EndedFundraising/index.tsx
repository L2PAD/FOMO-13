import React, { FC, useContext } from "react";
import moment from "moment";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import { IProject, IRoundItem } from "../../../../../../types/global_types";
import { AssetTableData } from "../../../../../../staticContent/global";
import ViewTable from "../../../../../global/Tables/ViewTable";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";
import EditItemsButton from "../../../../../global/common/EditItemsButton";
import EmptyList from "../../../../../global/EmptyList";
import {
  ContentWrapper,
  FundraisingWrapper,
  RemoveBtnWrapper,
  RoundTitle,
  RoundValue,
  RoundValueWrapper,
  RoundWrapper,
  ScrollWrapper,
} from "./styles";
import Button from "../../../../../global/common/Button";
import { CloseIcon } from "../../../../../global/Icons";
import { EditBtnWrapper } from "../EndedComparison/styles";

// @ts-ignore

interface IProps {
  removeRoundItem: (id: number) => void;
  openAddRound: () => void;
  isEditState: boolean;
  project: IProject | null;
}

const EndedFundraising: FC<IProps> = ({
  project,
  openAddRound,
  isEditState,
  removeRoundItem,
}) => {
  const staticProjectData: IProject = useContext(ProjectDataContext);

  return (
    <FundraisingWrapper>
      {isEditState ? (
        <EditBtnWrapper>
          <EditItemsButton onClick={openAddRound} type="fundraising" />
        </EditBtnWrapper>
      ) : (
        <></>
      )}
      <ScrollWrapper>
        {isEditState ? (
          project?.fundraising?.length ? (
            project.fundraising.map((item: any, i: number) => {
              return (
                <RoundWrapper variant="default" key={i}>
                  {isEditState ? (
                    <RemoveBtnWrapper>
                      <Button onClick={() => removeRoundItem(i)}>
                        <CloseIcon />
                      </Button>
                    </RemoveBtnWrapper>
                  ) : (
                    <></>
                  )}
                  <RoundTitle variant="p">Funding Round</RoundTitle>
                  <RoundValueWrapper>
                    <RoundValue variant="p">
                      {moment(item.date).format("YYYY MMMM")}
                    </RoundValue>
                    <RoundValue variant="p">
                      Price: <span>${clarifyAmount(item.price)}</span>
                    </RoundValue>
                  </RoundValueWrapper>
                  <RoundValueWrapper>
                    <RoundValue variant="p">
                      Raised: <span>${clarifyAmount(item.raised)}</span>
                    </RoundValue>
                    <RoundValue variant="p">
                      Pre-Valuation:{" "}
                      <span>${clarifyAmount(item.preValuation)}</span>
                    </RoundValue>
                  </RoundValueWrapper>
                </RoundWrapper>
              );
            })
          ) : (
            <EmptyList />
          )
        ) : staticProjectData?.fundraising?.length ? (
          staticProjectData?.fundraising?.map((item: any, i: number) => {
            return (
              <RoundWrapper variant="default" key={i}>
                {isEditState ? (
                  <RemoveBtnWrapper>
                    <Button onClick={() => removeRoundItem(i)}>
                      <CloseIcon />
                    </Button>
                  </RemoveBtnWrapper>
                ) : (
                  <></>
                )}
                <RoundTitle variant="p">Funding Round</RoundTitle>
                <RoundValueWrapper>
                  <RoundValue variant="p">
                    {moment(item.date).format("YYYY MMMM")}
                  </RoundValue>
                  <RoundValue variant="p">
                    Price: <span>${clarifyAmount(item.price)}</span>
                  </RoundValue>
                </RoundValueWrapper>
                <RoundValueWrapper>
                  <RoundValue variant="p">
                    Raised: <span>${clarifyAmount(item.raised)}</span>
                  </RoundValue>
                  <RoundValue variant="p">
                    Pre-Valuation:{" "}
                    <span>${clarifyAmount(item.preValuation)}</span>
                  </RoundValue>
                </RoundValueWrapper>
              </RoundWrapper>
            );
          })
        ) : (
          <EmptyList />
        )}
      </ScrollWrapper>
      <ContentWrapper>
        {/* <TableWrapper>
                    <ViewTable
                        type="asset"
                        //@ts-ignore
                        cardsData={{cards: AssetTableData, show: 0}}
                    />
                </TableWrapper> */}
      </ContentWrapper>
    </FundraisingWrapper>
  );
};

export default EndedFundraising;
