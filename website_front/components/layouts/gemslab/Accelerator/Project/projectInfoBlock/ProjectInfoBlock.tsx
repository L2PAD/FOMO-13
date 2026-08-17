import React, { FC } from "react";
import Image from "next/image";
import imageLoader from "../../../../../../helpers/imageLoader";
import styles from "./project-info-block.module.scss";

const ProjectInfoBlock: FC<any> = ({ img, steps }) => {
  return (
    <div className={styles.body}>
      {typeof img === "string" ? (
        <Image
          loader={() => imageLoader(img)}
          width="580"
          height="342"
          src={img}
          alt="description-img"
        />
      ) : (
        <></>
      )}
    </div>
  );
};

export default ProjectInfoBlock;
