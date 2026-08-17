import addComment from "./addComment";

export interface CreateTopicPostPayload {
  topic: string;
  category: string;
  title: string;
  content: string;
  bodyHtml?: string;
  image?: File | null;
  images?: File[];
  mediaUrls?: string[];
  tags?: string[];
  audience?: "PUBLIC" | "FOLLOWERS";
  // Free-text overrides when "Others" is selected.
  customTopic?: string;
  customCategory?: string;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });

export default async (
  payload: CreateTopicPostPayload
): Promise<{ isSuccess: boolean; error: string }> => {
  const files = (payload.images && payload.images.length
    ? payload.images
    : payload.image
    ? [payload.image]
    : []) as File[];
  const images = await Promise.all(files.map((f) => fileToBase64(f)));

  const topicKey =
    payload.topic === "others" && payload.customTopic?.trim()
      ? payload.customTopic.trim()
      : payload.topic;
  const categoryKey =
    payload.category === "others" && payload.customCategory?.trim()
      ? payload.customCategory.trim()
      : payload.category;

  const topicName =
    payload.title.trim() ||
    (payload.topic === "others" ? payload.customTopic?.trim() : "") ||
    payload.topic;

  const result = await addComment("comments/topic", {
    text: payload.content.trim(),
    bodyHtml: payload.bodyHtml || "",
    isTopic: true,
    topicName,
    topicKey,
    categoryKey,
    audience: payload.audience === "FOLLOWERS" ? "FOLLOWERS" : "PUBLIC",
    images,
    mediaUrls: payload.mediaUrls || [],
    tags: payload.tags || [],
    path: "/crypto/news",
  } as any);

  return {
    isSuccess: result.isSuccess,
    error: result.error,
  };
};
