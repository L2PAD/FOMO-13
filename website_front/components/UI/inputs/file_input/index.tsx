/* eslint-disable */
import React, { FC } from "react";
import { useStyles } from "./styles";
import { LogoImage } from "../../../global/Navigation/styles";
import imageLoader from "../../../../helpers/imageLoader";

interface Props {
  data: any;
  inputsHandler: any;
}

const FileInput: FC<Props> = ({ data, inputsHandler }) => {
  const { input, inputWrapper, label, img, wrapper, p } = useStyles();

  return (
    <div className={wrapper}>
      <p className={p}>Image</p>
      <div className={inputWrapper}>
        {data.image ? (
          typeof data.image === "string" ? (
            <img className={img} src={imageLoader(data.image)} />
          ) : (
            <img
              className={img}
              src={URL.createObjectURL(data.image)}
              alt="logo"
            />
          )
        ) : (
          <LogoImage />
        )}
        <label className={label} htmlFor="logo-input">
          + Add image
        </label>
        <input
          className={input}
          id="logo-input"
          name="logo"
          type="file"
          onChange={(event) => {
            if (event.target.files) {
              inputsHandler(event.target.files[0], "image");
            }
          }}
        />
      </div>
    </div>
  );
};

export default FileInput;
