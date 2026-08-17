import styled from "styled-components";

const BORDER = "var(--color-border-subtle, #eef1f5)";
const ACCENT = "#04a584";
const INK = "#070b35";
const SUB = "#667085";

export const EditorToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border: 1px solid ${BORDER};
  border-bottom: none;
  border-radius: 10px 10px 0 0;
  background: #fbfcfe;
`;

export const ToolbarBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: ${SUB};
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    background: #eef2f7;
    color: ${INK};
  }
`;

export const ToolbarDivider = styled.span`
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: ${BORDER};
`;

export const RichEditor = styled.div`
  min-height: 150px;
  max-height: 340px;
  overflow-y: auto;
  padding: 12px 14px;
  border: 1px solid ${BORDER};
  border-radius: 0 0 10px 10px;
  font-size: 14px;
  line-height: 22px;
  color: ${INK};
  outline: none;

  &:focus-visible {
    border-color: ${ACCENT};
  }

  &:empty:before {
    content: attr(data-placeholder);
    color: #9aa4b2;
  }

  a {
    color: ${ACCENT};
    text-decoration: underline;
  }
  ul,
  ol {
    padding-left: 20px;
    margin: 6px 0;
  }
`;

export const RichPreview = styled.div`
  min-height: 150px;
  padding: 16px 18px;
  border: 1px solid ${BORDER};
  border-radius: 10px;
  background: #fbfcfe;

  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${INK};
    margin: 10px 0 8px;
  }
  .body {
    font-size: 14px;
    line-height: 22px;
    color: #344054;
    word-break: break-word;
  }
  .body a {
    color: ${ACCENT};
    text-decoration: underline;
  }
  .body ul,
  .body ol {
    padding-left: 20px;
  }
  .empty {
    color: #9aa4b2;
    font-size: 14px;
  }
  .preview-gallery {
    margin-top: 14px;
  }
`;

export const PreviewBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

export const PreviewBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  color: ${SUB};
  background: #eef2f7;

  &.topic {
    color: ${ACCENT};
    background: #04a5841a;
  }
  &.tag {
    color: #6172f3;
    background: #6172f31a;
  }
`;

export const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid ${BORDER};
  border-radius: 10px;
`;

export const TagChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 6px 0 10px;
  border-radius: 999px;
  font-size: 12.5px;
  font-weight: 600;
  color: #6172f3;
  background: #6172f314;
`;

export const TagInput = styled.input`
  flex: 1;
  min-width: 140px;
  height: 30px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  color: ${INK};

  &::placeholder {
    color: #9aa4b2;
  }
`;

export const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 10px;
`;

export const ImageThumb = styled.div`
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 10px;
  border: 1px solid ${BORDER};
  background-size: cover;
  background-position: center;
`;

export const RemoveDot = styled.button`
  position: absolute;
  top: 4px;
  right: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 999px;
  background: rgba(7, 11, 53, 0.72);
  color: #fff;
  cursor: pointer;

  &:hover {
    background: #e5484d;
  }
`;

export const AddImageTile = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  aspect-ratio: 1 / 1;
  border: 1px dashed #cdd5df;
  border-radius: 10px;
  background: #fbfcfe;
  color: ${SUB};
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;

  &:hover {
    border-color: ${ACCENT};
    color: ${ACCENT};
  }
`;

export const MediaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

export const MediaChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px 0 12px;
  border-radius: 8px;
  border: 1px solid ${BORDER};
  background: #fff;
  font-size: 12.5px;
  font-weight: 600;
  color: #344054;
  text-decoration: none;

  svg {
    color: ${ACCENT};
  }
`;

export const ModeToggle = styled.div`
  display: inline-flex;
  padding: 3px;
  border-radius: 8px;
  background: #f1f4f8;
  gap: 2px;
`;

export const ModeBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: ${SUB};
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;

  &.active {
    background: #fff;
    color: ${ACCENT};
    box-shadow: 0 1px 3px rgba(16, 24, 40, 0.08);
  }
`;

export const HelperText = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  color: #98a2b3;
`;
