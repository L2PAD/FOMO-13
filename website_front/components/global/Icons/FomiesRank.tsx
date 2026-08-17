import React, { FC } from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  span {
    font-weight: 600;
    font-size: 14px;
  }
`;

const ranks = {
  1: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M6.26711 11.2672L6.25879 17.4172C6.25879 18.1672 6.78379 18.5339 7.43379 18.2255L9.66712 17.1672C9.85045 17.0755 10.1588 17.0755 10.3421 17.1672L12.5838 18.2255C13.2255 18.5255 13.7588 18.1672 13.7588 17.4172V11.1172"
        fill="#FF5858"
      />
      <path
        d="M6.26711 11.2672L6.25879 17.4172C6.25879 18.1672 6.78379 18.5339 7.43379 18.2255L9.66712 17.1672C9.85045 17.0755 10.1588 17.0755 10.3421 17.1672L12.5838 18.2255C13.2255 18.5255 13.7588 18.1672 13.7588 17.4172V11.1172"
        stroke="#FF5858"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 12.5013C6.8934 12.5013 4.375 10.0762 4.375 7.08464C4.375 4.09309 6.8934 1.66797 10 1.66797C13.1066 1.66797 15.625 4.09309 15.625 7.08464C15.625 10.0762 13.1066 12.5013 10 12.5013Z"
        fill="#FFC702"
        stroke="#FFC702"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  2: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M6.26711 11.2672L6.25879 17.4172C6.25879 18.1672 6.78379 18.5339 7.43379 18.2255L9.66712 17.1672C9.85045 17.0755 10.1588 17.0755 10.3421 17.1672L12.5838 18.2255C13.2255 18.5255 13.7588 18.1672 13.7588 17.4172V11.1172"
        fill="#FF5858"
      />
      <path
        d="M6.26711 11.2672L6.25879 17.4172C6.25879 18.1672 6.78379 18.5339 7.43379 18.2255L9.66712 17.1672C9.85045 17.0755 10.1588 17.0755 10.3421 17.1672L12.5838 18.2255C13.2255 18.5255 13.7588 18.1672 13.7588 17.4172V11.1172"
        stroke="#FF5858"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 12.5013C6.8934 12.5013 4.375 10.0762 4.375 7.08464C4.375 4.09309 6.8934 1.66797 10 1.66797C13.1066 1.66797 15.625 4.09309 15.625 7.08464C15.625 10.0762 13.1066 12.5013 10 12.5013Z"
        fill="#B5BCC7"
        stroke="#B5BCC7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  3: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
    >
      <path
        d="M6.26711 11.2672L6.25879 17.4172C6.25879 18.1672 6.78379 18.5339 7.43379 18.2255L9.66712 17.1672C9.85045 17.0755 10.1588 17.0755 10.3421 17.1672L12.5838 18.2255C13.2255 18.5255 13.7588 18.1672 13.7588 17.4172V11.1172"
        fill="#FF5858"
      />
      <path
        d="M6.26711 11.2672L6.25879 17.4172C6.25879 18.1672 6.78379 18.5339 7.43379 18.2255L9.66712 17.1672C9.85045 17.0755 10.1588 17.0755 10.3421 17.1672L12.5838 18.2255C13.2255 18.5255 13.7588 18.1672 13.7588 17.4172V11.1172"
        stroke="#FF5858"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 12.5013C6.8934 12.5013 4.375 10.0762 4.375 7.08464C4.375 4.09309 6.8934 1.66797 10 1.66797C13.1066 1.66797 15.625 4.09309 15.625 7.08464C15.625 10.0762 13.1066 12.5013 10 12.5013Z"
        fill="#995528"
        stroke="#995528"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

interface IProps {
  rank: number;
}

const FomiesRank: FC<IProps> = ({ rank }) => {
  const getRankIcon = (index: number): any => {
    switch (index) {
      case 1:
        return (
          <>
            {ranks[1]}
            <span>{rank}</span>
          </>
        );
      case 2:
        return (
          <>
            {ranks[2]}
            <span>{rank}</span>
          </>
        );
      case 3:
        return (
          <>
            {ranks[3]}
            <span>{rank}</span>
          </>
        );
      default:
        return <span>{index}</span>;
    }
  };

  return <Wrapper>{getRankIcon(rank)}</Wrapper>;
};

export default FomiesRank;
