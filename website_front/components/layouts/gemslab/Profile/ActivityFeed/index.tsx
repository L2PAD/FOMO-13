import React, { useState } from "react";
import { useQuery } from "react-query";
import Image from "next/image";
import { useRouter } from "next/router";
import moment from "moment";
import AllIcon from "../../../../../assets/icons/all-sort.svg";
import EmptyList from "../../../../global/EmptyList";
import fetchActivities from "../../../../../http/activity/fetchActivities";
import { ActivityTypes, IActivity } from "../../../../../types/global_types";
import ArrowBackIcon from "../../../../global/Icons/ArrowBackIcon";
import { ActivityItem, Body, Header, TitleWrapper, Wrapper } from "./styles";
import Pagination from "../../../../global/Pagintaion";
import { useTranslation } from "i18n";
import { sanitizedHtml } from "../../../../../helpers/sanitizeHtml";

const activityItem = [];

const limit = 10;

const UserActivityFeed = () => {
  const { translateText } = useTranslation();
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ActivityTypes>("all");
  const [page, setPage] = useState<number>(1);
  const { data } = useQuery(["activity", selectedType, page], () =>
    fetchActivities(selectedType, `?page=${page}&limit=${limit}`)
  );

  return (
    <Wrapper>
      <TitleWrapper>
        <h2>{translateText("Activity Feed")}</h2>
      </TitleWrapper>
      <Header>
        <button
          className={selectedType === "all" ? "selectedSort" : ""}
          onClick={() => setSelectedType("all")}
        >
          <Image src={AllIcon} alt="all" />
          <span>{translateText("All")}</span>
        </button>
        <button
          className={selectedType === "investments" ? "selectedSort" : ""}
          onClick={() => setSelectedType("investments")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
          >
            <path
              d="M7.5 2.31402C8.50313 1.49276 9.78561 1 11.1832 1C14.3965 1 17.0014 3.60489 17.0014 6.81818C17.0014 8.21512 16.509 9.49707 15.6885 10.5M12.6364 11.1818C12.6364 14.3951 10.0315 17 6.81818 17C3.60489 17 1 14.3951 1 11.1818C1 7.96852 3.60489 5.36364 6.81818 5.36364C10.0315 5.36364 12.6364 7.96852 12.6364 11.1818Z"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{translateText("Investments")}</span>
        </button>
        <button
          className={selectedType === "deals" ? "selectedSort" : ""}
          onClick={() => setSelectedType("deals")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M11.8775 8.2098C11.9678 8.47076 12.2525 8.60911 12.5135 8.5188C12.7745 8.4285 12.9128 8.14375 12.8225 7.88279L11.8775 8.2098ZM11 7.02778L11.022 6.52826C11.0146 6.52794 11.0073 6.52778 11 6.52778V7.02778ZM9 10.0833V10.5833V10.0833ZM11 13.1389V13.6389V13.1389ZM9 13.1389L8.97803 13.6384C8.98535 13.6387 8.99267 13.6389 9 13.6389V13.1389ZM8.12251 11.9569C8.03221 11.6959 7.74745 11.5576 7.48649 11.6479C7.22553 11.7382 7.08719 12.0229 7.17749 12.2839L8.12251 11.9569ZM10.5 5.5C10.5 5.22386 10.2761 5 10 5C9.72386 5 9.5 5.22386 9.5 5.5H10.5ZM9.5 7.02778C9.5 7.30392 9.72386 7.52778 10 7.52778C10.2761 7.52778 10.5 7.30392 10.5 7.02778H9.5ZM10.5 13.1389C10.5 12.8627 10.2761 12.6389 10 12.6389C9.72386 12.6389 9.5 12.8627 9.5 13.1389H10.5ZM9.5 14.6667C9.5 14.9428 9.72386 15.1667 10 15.1667C10.2761 15.1667 10.5 14.9428 10.5 14.6667H9.5ZM12.8225 7.88279C12.6909 7.50234 12.4499 7.16926 12.1293 6.92733L11.527 7.72562C11.6875 7.84672 11.8101 8.01502 11.8775 8.2098L12.8225 7.88279ZM12.1293 6.92733C11.8085 6.68531 11.4229 6.54589 11.022 6.52826L10.978 7.52729C11.1754 7.53597 11.3666 7.60461 11.527 7.72562L12.1293 6.92733ZM11 6.52778H9V7.52778H11V6.52778ZM9 6.52778C8.46657 6.52778 7.95689 6.74369 7.58256 7.12496L8.29612 7.82555C8.48439 7.63379 8.73777 7.52778 9 7.52778V6.52778ZM7.58256 7.12496C7.20853 7.50591 7 8.02068 7 8.55555H8C8 8.28004 8.10754 8.01762 8.29612 7.82555L7.58256 7.12496ZM7 8.55555C7 9.09042 7.20852 9.60519 7.58256 9.98615L8.29612 9.28556C8.10754 9.09349 8 8.83107 8 8.55555H7ZM7.58256 9.98615C7.95689 10.3674 8.46657 10.5833 9 10.5833V9.58333C8.73777 9.58333 8.48439 9.47732 8.29612 9.28556L7.58256 9.98615ZM9 10.5833H11V9.58333H9V10.5833ZM11 10.5833C11.2622 10.5833 11.5156 10.6893 11.7039 10.8811L12.4174 10.1805C12.0431 9.79924 11.5334 9.58333 11 9.58333V10.5833ZM11.7039 10.8811C11.8925 11.0732 12 11.3356 12 11.6111H13C13 11.0762 12.7915 10.5615 12.4174 10.1805L11.7039 10.8811ZM12 11.6111C12 11.8866 11.8925 12.149 11.7039 12.3411L12.4174 13.0417C12.7915 12.6607 13 12.146 13 11.6111H12ZM11.7039 12.3411C11.5156 12.5329 11.2622 12.6389 11 12.6389V13.6389C11.5334 13.6389 12.0431 13.423 12.4174 13.0417L11.7039 12.3411ZM11 12.6389H9V13.6389H11V12.6389ZM9.02197 12.6394C8.82462 12.6307 8.6334 12.5621 8.473 12.441L7.87073 13.2393C8.19151 13.4813 8.57713 13.6208 8.97803 13.6384L9.02197 12.6394ZM8.473 12.441C8.31249 12.3199 8.18991 12.1516 8.12251 11.9569L7.17749 12.2839C7.30914 12.6643 7.55006 12.9974 7.87073 13.2393L8.473 12.441ZM9.5 5.5V7.02778H10.5V5.5H9.5ZM9.5 13.1389V14.6667H10.5V13.1389H9.5ZM17.5 10C17.5 14.1421 14.1421 17.5 10 17.5V18.5C14.6944 18.5 18.5 14.6944 18.5 10H17.5ZM10 17.5C5.85786 17.5 2.5 14.1421 2.5 10H1.5C1.5 14.6944 5.30558 18.5 10 18.5V17.5ZM2.5 10C2.5 5.85786 5.85786 2.5 10 2.5V1.5C5.30558 1.5 1.5 5.30558 1.5 10H2.5ZM10 2.5C14.1421 2.5 17.5 5.85786 17.5 10H18.5C18.5 5.30558 14.6944 1.5 10 1.5V2.5Z"
              fill="#738094"
            />
          </svg>
          <span>{translateText("Deals")}</span>
        </button>
        <button
          className={selectedType === "comments" ? "selectedSort" : ""}
          onClick={() => setSelectedType("comments")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M7 7H13M7 11H10.5M18 10C18 11.15 17.7573 12.2434 17.3204 13.2316L18.0015 17.9992L13.9157 16.9778C12.7583 17.6287 11.4225 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
              stroke="#738094"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{translateText("Comments")}</span>
        </button>
        <button
          className={selectedType === "other" ? "selectedSort" : ""}
          onClick={() => setSelectedType("other")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M10.0007 8.33203C9.08398 8.33203 8.33398 9.08203 8.33398 9.9987C8.33398 10.9154 9.08398 11.6654 10.0007 11.6654C10.9173 11.6654 11.6673 10.9154 11.6673 9.9987C11.6673 9.08203 10.9173 8.33203 10.0007 8.33203ZM15.0007 8.33203C14.084 8.33203 13.334 9.08203 13.334 9.9987C13.334 10.9154 14.084 11.6654 15.0007 11.6654C15.9173 11.6654 16.6673 10.9154 16.6673 9.9987C16.6673 9.08203 15.9173 8.33203 15.0007 8.33203ZM5.00065 8.33203C4.08398 8.33203 3.33398 9.08203 3.33398 9.9987C3.33398 10.9154 4.08398 11.6654 5.00065 11.6654C5.91732 11.6654 6.66732 10.9154 6.66732 9.9987C6.66732 9.08203 5.91732 8.33203 5.00065 8.33203Z"
              fill="#738094"
            />
          </svg>
          <span>{translateText("Others")}</span>
        </button>
      </Header>
      <Body variant="main">
        {data?.activity?.length ? (
          data.activity.map((item: IActivity) => {
            return (
              <ActivityItem key={item._id}>
                <div className="activity-info">
                  <div
                    onClick={(e: any) => {
                      if (e.target.getAttribute("data-path")) {
                        router.push(e.target.getAttribute("data-path"));
                      }
                    }}
                    dangerouslySetInnerHTML={sanitizedHtml(item.title)}
                    className="activity-title"
                  />
                  <div className="activity-date">
                    {moment(item.createdAt).format("DD.MM.YYYY hh:mm a")}
                  </div>
                </div>
                <button
                  className="router-btn"
                  onClick={() => router.push(item.link)}
                >
                  <ArrowBackIcon />
                </button>
              </ActivityItem>
            );
          })
        ) : (
          <>
            <br />
            <br />
            <EmptyList />
            <br />
            <br />
          </>
        )}
      </Body>
      {Number(data?.totalCount) > limit ? (
        <Pagination
          page={page}
          total={Number(data?.totalCount)}
          limit={
            Number(data?.totalCount) < page * limit
              ? data?.totalCount
              : page * limit
          }
          totalPage={Math.ceil(Number(data?.totalCount) / limit)}
          onChange={(value) => {
            setPage(value);
          }}
          onePageLimit={10}
        />
      ) : (
        <></>
      )}
    </Wrapper>
  );
};

export default UserActivityFeed;
