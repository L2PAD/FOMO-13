import React from "react";
import styled from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  div {
    font-size: 14px;
    color: #738094;
    margin-left: 4px;
  }
`;

const Region: React.FC<{ children: any }> = ({ children }) => {
  return (
    <Wrapper>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="18"
        viewBox="0 0 14 18"
        fill="none"
      >
        <path
          d="M6.99988 17C6.99988 17 13.2608 11.4348 13.2608 7.26087C13.2608 3.80309 10.4577 1 6.99988 1C3.5421 1 0.739014 3.80309 0.739014 7.26087C0.739014 11.4348 6.99988 17 6.99988 17Z"
          stroke="#FF5858"
        />
        <path
          d="M9.00014 7.00013C9.00014 8.1047 8.10471 9.00013 7.00014 9.00013C5.89557 9.00013 5.00014 8.1047 5.00014 7.00013C5.00014 5.89556 5.89557 5.00013 7.00014 5.00013C8.10471 5.00013 9.00014 5.89556 9.00014 7.00013Z"
          stroke="#FF5858"
        />
      </svg>
      <div className="region-value">{children}</div>
    </Wrapper>
  );
};

export default Region;
