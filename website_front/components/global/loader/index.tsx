import React from "react";
import { ColorRing } from "react-loader-spinner";

export default function Loader({ isVisible }: { isVisible: boolean }) {
  return (
    <div className="loader-main-wrapper">
      <ColorRing
        visible={isVisible}
        height="150"
        width="150"
        wrapperClass="blocks-wrapper"
        colors={["#04A584", "#04A584", "#04A584", "#04A584", "#04A584"]}
      />
    </div>
  );
}
