import React, { FC } from "react";
import { Category, Header, Item, Text, Wrapper } from "./styles";
import { useQuery } from "react-query";
import getNews from "../../../http/news/getNews";
import { INews, IUser } from "../../../types/global_types";
import EmptySection from "../EmptySection";
import ArrowBackIcon from "../Icons/ArrowBackIcon";
import { ArrowRightIcon } from "../Icons";
import { ArrowButton } from "../Tables/ActionsTable/ProjectsTable/styles";
import EntityInfo from "../common/EntityInfo";
import moment from "moment";
import { useRouter } from "next/router";
import { sanitizedHtml } from "../../../helpers/sanitizeHtml";

interface IProps {
  userId?: string;
}

const UserPostedContent: FC<IProps> = ({ userId }) => {
  const { data } = useQuery(
    ["user-content", userId],
    () => {
      return getNews(`news/all/user/content/${userId}`);
    },
    {
      refetchOnWindowFocus: false,
    }
  );
  const router = useRouter();

  return (
    <Wrapper>
      {data?.news?.length ? (
        data?.news.map((item: INews) => {
          const user: IUser | null = item.creator?.length
            ? item.creator[0]
            : null;
          return (
            <Item key={item._id} variant="main">
              <Header>
                <Category>{item.type}</Category>
                <button
                  onClick={() => router.push(`/${item.page}/news/${item._id}`)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="16"
                    viewBox="0 0 18 16"
                    fill="none"
                  >
                    <path
                      d="M10.3333 1L17 8M17 8L10.3333 15M17 8L1 8"
                      stroke="#738094"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </Header>
              <Text
                dangerouslySetInnerHTML={sanitizedHtml(
                  item.text.length > 40 ? `${item.text}...` : item.text
                )}
              />
              <EntityInfo
                rating={0}
                name={user?.twitterData?.name}
                username={user?.username}
                niche={moment(item.date).format("lll")}
                variant="default"
                img={user ? user?.photo || user?.twitterData?.photo : ""}
              />
            </Item>
          );
        })
      ) : (
        <EmptySection />
      )}
    </Wrapper>
  );
};

export default UserPostedContent;
