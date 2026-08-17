import styled from "styled-components";

export const RichWrap = styled.div`
  font-size: 16px;
  font-weight: var(--font-weight-regular);
  line-height: 1.6;
  color: #1a1d26;
  word-break: break-word;

  &.compact {
    font-size: 14.5px;
    color: #3a3f4c;
  }
`;

export const RichHtml = styled.div`
  p {
    margin: 12px 0;
  }
  p:first-child {
    margin-top: 0;
  }
  ul,
  ol {
    margin: 12px 0;
    padding-left: 24px;
    li {
      margin: 8px 0;
    }
  }
  h1,
  h2,
  h3,
  h4 {
    margin: 18px 0 8px;
    font-weight: var(--font-weight-semibold);
    line-height: 1.3;
  }
  h1 {
    font-size: 22px;
  }
  h2 {
    font-size: 20px;
  }
  h3 {
    font-size: 18px;
  }
  strong {
    font-weight: var(--font-weight-semibold);
  }
  em {
    font-style: italic;
  }
  a {
    color: #04a584;
    text-decoration: underline;
    &:hover {
      opacity: 0.85;
    }
  }
  blockquote {
    margin: 12px 0;
    padding: 8px 16px;
    border-left: 3px solid #04a584;
    background: #f4faf8;
    border-radius: 0 8px 8px 0;
    color: #3a3f4c;
  }
  code {
    font-family: "SFMono-Regular", Menlo, Consolas, monospace;
    background: #f1f3f5;
    padding: 2px 6px;
    border-radius: 6px;
    font-size: 13.5px;
  }
  pre {
    background: #0f1115;
    color: #e6edf3;
    padding: 14px 16px;
    border-radius: 12px;
    overflow-x: auto;
    margin: 12px 0;
    code {
      background: transparent;
      color: inherit;
      padding: 0;
    }
  }
  img {
    max-width: 100%;
    border-radius: 12px;
    margin: 10px 0;
  }
`;

export const RichText = styled.div`
  white-space: pre-wrap;
`;

export const Carousel = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 14px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding-bottom: 6px;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { height: 8px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 8px; }
  &::-webkit-scrollbar-track { background: transparent; }

  .slide {
    scroll-snap-align: start;
    flex: 0 0 auto;
    width: 340px;
    max-width: 82%;
    border-radius: 12px;
    overflow: hidden;
    background: #eef1f4;
    border: 1px solid #e6eaf0;
  }
  .slide img {
    display: block;
    width: 100%;
    height: 220px;
    object-fit: cover;
  }
  .slide .video {
    position: relative;
    width: 100%;
    padding-top: 56.25%;
    background: #000;
  }
  .slide .video iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

export const Gallery = styled.div<{ $count: number }>`
  display: grid;
  gap: 8px;
  margin-top: 14px;
  grid-template-columns: ${({ $count }) =>
    $count === 1 ? "1fr" : "repeat(2, 1fr)"};

  &.compact {
    margin-top: 10px;
  }

  .media-cell {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: #eef1f4;
    border: 1px solid #e6eaf0;
  }

  .media-cell img {
    display: block;
    width: 100%;
    height: 100%;
    max-height: 420px;
    object-fit: cover;
  }

  &.compact .media-cell img {
    max-height: 180px;
  }
`;

export const EmbedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 14px;
`;

export const VideoEmbed = styled.div`
  position: relative;
  width: 100%;
  padding-top: 56.25%;
  border-radius: 12px;
  overflow: hidden;
  background: #000;

  iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
`;

export const LinkCard = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
  padding: 10px 14px;
  border: 1px solid #e6eaf0;
  border-radius: 12px;
  background: #f8fafb;
  color: #04a584;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: background 0.15s ease;

  &:hover {
    background: #eef7f4;
  }

  span.url {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #52606d;
  }
`;

export const TagsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;

  &.compact {
    margin-top: 10px;
  }

  .tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 999px;
    background: #f1f3f5;
    color: #52606d;
    font-size: 12px;
    font-weight: var(--font-weight-medium);
    line-height: 1.6;
  }
`;
