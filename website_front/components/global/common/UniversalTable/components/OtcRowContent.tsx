import React from "react";
import type { UniversalTableCaseProps } from "./shared";
import DealsRowContent from "./DealsRowContent";

const OtcRowContent = (props: UniversalTableCaseProps) => {
  return <DealsRowContent {...props} />;
};

export default OtcRowContent;
