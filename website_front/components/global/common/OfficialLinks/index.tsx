import React, { FC, useState } from "react";
import Button from "../Button";
import { InputLabel, Inputs, LinksWrapper, Wrapper } from "./styles";
import Input from "../Input";
import { ISocialMediaItem } from "../../../../types/global_types";
import {
  getServiceByUrl,
  ServiceLink,
} from "../../../../helpers/getServiceByUrl";
import Image from "next/image";
import imageLoader from "../../../../helpers/imageLoader";
import { CloseIcon } from "../../Icons";

interface IProps {
  websiteLogo?: string;
  socialLinks: Array<ISocialMediaItem>;
  onChange: (items: Array<ISocialMediaItem>) => void;
}

const OfficialLinks: FC<IProps> = ({ websiteLogo, socialLinks, onChange }) => {
  const addInputs = (): void => {
    onChange([...socialLinks, { href: "", icon: "", name: "" }]);
  };

  const removeInput = (id: number): void => {
    onChange(
      socialLinks.filter((item, i: number) => {
        return id !== i;
      })
    );
  };

  const linkInputHandler = (id: number, href: string): void => {
    const updatedLinks: Array<ISocialMediaItem> = socialLinks.map(
      (item: ISocialMediaItem, index: number) => {
        if (index === id) {
          return { ...item, href };
        }

        return item;
      }
    );

    onChange(updatedLinks);
  };

  return (
    <Wrapper>
      <Inputs>
        {socialLinks.map((item: any, i: number) => {
          return (
            <Input
              key={i}
              className="input-width"
              placeholder="Paste URL here"
              leftIcon={
                <InputLabel>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="17"
                    viewBox="0 0 16 17"
                    fill="none"
                  >
                    <path
                      d="M4.91998 7.29253L3.43101 8.7815C2.87492 9.33759 2.55514 10.0942 2.56098 10.8894C2.56683 11.6846 2.87961 12.4459 3.46209 13.0104C4.02655 13.5929 4.78797 13.9057 5.58305 13.9115C6.39626 13.9175 7.135 13.6157 7.69112 13.0596L9.18009 11.5706M11.082 9.70514L12.5709 8.21617C13.127 7.66008 13.4468 6.90344 13.441 6.10823C13.4351 5.31302 13.1223 4.55177 12.5399 3.98728C11.9755 3.42295 11.2142 3.11015 10.419 3.1043C9.62383 3.09846 8.86708 3.40009 8.31096 3.9562L6.82199 5.44517M5.74305 10.7169L10.21 6.25004"
                      stroke="#738094"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </InputLabel>
              }
              value={item.href}
              onChange={(value: string) => linkInputHandler(i, value)}
            />
          );
        })}
      </Inputs>
      <Button onClick={addInputs} className="add-link" variant="outlined">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="9"
          height="8"
          viewBox="0 0 9 8"
          fill="none"
        >
          <path
            d="M4.50078 0.800781L4.50078 7.20078M7.70078 4.00078L1.30078 4.00078"
            stroke="#04A584"
            strokeLinecap="round"
          />
        </svg>
        Add Link
      </Button>
      <LinksWrapper>
        {socialLinks.map((item: ISocialMediaItem, i: number) => {
          const service: ServiceLink = getServiceByUrl(item.href);
          return (
            <div key={i}>
              {service ? (
                <Image src={service?.icon} alt={item.name} />
              ) : (
                <img src={imageLoader(String(websiteLogo))} alt={websiteLogo} />
              )}
              <span>{service?.domain || item.href}</span>
              <button className="remove-btn" onClick={() => removeInput(i)}>
                <CloseIcon fill="#738094" />
              </button>
            </div>
          );
        })}
      </LinksWrapper>
    </Wrapper>
  );
};

export default OfficialLinks;
