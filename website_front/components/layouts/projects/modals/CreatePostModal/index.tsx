import React, { FC, useMemo, useRef, useState } from "react";
import { useQuery } from "react-query";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link2,
  Eye,
  Pencil,
  Image as ImageIcon,
  Video,
  X,
  Plus,
} from "lucide-react";
import MainModal from "../../../../global/common/MainModal";
import Input from "../../../../global/common/Input";
import Button from "../../../../global/common/Button";
import FormSelect, {
  FormSelectOption,
} from "../../../../global/common/FormSelect";
import {
  fetchPublicTopics,
  fetchPublicCategories,
} from "../../../../../http/topics/topics";
import {
  ActionsWrapper,
  CreatePostModalGlobalStyle,
  FieldLabel,
  FieldWrapper,
  FormWrapper,
} from "./styles";
import {
  EditorToolbar,
  ToolbarBtn,
  ToolbarDivider,
  RichEditor,
  RichPreview,
  TagsRow,
  TagChip,
  TagInput,
  ImageGrid,
  ImageThumb,
  RemoveDot,
  AddImageTile,
  MediaRow,
  MediaChip,
  ModeToggle,
  ModeBtn,
  HelperText,
  PreviewBadges,
  PreviewBadge,
} from "./richStyles";

export interface CreatePostData {
  topic: string;
  category: string;
  title: string;
  content: string;
  bodyHtml: string;
  image: File | null;
  images: File[];
  mediaUrls: string[];
  tags: string[];
  audience: "PUBLIC" | "FOLLOWERS";
  customTopic?: string;
  customCategory?: string;
}

interface Props {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePostData) => Promise<void>;
}

const OTHERS: FormSelectOption = { value: "others", label: "Others (type your own)" };

const staticTopicOptions: FormSelectOption[] = [
  { value: "blockchain", label: "Blockchain" },
  { value: "nfts", label: "NFTs" },
  { value: "defi", label: "DeFi" },
  { value: "ai", label: "AI" },
  { value: "analytics", label: "Analytics" },
  { value: "strategy", label: "Strategy" },
  { value: "market", label: "Market" },
  { value: "airdrops", label: "Airdrops" },
];

const staticCategoryOptions: FormSelectOption[] = [
  { value: "alpha", label: "Alpha" },
  { value: "research", label: "Research" },
  { value: "strategy", label: "Strategy" },
  { value: "invests", label: "Invests" },
  { value: "analytics", label: "Analytics" },
  { value: "trade", label: "Trade" },
  { value: "news", label: "News" },
];

const audienceOptions: FormSelectOption[] = [
  { value: "PUBLIC", label: "Everyone" },
  { value: "FOLLOWERS", label: "Followers only" },
];

const MAX_IMAGES = 10;

const CreatePostModal: FC<Props> = ({ isVisible, onClose, onSubmit }) => {
  const { data: fetchedTopics } = useQuery(["public-topics"], fetchPublicTopics, {
    staleTime: 60_000,
  });
  const { data: fetchedCategories } = useQuery(
    ["public-categories"],
    fetchPublicCategories,
    { staleTime: 60_000 }
  );

  const topicOptions: FormSelectOption[] = useMemo(() => {
    const base =
      fetchedTopics && fetchedTopics.length
        ? fetchedTopics.map((t) => ({ value: t.slug, label: t.name }))
        : staticTopicOptions;
    return [...base, OTHERS];
  }, [fetchedTopics]);

  const categoryOptions: FormSelectOption[] = useMemo(() => {
    const base =
      fetchedCategories && fetchedCategories.length
        ? fetchedCategories
            .filter((c) => c.name.toLowerCase() !== "others")
            .map((c) => ({ value: c.name.toLowerCase(), label: c.name }))
        : staticCategoryOptions;
    return [...base, OTHERS];
  }, [fetchedCategories]);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [topic, setTopic] = useState("blockchain");
  const [customTopic, setCustomTopic] = useState("");
  const [category, setCategory] = useState("alpha");
  const [customCategory, setCustomCategory] = useState("");
  const [audience, setAudience] = useState<"PUBLIC" | "FOLLOWERS">("PUBLIC");
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [plainText, setPlainText] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [mediaDraft, setMediaDraft] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const resetForm = () => {
    setTopic("blockchain");
    setCustomTopic("");
    setCategory("alpha");
    setCustomCategory("");
    setAudience("PUBLIC");
    setTitle("");
    setBodyHtml("");
    setPlainText("");
    setImages([]);
    setPreviews([]);
    setMediaUrls([]);
    setMediaDraft("");
    setTags([]);
    setTagDraft("");
    setMode("write");
    setHasSubmitted(false);
    if (editorRef.current) editorRef.current.innerHTML = "";
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setSubmitError("");
    resetForm();
    onClose();
  };

  const syncEditor = () => {
    if (!editorRef.current) return;
    setBodyHtml(editorRef.current.innerHTML);
    setPlainText((editorRef.current.textContent || "").trim());
  };

  const exec = (command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    syncEditor();
  };

  const addLink = () => {
    const url = window.prompt("Enter URL (https://...)");
    if (url && /^https?:\/\//i.test(url)) exec("createLink", url);
  };

  const onPickImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    const room = MAX_IMAGES - images.length;
    const accepted = picked
      .filter((f) => /^image\//.test(f.type) && f.size <= 15 * 1024 * 1024)
      .slice(0, Math.max(0, room));
    if (!accepted.length) return;
    setImages((p) => [...p, ...accepted]);
    setPreviews((p) => [...p, ...accepted.map((f) => URL.createObjectURL(f))]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (idx: number) => {
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const addTag = () => {
    const t = tagDraft.trim().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 12) setTags((p) => [...p, t]);
    setTagDraft("");
  };

  const addMedia = () => {
    const u = mediaDraft.trim();
    if (/^https?:\/\//i.test(u) && !mediaUrls.includes(u) && mediaUrls.length < 8) {
      setMediaUrls((p) => [...p, u]);
    }
    setMediaDraft("");
  };

  const topicLabel =
    topic === "others"
      ? customTopic || "Others"
      : topicOptions.find((o) => o.value === topic)?.label || topic;
  const categoryLabel =
    category === "others"
      ? customCategory || "Others"
      : categoryOptions.find((o) => o.value === category)?.label || category;

  const canSubmit =
    !!plainText.trim() &&
    (topic !== "others" || !!customTopic.trim()) &&
    (category !== "others" || !!customCategory.trim());

  const handleSubmit = async () => {
    setHasSubmitted(true);
    if (!canSubmit || isSubmitting) return;
    try {
      setIsSubmitting(true);
      setSubmitError("");
      await onSubmit({
        topic,
        category,
        title,
        content: plainText,
        bodyHtml,
        image: images[0] || null,
        images,
        mediaUrls,
        tags,
        audience,
        customTopic,
        customCategory,
      });
      resetForm();
      onClose();
    } catch (error: any) {
      setSubmitError(error?.message || "Unable to publish the post right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CreatePostModalGlobalStyle />
      <MainModal
        className="create-post-modal"
        title="Create a Post"
        variant="big"
        isVisible={isVisible}
        onClose={handleClose}
      >
        <FormWrapper>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <FieldWrapper>
              <FormSelect
                labelText="Topic"
                options={topicOptions}
                value={topic}
                onChange={(v) => !isSubmitting && setTopic(v)}
              />
              {topic === "others" && (
                <Input
                  className="width100 create-post-input"
                  placeholder="Enter a custom topic..."
                  value={customTopic}
                  disabled={isSubmitting}
                  onChange={setCustomTopic}
                  error={hasSubmitted && !customTopic.trim() ? "Topic is required" : ""}
                />
              )}
            </FieldWrapper>

            <FieldWrapper>
              <FormSelect
                labelText="Category"
                options={categoryOptions}
                value={category}
                onChange={(v) => !isSubmitting && setCategory(v)}
              />
              {category === "others" && (
                <Input
                  className="width100 create-post-input"
                  placeholder="Enter a custom category..."
                  value={customCategory}
                  disabled={isSubmitting}
                  onChange={setCustomCategory}
                  error={
                    hasSubmitted && !customCategory.trim() ? "Category is required" : ""
                  }
                />
              )}
            </FieldWrapper>
          </div>

          <FieldWrapper>
            <FormSelect
              labelText="Audience"
              options={audienceOptions}
              value={audience}
              onChange={(v) => !isSubmitting && setAudience(v as "PUBLIC" | "FOLLOWERS")}
            />
          </FieldWrapper>

          <FieldWrapper>
            <Input
              className="width100 create-post-input"
              labelText="Title (Optional)"
              placeholder="Give your post a catchy title..."
              value={title}
              disabled={isSubmitting}
              onChange={setTitle}
            />
          </FieldWrapper>

          {/* Rich content editor */}
          <FieldWrapper>
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <FieldLabel>Content</FieldLabel>
              <ModeToggle>
                <ModeBtn
                  type="button"
                  className={mode === "write" ? "active" : ""}
                  onClick={() => setMode("write")}
                  data-testid="composer-mode-write"
                >
                  <Pencil size={13} /> Write
                </ModeBtn>
                <ModeBtn
                  type="button"
                  className={mode === "preview" ? "active" : ""}
                  onClick={() => setMode("preview")}
                  data-testid="composer-mode-preview"
                >
                  <Eye size={13} /> Preview
                </ModeBtn>
              </ModeToggle>
            </div>

            {mode === "write" ? (
              <>
                <EditorToolbar>
                  <ToolbarBtn type="button" title="Bold" onClick={() => exec("bold")}>
                    <Bold size={15} />
                  </ToolbarBtn>
                  <ToolbarBtn type="button" title="Italic" onClick={() => exec("italic")}>
                    <Italic size={15} />
                  </ToolbarBtn>
                  <ToolbarBtn type="button" title="Underline" onClick={() => exec("underline")}>
                    <UnderlineIcon size={15} />
                  </ToolbarBtn>
                  <ToolbarDivider />
                  <ToolbarBtn
                    type="button"
                    title="Bulleted list"
                    onClick={() => exec("insertUnorderedList")}
                  >
                    <List size={15} />
                  </ToolbarBtn>
                  <ToolbarBtn
                    type="button"
                    title="Numbered list"
                    onClick={() => exec("insertOrderedList")}
                  >
                    <ListOrdered size={15} />
                  </ToolbarBtn>
                  <ToolbarDivider />
                  <ToolbarBtn type="button" title="Insert link" onClick={addLink}>
                    <Link2 size={15} />
                  </ToolbarBtn>
                </EditorToolbar>
                <RichEditor
                  ref={editorRef}
                  contentEditable={!isSubmitting}
                  suppressContentEditableWarning
                  data-placeholder="Share your insights, analysis or an announcement..."
                  onInput={syncEditor}
                  data-testid="composer-editor"
                />
                {!plainText.trim() && hasSubmitted && (
                  <HelperText style={{ color: "#e5484d" }}>
                    {submitError || "Content is required"}
                  </HelperText>
                )}
              </>
            ) : (
              <RichPreview data-testid="composer-preview">
                <PreviewBadges>
                  <PreviewBadge className="topic">{topicLabel}</PreviewBadge>
                  <PreviewBadge>{categoryLabel}</PreviewBadge>
                  {tags.map((t) => (
                    <PreviewBadge key={t} className="tag">#{t}</PreviewBadge>
                  ))}
                </PreviewBadges>
                {title.trim() ? <h3>{title}</h3> : null}
                {bodyHtml.trim() ? (
                  <div
                    className="body"
                    dangerouslySetInnerHTML={{ __html: bodyHtml }}
                  />
                ) : (
                  <p className="empty">Nothing to preview yet.</p>
                )}
                {previews.length ? (
                  <ImageGrid className="preview-gallery">
                    {previews.map((src, i) => (
                      <ImageThumb key={i} style={{ backgroundImage: `url(${src})` }} />
                    ))}
                  </ImageGrid>
                ) : null}
                {mediaUrls.length ? (
                  <MediaRow>
                    {mediaUrls.map((u) => (
                      <MediaChip key={u} as="a" href={u} target="_blank" rel="noreferrer">
                        <Video size={13} /> {u.replace(/^https?:\/\//, "").slice(0, 40)}
                      </MediaChip>
                    ))}
                  </MediaRow>
                ) : null}
              </RichPreview>
            )}
          </FieldWrapper>

          {/* Tags */}
          <FieldWrapper>
            <FieldLabel>Tags</FieldLabel>
            <TagsRow>
              {tags.map((t) => (
                <TagChip key={t} data-testid={`composer-tag-${t}`}>
                  #{t}
                  <RemoveDot type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))}>
                    <X size={12} />
                  </RemoveDot>
                </TagChip>
              ))}
              <TagInput
                value={tagDraft}
                placeholder={tags.length ? "Add tag" : "Add a tag and press Enter"}
                disabled={isSubmitting}
                data-testid="composer-tag-input"
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
            </TagsRow>
            <HelperText>Up to 12 tags. Press Enter or comma to add.</HelperText>
          </FieldWrapper>

          {/* Images */}
          <FieldWrapper>
            <FieldLabel>Images (Optional)</FieldLabel>
            <ImageGrid>
              {previews.map((src, i) => (
                <ImageThumb key={i} style={{ backgroundImage: `url(${src})` }}>
                  <RemoveDot type="button" onClick={() => removeImage(i)}>
                    <X size={12} />
                  </RemoveDot>
                </ImageThumb>
              ))}
              {images.length < MAX_IMAGES && (
                <AddImageTile
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="composer-add-image"
                >
                  <ImageIcon size={18} />
                  <span>Add</span>
                </AddImageTile>
              )}
            </ImageGrid>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              multiple
              style={{ display: "none" }}
              onChange={onPickImages}
            />
            <HelperText>Up to {MAX_IMAGES} images · PNG/JPG/WEBP/SVG · max 15 MB each.</HelperText>
          </FieldWrapper>

          {/* Media links / video */}
          <FieldWrapper>
            <FieldLabel>Video / Links (Optional)</FieldLabel>
            <MediaRow>
              {mediaUrls.map((u) => (
                <MediaChip key={u}>
                  <Video size={13} /> {u.replace(/^https?:\/\//, "").slice(0, 36)}
                  <RemoveDot type="button" onClick={() => setMediaUrls((p) => p.filter((x) => x !== u))}>
                    <X size={12} />
                  </RemoveDot>
                </MediaChip>
              ))}
            </MediaRow>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <TagInput
                style={{ flex: 1 }}
                value={mediaDraft}
                placeholder="Paste a YouTube / video / link URL (https://...)"
                disabled={isSubmitting}
                data-testid="composer-media-input"
                onChange={(e) => setMediaDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMedia();
                  }
                }}
              />
              <Button variant="secondary" onClick={addMedia} disabled={isSubmitting}>
                <Plus size={15} /> Add
              </Button>
            </div>
          </FieldWrapper>

          <ActionsWrapper>
            <Button
              className="create-post-cancel"
              variant="secondary"
              disabled={isSubmitting}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="create-post-submit"
              variant="primary"
              disabled={isSubmitting || !canSubmit}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Posting..." : "Post"}
            </Button>
          </ActionsWrapper>
        </FormWrapper>
      </MainModal>
    </>
  );
};

export default CreatePostModal;
