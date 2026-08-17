import React, { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { LOCALES, useTranslation } from "i18n";
import { Locale } from "i18n/types";
import {
  LanguageButton,
  LanguageMenu,
  LanguageOption,
  LanguageOptionCheck,
  LanguagePlanetIcon,
  LanguageSwitcherWrapper,
} from "./styles";

const LanguageSwitchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 20 20"
    fill="none"
  >
    <mask id="path-1-inside-1_3535_6216" fill="white">
      <path d="M20 10C20 15.5228 15.5228 20 10 20C4.47715 20 0 15.5228 0 10C0 4.47715 4.47715 0 10 0C15.5228 0 20 4.47715 20 10Z"></path>
    </mask>
    <path
      d="M3.5891e-08 9.65C-0.1933 9.65 -0.35 9.8067 -0.35 10C-0.35 10.1933 -0.1933 10.35 -3.5891e-08 10.35L3.5891e-08 9.65ZM19.375 10.35C19.5683 10.35 19.725 10.1933 19.725 10C19.725 9.8067 19.5683 9.65 19.375 9.65V10.35ZM10 19.65C9.51174 19.65 9.019 19.4253 8.54032 18.9625C8.05996 18.4981 7.61138 17.8092 7.22706 16.9308C6.45889 15.175 5.975 12.7248 5.975 10H5.275C5.275 12.798 5.77049 15.3479 6.58575 17.2114C6.99316 18.1426 7.48731 18.9181 8.05378 19.4658C8.62194 20.0151 9.28014 20.35 10 20.35V19.65ZM5.975 10C5.975 7.27517 6.45889 4.82504 7.22706 3.06922C7.61138 2.19079 8.05996 1.50189 8.54032 1.03748C9.019 0.574706 9.51174 0.35 10 0.35V-0.35C9.28014 -0.35 8.62194 -0.0150617 8.05378 0.534217C7.48731 1.08187 6.99316 1.85743 6.58575 2.78865C5.77049 4.65211 5.275 7.20198 5.275 10H5.975ZM10 20.35C10.7199 20.35 11.3781 20.0151 11.9462 19.4658C12.5127 18.9181 13.0068 18.1426 13.4142 17.2114C14.2295 15.3479 14.725 12.798 14.725 10H14.025C14.025 12.7248 13.5411 15.175 12.7729 16.9308C12.3886 17.8092 11.94 18.4981 11.4597 18.9625C10.981 19.4253 10.4883 19.65 10 19.65V20.35ZM14.725 10C14.725 7.20198 14.2295 4.65211 13.4142 2.78865C13.0068 1.85743 12.5127 1.08187 11.9462 0.534217C11.3781 -0.0150617 10.7199 -0.35 10 -0.35V0.35C10.4883 0.35 10.981 0.574706 11.4597 1.03748C11.94 1.50189 12.3886 2.19079 12.7729 3.06922C13.5411 4.82504 14.025 7.27517 14.025 10H14.725ZM-3.5891e-08 10.35L19.375 10.35V9.65L3.5891e-08 9.65L-3.5891e-08 10.35ZM19.3 10C19.3 15.1362 15.1362 19.3 10 19.3V20.7C15.9094 20.7 20.7 15.9094 20.7 10H19.3ZM10 19.3C4.86375 19.3 0.7 15.1362 0.7 10H-0.7C-0.7 15.9094 4.09055 20.7 10 20.7V19.3ZM0.7 10C0.7 4.86375 4.86375 0.7 10 0.7V-0.7C4.09055 -0.7 -0.7 4.09055 -0.7 10H0.7ZM10 0.7C15.1362 0.7 19.3 4.86375 19.3 10H20.7C20.7 4.09055 15.9094 -0.7 10 -0.7V0.7Z"
      fill="currentColor"
      mask="url(#path-1-inside-1_3535_6216)"
    />
  </svg>
);

const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const activeLocale =
    LOCALES.find((item) => item.code === locale) || LOCALES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (nextLocale: Locale) => {
    setLocale(nextLocale);
    setIsOpen(false);
  };

  return (
    <LanguageSwitcherWrapper ref={wrapperRef}>
      <LanguageButton
        aria-label={t("language.label")}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        isOpen={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
      >
        <LanguagePlanetIcon aria-hidden="true">
          <LanguageSwitchIcon />
        </LanguagePlanetIcon>
        <span>{t(activeLocale.labelKey)}</span>
      </LanguageButton>

      <LanguageMenu isOpen={isOpen} role="menu">
        {LOCALES.map((item) => {
          const isActive = locale === item.code;

          return (
            <LanguageOption
              isActive={isActive}
              key={item.code}
              onClick={() => handleSelect(item.code)}
              role="menuitem"
              type="button"
            >
              <span>{t(item.labelKey)}</span>
            </LanguageOption>
          );
        })}
      </LanguageMenu>
    </LanguageSwitcherWrapper>
  );
};

export default LanguageSwitcher;
