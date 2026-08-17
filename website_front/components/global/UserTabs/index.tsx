import React, { FC } from "react";
import { TabCard, TabContent, TabLogo, Wrapper } from "./styles";
import { useQuery } from "react-query";
import fetchTabs from "../../../http/tabhub/fetchTabs";
import { ICryptoTab } from "../../layouts/projects/CryptoMarket/createTabContext";
import EmptySection from "../EmptySection";
import imageLoader from "../../../helpers/imageLoader";
import moment from "moment";

interface IProps {
  userId?: string;
}

const UserTabs: FC<IProps> = ({ userId }) => {
  const { data } = useQuery(
    ["created-tabs", userId],
    () => {
      return fetchTabs(
        userId ? `user/public?userId=${userId}` : "user/created"
      );
    },
    {
      refetchOnWindowFocus: false,
    }
  );

  return (
    <Wrapper>
      {data?.tabs?.length ? (
        data.tabs.map((item: ICryptoTab) => {
          const tabImage = String((item as any)?.image || (item as any)?.logo || "").trim();

          return (
            <TabCard key={item._id}>
              {tabImage ? (
                <TabLogo src={imageLoader(tabImage)} alt={item.name} />
              ) : null}
              <TabContent>
                <div className="name">{item.name}</div>
                {item.description ? (
                  <div className="description">{item.description}</div>
                ) : null}
                <div className="meta">
                  <span>{item.creator?.username || "You"}</span>
                  <span className="dot" />
                  <span>
                    {item.dateUpdate ? moment(String(item.dateUpdate)).format("ll") : ""}
                  </span>
                </div>
              </TabContent>
            </TabCard>
          );
        })
      ) : (
        <EmptySection />
      )}
    </Wrapper>
  );
};

export default UserTabs;
