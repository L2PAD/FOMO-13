import React from "react";
import moment from "moment";
import { FeedItemWrapper, FeedTabWrapper } from "../../styles";

const FeedTab = () => {
  return (
    <FeedTabWrapper>
      {Array(4)
        .fill("")
        .map((item, i) => {
          return (
            <FeedItemWrapper variant="default" key={i + item}>
              <h6>{moment().format("HH:mm MMM D, YYYY")}</h6>
              <h5>Amet minim</h5>
              <p>
                Amet minim mollit non deserunt ullamco est sit aliqua dolor do
                amet sint. Velit officia consequat duis enim velit mollit.
                Exercitation veniam consequat sunt nostrud amet. Amet minim
                mollit non deserunt ullamco est sit aliqua dolor do amet sint.
                Velit officia consequat duis enim velit mollit.
              </p>
            </FeedItemWrapper>
          );
        })}
    </FeedTabWrapper>
  );
};

export default FeedTab;
