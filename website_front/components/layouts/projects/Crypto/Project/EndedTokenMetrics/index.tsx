import React, { FC, useContext } from "react";
import dynamic from "next/dynamic";
import { useSelector } from "react-redux";
import { AssetTableData } from "../../../../../../staticContent/global";
import Typography from "../../../../../global/common/Typography";
import { EditIcon } from "../../../../../global/Icons";
import ViewTable from "../../../../../global/Tables/ViewTable";
import { authState } from "../../../../../../store/slices/authSlice";
import {
  Content,
  ContentWrapper,
  MetricsCol,
  MetricsContentWrapper,
  MetricsRow,
  MetricsWrapper,
  PieContentWrapper,
  PieTitleWrapper,
  PieValuesPercentage,
  PieValuesPercentageWrapper,
  PieValuesTitle,
  PieValuesWrapper,
  PieWrapper,
  TableWrapper,
} from "./styles";
import { IProject } from "../../../../../../types/global_types";
import { ProjectDataContext } from "../../../../../../contexts/projectDataContext";
import { EditStateWrapper } from "../styles";
import { COLORS } from "../Fundraising";
import { clarifyAmount } from "../../../../../../helpers/clarifyAmount";

// @ts-ignore
const PieGraphic = dynamic(() => import("./pie.tsx"), { ssr: false });

interface IProps {
  projectDataToUpdate: IProject | null;
  isEdit?: boolean;
  inputsHandler?: (name: string, value: any) => void;
}

const EndedTokenMetrics: FC<IProps> = ({
  projectDataToUpdate,
  isEdit,
  inputsHandler,
}) => {
  const project: IProject = useContext(ProjectDataContext);

  return (
    <div>
      <ContentWrapper>
        <Content>
          <div>
            <PieTitleWrapper>
              <Typography variant="p">Token Allocation</Typography>
            </PieTitleWrapper>
            <PieContentWrapper>
              <PieWrapper>
                <PieGraphic
                  // @ts-ignore
                  items={project?.totalAllocation || []}
                />
              </PieWrapper>
              <PieValuesWrapper>
                <PieValuesTitle variant="p">
                  Total Tokens Supply:
                  <span>
                    {isEdit ? (
                      <EditStateWrapper>
                        <input
                          style={{ width: "180px", height: "26px" }}
                          placeholder=""
                          onChange={(e: any) =>
                            inputsHandler &&
                            inputsHandler("totalSupply", e.target.value)
                          }
                          value={projectDataToUpdate?.totalSupply || ""}
                        />
                      </EditStateWrapper>
                    ) : (
                      clarifyAmount(projectDataToUpdate?.totalSupply || 0)
                    )}
                  </span>
                </PieValuesTitle>
                <PieValuesTitle variant="p">
                  Tokens For Sale:
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("totalForSale", e.target.value)
                        }
                        value={projectDataToUpdate?.totalForSale || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    project.totalForSale
                  )}
                </PieValuesTitle>
                <PieValuesPercentageWrapper>
                  {isEdit ? (
                    projectDataToUpdate?.totalAllocation?.length ? (
                      projectDataToUpdate?.totalAllocation?.map(
                        (item: any, index: number) => {
                          return (
                            <PieValuesPercentage
                              key={index}
                              color={COLORS[index]}
                              variant="p"
                            >
                              <i />
                              <EditStateWrapper>
                                <input
                                  style={{ width: "50px", height: "26px" }}
                                  placeholder=""
                                  onChange={(e: any) =>
                                    inputsHandler &&
                                    inputsHandler(
                                      "totalAllocation",
                                      projectDataToUpdate?.totalAllocation?.map(
                                        (item: any, id: number) => {
                                          if (id === index) {
                                            return {
                                              ...item,
                                              value: e.target.value,
                                            };
                                          }
                                          return item;
                                        }
                                      )
                                    )
                                  }
                                  value={item.value}
                                />
                              </EditStateWrapper>
                              - {item.name}
                            </PieValuesPercentage>
                          );
                        }
                      )
                    ) : (
                      <></>
                    )
                  ) : project.totalAllocation?.length ? (
                    project.totalAllocation.map((item: any, index: number) => {
                      return (
                        <PieValuesPercentage
                          key={index}
                          color={COLORS[index]}
                          variant="p"
                        >
                          <i />
                          <span>{item.value}%</span> - {item.name}
                        </PieValuesPercentage>
                      );
                    })
                  ) : (
                    <></>
                  )}
                </PieValuesPercentageWrapper>
              </PieValuesWrapper>
            </PieContentWrapper>
          </div>
          <MetricsWrapper>
            <PieTitleWrapper>
              <Typography variant="p">Token Metrics</Typography>
            </PieTitleWrapper>
            <MetricsContentWrapper>
              <MetricsCol>
                <MetricsRow>
                  <span>Ticket:</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            ticket: e.target.value,
                          })
                        }
                        value={projectDataToUpdate?.tokenMetrics?.ticket || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{project?.tokenMetrics?.ticket || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>Token Type:</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            tokenType: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.tokenType || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{project?.tokenMetrics?.tokenType || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>ICO Token Price:</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            tokenPrice: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.tokenPrice || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{project?.tokenMetrics?.tokenPrice || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>Pre-sale price:</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            preSale: e.target.value,
                          })
                        }
                        value={projectDataToUpdate?.tokenMetrics?.preSale || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{project?.tokenMetrics?.preSale || "-"}</span>
                  )}
                </MetricsRow>
              </MetricsCol>
              <MetricsCol>
                <MetricsRow>
                  <span>KYC:</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            KYC: e.target.value,
                          })
                        }
                        value={projectDataToUpdate?.tokenMetrics?.KYC || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{project?.tokenMetrics?.KYC || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>Whitelist:</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            whitelist: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.whitelist || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{project?.tokenMetrics?.whitelist || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>Min/Max Personal Cap:</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            personalCap: e.target.value,
                          })
                        }
                        value={
                          projectDataToUpdate?.tokenMetrics?.personalCap || ""
                        }
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{project?.tokenMetrics?.personalCap || "-"}</span>
                  )}
                </MetricsRow>
                <MetricsRow>
                  <span>Accepts:</span>
                  {isEdit ? (
                    <EditStateWrapper>
                      <input
                        style={{ width: "180px", height: "26px" }}
                        placeholder=""
                        onChange={(e: any) =>
                          inputsHandler &&
                          inputsHandler("tokenMetrics", {
                            ...projectDataToUpdate?.tokenMetrics,
                            accepts: e.target.value,
                          })
                        }
                        value={projectDataToUpdate?.tokenMetrics?.accepts || ""}
                      />
                    </EditStateWrapper>
                  ) : (
                    <span>{project?.tokenMetrics?.accepts || "-"}</span>
                  )}
                </MetricsRow>
              </MetricsCol>
            </MetricsContentWrapper>
          </MetricsWrapper>
        </Content>
        <TableWrapper>
          {/* <ViewTable
                        type="asset"
                        //@ts-ignore
                        cardsData={{cards: AssetTableData, show: 0}}
                    /> */}
          Assets empty...
        </TableWrapper>
      </ContentWrapper>
    </div>
  );
};

export default EndedTokenMetrics;
