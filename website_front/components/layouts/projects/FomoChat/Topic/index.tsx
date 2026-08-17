import React, { useEffect, useMemo, useState } from "react";
import Pagination from "../../../../global/Pagintaion";
import { IComment } from "../../../../../types/global_types";
import TopicItem from "./item/TopicItem";
import addReply from "../../../../../http/comments/addReply";
import addReaction from "../../../../../http/comments/addReaction";
import addComment from "../../../../../http/comments/addComment";
import { CommentTopicWrapper, TabWrapper, TopicWrapper } from "./styles";
import HighlightSection from "./HighlightSection";
import TopicDetail from "./TopicDetail";
import CreateReply from "../../modals/CreateReply";
import { useQueryClient } from "react-query";
import {
  topicCommentsQueryKeys,
  useTopicListQuery,
} from "../../../../../hooks/useTopicComments";
import Placeholder from "../../../../global/common/Placeholder";
import { Item } from "./styles";

const PAGE_LIMIT = 20;

interface TopicProps {
  searchValue?: string;
  filterData?: Record<string, any> | null;
}

const parseFilterDate = (value?: string): string | undefined => {
  if (!value) return undefined;

  const [day, month, year] = value.split("/");
  if (!day || !month || !year) return undefined;

  const date = new Date(Number(year), Number(month) - 1, Number(day));
  if (Number.isNaN(date.getTime())) return undefined;

  return date.toISOString();
};

const resolveCategoryFilter = (filterData?: Record<string, any> | null) => {
  const categoryOptions = filterData?.category;
  const categories = Array.isArray(categoryOptions)
    ? categoryOptions.filter((item: any) => item.isActive)
    : [];

  return categories.length === 1 ? categories[0].key : undefined;
};

const Topic = ({ searchValue = "", filterData = null }: TopicProps) => {
  const queryClient = useQueryClient();
  const [isCreateReplyId, setIsCreateReplyId] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const category = resolveCategoryFilter(filterData);
  const fromDate = parseFilterDate(filterData?.fromDate);
  const toDate = parseFilterDate(filterData?.toDate);

  useEffect(() => {
    setPage(1);
  }, [searchValue, category, fromDate, toDate]);

  const topicListParams = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      search: searchValue.trim() || undefined,
      sort: "newest",
      category,
      fromDate,
      toDate,
    }),
    [page, searchValue, category, fromDate, toDate]
  );

  const { data, isLoading } = useTopicListQuery(topicListParams);
  const comments = data?.items || [];
  const total = data?.total || 0;

  const selectedTopicPreview = useMemo(
    () => comments.find((comment) => comment._id === selectedTopicId) || null,
    [comments, selectedTopicId]
  );

  const invalidateTopicQueries = async (topicId?: string) => {
    await queryClient.invalidateQueries(topicCommentsQueryKeys.all);

    if (topicId) {
      await queryClient.invalidateQueries(topicCommentsQueryKeys.detail(topicId));
    }
  };

  const confirmAddTopic = async (
    text: string,
    isTopic?: boolean,
    topicName?: string
  ): Promise<void> => {
    const result = await addComment("comments/topic", {
      text,
      isTopic,
      topicName,
      path: "/crypto/news",
    } as any);

    if (!result.isSuccess) {
      throw new Error(result.error || "Unable to create topic.");
    }

    await invalidateTopicQueries();
  };

  const confirmAddReply = async (
    text: string,
    replyId?: string
  ): Promise<void> => {
    const targetId = replyId || isCreateReplyId;

    if (!targetId) {
      return;
    }

    const result = await addReply(targetId, {
      text,
      path: "/crypto/news",
    } as any);

    if (!result.isSuccess) {
      throw new Error(result.error || "Unable to add reply.");
    }

    await invalidateTopicQueries(selectedTopicId || result.comment?.topicId || targetId);
    setIsCreateReplyId("");
  };

  const confirmLikeAction = async (
    id: string,
    action: "like" | "dislike"
  ): Promise<void> => {
    const result = await addReaction(id, action);

    if (!result.isSuccess) {
      throw new Error(result.error || "Unable to update reaction.");
    }

    await invalidateTopicQueries(selectedTopicId || result.comment?.topicId);
  };

  if (selectedTopicId) {
    return (
      <TopicDetail
        topicId={selectedTopicId}
        initialItem={selectedTopicPreview}
        onBack={() => setSelectedTopicId(null)}
        confirmAddReply={confirmAddReply}
        addReaction={confirmLikeAction}
      />
    );
  }

  const renderTopicSkeletons = () =>
    Array.from({ length: 4 }).map((_, index) => (
      <CommentTopicWrapper key={`topic-skeleton-${index}`}>
        <Item>
          <div className="header">
            <div className="header-top">
              <Placeholder
                width="48px"
                height="48px"
                borderRadius="50%"
                marginBottom="0"
              />
              <div className="user-info">
                <Placeholder
                  width="140px"
                  height="18px"
                  borderRadius="8px"
                  marginBottom="8px"
                />
                <Placeholder
                  width="110px"
                  height="14px"
                  borderRadius="8px"
                  marginBottom="0"
                />
              </div>
            </div>
          </div>
          <Placeholder
            width="78%"
            height="22px"
            borderRadius="8px"
            marginBottom="10px"
          />
          <Placeholder
            width="64%"
            height="22px"
            borderRadius="8px"
            marginBottom="0"
          />
          <div className="footer">
            <div className="stats">
              <Placeholder
                width="72px"
                height="16px"
                borderRadius="8px"
                marginBottom="0"
              />
              <Placeholder
                width="82px"
                height="16px"
                borderRadius="8px"
                marginBottom="0"
              />
              <Placeholder
                width="68px"
                height="16px"
                borderRadius="8px"
                marginBottom="0"
              />
            </div>
          </div>
        </Item>
      </CommentTopicWrapper>
    ));

  return (
    <TabWrapper>
      <TopicWrapper>
        <div className="topics">
          {isLoading
            ? renderTopicSkeletons()
            : comments.map((item: IComment, index: number) => {
              if (!item.author?.[0]) return null;

              return (
                <CommentTopicWrapper key={item._id || index}>
                  <TopicItem
                    addReaction={confirmLikeAction}
                    addReply={(id: string) => setIsCreateReplyId(id)}
                    key={item._id}
                    item={item}
                    onClick={() => setSelectedTopicId(item._id || null)}
                  />
                  {isCreateReplyId === item._id ? (
                    <CreateReply
                      key={`reply-${item._id || index}`}
                      topicId={isCreateReplyId}
                      onClose={() => setIsCreateReplyId("")}
                      onSubmit={confirmAddReply}
                    />
                  ) : null}
                </CommentTopicWrapper>
              );
            })}
          {!isLoading && total > PAGE_LIMIT ? (
            <Pagination
              page={page}
              total={PAGE_LIMIT}
              limit={PAGE_LIMIT}
              totalPage={Math.ceil(total / PAGE_LIMIT)}
              onChange={(value) => setPage(value)}
            />
          ) : null}
        </div>
        <div className="highlight">
          <HighlightSection
            addTopic={confirmAddTopic}
            topics={comments}
            totalTopics={total}
            isLoading={isLoading}
          />
        </div>
      </TopicWrapper>
    </TabWrapper>
  );
};

export default Topic;
