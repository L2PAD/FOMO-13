import React, { FC } from "react";
import { buildStyles, CircularProgressbar } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Wrapper } from "./styles";

interface Props {
  rating: number;
  variant: "success" | "medium" | "warn";
  showPercent?: boolean;
}

const RatingCircle: FC<Props> = ({ rating, variant, showPercent = true }) => {
  const getColors = (): { pathColor: string; textColor: string } => {
    if (rating > 65) {
      return { pathColor: "rgba(4,165,132, 1)", textColor: "#04A584" };
    }

    if (rating < 65 && rating > 35) {
      return { pathColor: "#FFC702", textColor: "#FFC702" };
    }

    return { pathColor: "#E42736", textColor: "#E42736" };
  };

  return (
    <Wrapper>
      {/*//@ts-ignore*/}
      <CircularProgressbar
        value={rating}
        text={`${rating}${showPercent ? "%" : ""}`}
        styles={buildStyles({
          rotation: 0.25,
          pathColor: getColors().pathColor,
          textColor: getColors().textColor,
          trailColor: "transparent",
        })}
      >
        {rating > 100 ? 100 : rating}
      </CircularProgressbar>
    </Wrapper>
  );
};

export default RatingCircle;
