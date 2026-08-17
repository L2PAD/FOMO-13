import React, { FC } from "react";
import { IconInterface } from "./IconIfterface";

const CheckIcon: FC<IconInterface & { big?: boolean }> = ({
  className,
  fill = "black",
  big = false,
}) => {
  return (
    // eslint-disable-next-line react/jsx-no-useless-fragment
    <>
      {big ? (
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path
            d="M66.184 29.1547C68.024 20.0293 59.9707 11.976 50.8453 13.816C45.6933 6.06133 34.304 6.06133 29.1547 13.816C20.0293 11.976 11.976 20.0293 13.816 29.1547C6.06133 34.3067 6.06133 45.696 13.816 50.8453C11.976 59.9707 20.0293 68.024 29.1547 66.184C34.3067 73.9387 45.696 73.9387 50.8453 66.184C59.9707 68.024 68.024 59.9707 66.184 50.8453C73.9387 45.6933 73.9387 34.3067 66.184 29.1547ZM57.8853 31.2187L37.7253 51.3787C37.224 51.88 36.5467 52.16 35.84 52.16C35.1333 52.16 34.4533 51.88 33.9547 51.3787L24.7467 42.1707C23.704 41.128 23.704 39.4427 24.7467 38.4C25.7893 37.3573 27.4747 37.3573 28.5173 38.4L35.84 45.7227L54.1147 27.448C55.1573 26.4053 56.8427 26.4053 57.8853 27.448C58.928 28.4907 58.928 30.176 57.8853 31.2187Z"
            fill={fill}
          />
        </svg>
      ) : (
        <svg
          width="17"
          height="12"
          viewBox="0 0 17 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={className}
        >
          <path
            d="M1 5.5L6 10L16 1"
            stroke={fill || "#04A584"}
            strokeWidth="2"
          />
        </svg>
      )}
    </>
  );
};

export default CheckIcon;
