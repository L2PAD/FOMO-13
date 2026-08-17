import React, { FC } from "react";
import Placeholder from "../Placeholder";

interface IProps {
  height?: string;
  rows?: number;
}

const PlaceholderTable: FC<IProps> = ({ height = "82px", rows = 10 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, index) => (
        <Placeholder
          key={`placeholder-table-row-${index}`}
          width="100%"
          height={height}
          borderRadius="8px"
          marginBottom="2px"
        />
      ))}
    </>
  );
};

export default PlaceholderTable;
