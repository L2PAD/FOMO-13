import styled from "styled-components";

export const DigestsSection = styled.section`
  margin-top: 40px;
  padding-top: 8px;
`;

export const DigestsHead = styled.div`
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 18px;

  .sub {
    font-size: 13px;
    color: #98a2b3;
  }
`;

export const DigestsTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 22px;
  font-weight: 700;
  color: #070b35;
  margin: 0;
`;

export const DigestsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 18px;
`;

export const DCard = styled.button`
  text-align: left;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  border-radius: 16px;
  background: #ffffff;
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    border-color: #04a584;
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(16, 24, 40, 0.08);
  }
`;

export const DCover = styled.div<{ src?: string }>`
  width: 100%;
  height: 132px;
  background: ${({ src }) =>
    src
      ? `#eef1f5 url(${src}) center/cover no-repeat`
      : "linear-gradient(135deg, #04a58422, #6172f322)"};
`;

export const DBody = styled.div`
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #98a2b3;
  font-weight: 600;
`;

export const DTitle = styled.p`
  font-size: 16px;
  font-weight: 700;
  color: #070b35;
  margin: 0;
  line-height: 21px;
`;

export const DSummary = styled.p`
  font-size: 13px;
  color: #667085;
  line-height: 19px;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

export const DReadMore = styled.span`
  font-size: 13px;
  font-weight: 700;
  color: #04a584;
  margin-top: 2px;
`;


/* ── full digest article page (news-feed TopicDetail style) ── */
export const ArticleTitle = styled.h1`
  font-size: 34px;
  line-height: 42px;
  font-weight: 700;
  color: #070b35;
  margin: 0 0 16px;

  @media (max-width: 640px) {
    font-size: 26px;
    line-height: 33px;
  }
`;

export const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

export const AuthorAvatar = styled.div`
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #04a584, #6172f3);
  color: #fff;
  font-weight: 700;

  img { width: 100%; height: 100%; object-fit: cover; }
`;

export const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const AuthorName = styled.span`
  font-size: 15px;
  font-weight: 700;
  color: #070b35;
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const AuthorHandle = styled.span`
  font-size: 13px;
  color: #98a2b3;
`;

export const ArticleDate = styled.span`
  margin-left: auto;
  font-size: 13px;
  color: #98a2b3;
  white-space: nowrap;

  @media (max-width: 640px) { display: none; }
`;

export const Lead = styled.p`
  font-size: 18px;
  line-height: 27px;
  color: #475467;
  font-weight: 500;
  margin: 0 0 20px;
`;

export const ArticleCover = styled.div<{ src?: string }>`
  width: 100%;
  height: 320px;
  border-radius: 16px;
  margin-bottom: 24px;
  background: ${({ src }) =>
    src
      ? `#eef1f5 url(${src}) center/cover no-repeat`
      : "linear-gradient(135deg, #04a58422, #6172f322)"};

  @media (max-width: 640px) { height: 200px; }
`;

export const ArticleBody = styled.div`
  font-size: 16px;
  line-height: 26px;
  color: #344054;

  h2 { font-size: 24px; font-weight: 700; color: #070b35; margin: 26px 0 12px; }
  h3 { font-size: 20px; font-weight: 700; color: #070b35; margin: 22px 0 10px; }
  h4 { font-size: 16px; font-weight: 700; color: #070b35; margin: 18px 0 8px; }
  p { margin: 0 0 14px; }
  ul, ol { margin: 0 0 16px 20px; }
  li { margin-bottom: 8px; }
  a { color: #04a584; text-decoration: underline; }
  strong { color: #101828; }
  blockquote {
    margin: 16px 0;
    padding: 8px 16px;
    border-left: 3px solid #04a584;
    background: #f5fbf9;
    color: #475467;
    border-radius: 0 8px 8px 0;
  }
  img { max-width: 100%; border-radius: 12px; margin: 12px 0; }
  iframe { max-width: 100%; border-radius: 12px; margin: 12px 0; }
`;

export const ReactionsBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 26px;
  padding-top: 18px;
  border-top: 1px solid var(--color-border-subtle, #eef1f5);
`;

export const ReactionBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid var(--color-border-subtle, #eef1f5);
  background: #fff;
  color: #475467;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;

  &:hover { border-color: #04a584; color: #04a584; }
  &.active { background: #eafaf5; border-color: #04a584; color: #04a584; }
`;
