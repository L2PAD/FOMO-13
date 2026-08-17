import React, { CSSProperties, FC } from "react";
import moment from "moment";
import { Date, Text, Wrapper } from "./styles";
import { sanitizedHtml } from "../../../../helpers/sanitizeHtml";

interface IProps {
  className?: string | "gray-description";
  isDate?: boolean;
  isVisible: boolean;
  text: string;
  date: Date;
  style?: CSSProperties;
}

const DescriptionComponent: FC<IProps> = ({
  className = "",
  isDate = true,
  isVisible,
  text,
  date,
  style,
}) => {
  return (
    <Wrapper className={className} isVisible={isVisible} style={style}>
      {isDate ? (
        <Date>Updated: {moment(date).format("DD.MM.YYYY HH:mm")}</Date>
      ) : (
        <></>
      )}
      <Text
        className="description-modal-text"
        dangerouslySetInnerHTML={sanitizedHtml(text)}
      />
    </Wrapper>
  );
};

export default DescriptionComponent;
