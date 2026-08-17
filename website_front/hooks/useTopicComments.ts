import { useQuery } from "react-query";
import {
  ITopicDetailResponse,
  ITopicListResponse,
} from "../types/global_types";
import getTopicComments, {
  TopicListParams,
} from "../http/comments/getTopicComments";
import getTopicDetail from "../http/comments/getTopicDetail";

export const topicCommentsQueryKeys = {
  all: ["comments", "topics"] as const,
  list: (params: TopicListParams) =>
    [
      "comments",
      "topics",
      params.page || 1,
      params.limit || 20,
      params.search || "",
      params.sort || "newest",
      params.filter || "",
      params.category || "",
      params.fromDate || "",
      params.toDate || "",
    ] as const,
  detail: (topicId: string) => ["comments", "topic-detail", topicId] as const,
};

export const useTopicListQuery = (params: TopicListParams) =>
  useQuery<ITopicListResponse | null>(
    topicCommentsQueryKeys.list(params),
    async () => {
      const result = await getTopicComments(params);
      return result.data;
    },
    {
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );

export const useTopicDetailQuery = (topicId?: string | null) =>
  useQuery<ITopicDetailResponse | null>(
    topicCommentsQueryKeys.detail(topicId || "empty"),
    async () => {
      if (!topicId) {
        return null;
      }

      const result = await getTopicDetail(topicId);
      return result.data;
    },
    {
      enabled: Boolean(topicId),
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );
