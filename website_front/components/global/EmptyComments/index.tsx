import React, { FC } from "react";
import styled from "styled-components";
import CreateButton from "../common/CreateButton";

const Wrapper = styled.div`
  max-width: 280px;
  margin: 60px auto 0;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: fit-content;

  & .info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 20px;
  }

  h4 {
    margin: 12px 0 16px;
    font-weight: var(--font-weight-semibold);
    font-size: 16px;
    line-height: 100%;
    text-align: center;
  }

  p {
    font-size: 16px;
    text-align: center;
  }
`;

interface IProps {
  className?: string;
}

const EmptyComments: FC<IProps> = ({ className }) => {
  return (
    <Wrapper className={className}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M8.39941 8.39844H15.5994M8.39941 13.1984H12.5994M21.5994 11.9984C21.5994 13.3785 21.3082 14.6905 20.7839 15.8764L21.6012 21.5975L16.6983 20.3718C15.3094 21.1529 13.7064 21.5984 11.9994 21.5984C6.69748 21.5984 2.39941 17.3004 2.39941 11.9984C2.39941 6.6965 6.69748 2.39844 11.9994 2.39844C17.3013 2.39844 21.5994 6.6965 21.5994 11.9984Z"
          stroke="#04A584"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="info-wrapper">
        <h4>No comments yet</h4>
        <p>Start the conversation and share your thoughts!</p>
      </div>
    </Wrapper>
  );
};

export default EmptyComments;
