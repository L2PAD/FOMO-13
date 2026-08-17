import React from "react";
import { useQuery } from "react-query";
import { useRouter } from "next/router";
import { ArrowRightIcon } from "../Icons";
import EntityInfo from "../common/EntityInfo";
import { clarifyAmount } from "../../../helpers/clarifyAmount";
import fetchTwitterKeywords from "../../../http/parcing/fetchTwitterKeywords";
import { IParcingTwitterAcc } from "../../../types/global_types";
import EmptyList from "../EmptyList";
import { Body, Header, ListItem, Wrapper } from "./styles";
import fetchTwitterAccs from "../../../http/parcing/fetchTwitterAccs";
import Placeholder from "../common/Placeholder";

const TrendingTwitterSearch = ({ hideHeader }: { hideHeader?: boolean }) => {
  const router = useRouter();
  const { data, isLoading } = useQuery(["treding-tweeter"], () => {
    return fetchTwitterAccs("");
  });

  return (
    <Wrapper>
      {!hideHeader && (
        <Header>
          <h3>Trending Search on X</h3>
          <button>
            <ArrowRightIcon type="new" />
          </button>
        </Header>
      )}
      <Body>
        {data?.accs?.length ? (
          data?.accs.map((item: IParcingTwitterAcc, i: number) => {
            return (
              <ListItem
                tabIndex={i}
                onClick={() => window.open(`https://x.com/${item.username}`)}
                key={item._id}
              >
                <EntityInfo
                  img={String(item.avatar)}
                  name={item.name || item.username}
                  username="Caldera"
                  niche={item.username ? `@${item.username}` : "-"}
                  variant="default"
                />
                <div className="info">
                  <div className="info-item">
                    <div>Followers</div>
                    <span>{clarifyAmount(item.followersCount || 0)}</span>
                  </div>
                  <div className="info-item">
                    <div>Following</div>
                    <span>{clarifyAmount(item.followingCount || 0)}</span>
                  </div>
                </div>
              </ListItem>
            );
          })
        ) : (
          <>
            <br />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                maxWidth: "fit-content",
              }}
            >
              <EmptyList
                imgWidth={150}
                fontSize={16}
                lineHeight={120}
                gap={20}
              />
            </div>
            <br />
          </>
        )}
      </Body>
    </Wrapper>
  );
};

export default TrendingTwitterSearch;
