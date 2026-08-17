import React, { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import copy from "clipboard-copy";
import { useRouter, useSearchParams } from "next/navigation";
import { useConnectWallet } from "../../../hooks/useConnectWallet";
import { API, DISCORD_LINK, TELEGRAM_LINK } from "../../../config/api";
import inviteBg from "../../../assets/images/invite-bg.png";
import BlueLinearBtn from "../../UI/buttons/BlueLinearBtn";
import BlueCheckbox from "../../UI/inputs/BlueCheckbox";
import Step from "./step/Step";
import { IUser, StepType, UserType } from "../../../types/global_types";
import { stepsInitial } from "../../../staticContent/stepsInitial";
import checkCode from "../../../http/auth/checkCode";
import {
  Wrapper,
  ImageWrapper,
  CodeWrapper,
  CodeInput,
  RightsWrapper,
  HeadWrapper,
  StepsWrapper,
  ConfirmBtnWrapper,
  SuccessAuth,
  Title,
  TitleWrapper,
  BackButton,
} from "./styles";
import getUserByToken from "../../../http/user/getUserByToken";
import BackInviteIcon from "../../global/Icons/BackInviteIcon";

const activeSteps = [
  { ...stepsInitial[0], isActive: true, isAvailable: false },
  { ...stepsInitial[1], isActive: true, isAvailable: false },
  { ...stepsInitial[2], isActive: true, isAvailable: false },
  { ...stepsInitial[3], isActive: true, isAvailable: false },
];

const InviteUser = () => {
  const [code, setCode] = useState<any>({
    0: "",
    1: "",
    2: "",
    3: "",
    4: "",
  });
  const [focusIndex, setFocusIndex] = useState<number>(0);
  const [isAccept, setIsAccept] = useState<boolean>(false);
  const [isCodeConfirm, setIsCodeConfirm] = useState<boolean>(false);
  const { connectWallet, accounts } = useConnectWallet();
  const [isDiscordConnected, setIsDiscordConnected] = useState<boolean>(false);
  const [isTwitterConnected, setIsTwitterConnected] = useState<boolean>(false);
  const [isTelegramConnected, setIsTelegramConnected] =
    useState<boolean>(false);
  const isWalletConnected = !!accounts[0];
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const router: any = useRouter();
  const isError = useSearchParams().get("error");
  const errorText = useSearchParams().get("errorText");
  const codeWrapperRef = useRef<any>(null);
  const toastShownRef = useRef(false);

  const codeInputHandler = (value: string, index: number): void => {
    const inputs = codeWrapperRef?.current?.querySelectorAll("input");

    if (!value && focusIndex === index) return;

    setFocusIndex(index);

    setCode((prev: any) => {
      return {
        ...prev,
        [index]: value.split("").pop(),
      };
    });

    if (value && index !== 4) {
      inputs[index + 1].focus();
    }

    if (!value && index !== 0) {
      inputs[index - 1].focus();
    }
  };

  const backspaceHandler = (
    value: string,
    isBackspace: boolean,
    index: number
  ): void => {
    const inputs = codeWrapperRef?.current?.querySelectorAll("input");

    if (!value && isBackspace && index > 0) {
      inputs[index - 1].focus();
      setFocusIndex(index - 1);
      setCode((prev: any) => {
        return {
          ...prev,
          [index - 1]: "",
        };
      });
    }
    if (value && isBackspace) {
      index !== 0 && inputs[index - 1].focus();
      setFocusIndex(index - 1);
      setCode((prev: any) => {
        return {
          ...prev,
          [index]: "",
        };
      });
    }
  };

  const getCodeString = (): string => {
    let currentCode = "";

    for (const key in code) {
      currentCode += code[key];
    }

    return currentCode;
  };

  const confirmCheckCode = async (): Promise<void> => {
    const refCode: string = getCodeString();

    const isValid = await checkCode(refCode);

    if (isValid) {
      localStorage.setItem("fomo-code", refCode);
    } else {
      toast.error(
        <div>
          <h3>Invite code is not valid!</h3>
        </div>
      );
    }

    setIsCodeConfirm(isValid);
  };

  const confirmConnectWallet = async (): Promise<boolean> => {
    const { isSuccess, user }: { isSuccess: boolean; user: IUser | null } =
      await connectWallet();

    if (!isSuccess) return false;

    const authState =
      isSuccess && user?.twitterData && user?.discordData && user?.telegramData;

    if (authState) {
      setIsTelegramConnected(!!user?.telegramData?.username);
      setIsDiscordConnected(!!user?.discordData?.username);
      setIsTwitterConnected(!!user?.twitterData?.username);
      setIsCodeConfirm(true);

      setIsAuth(!!authState);
    }

    return isSuccess;
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>): void => {
    const pastedData = event.clipboardData?.getData("Text") || "";
    if (pastedData.length !== 5) return;

    const inputs = codeWrapperRef?.current?.querySelectorAll("input");
    const newCode: { [key: number]: string } = {};

    pastedData.split("").forEach((char, index) => {
      newCode[index] = char;
      inputs?.[index]?.focus();
    });

    setCode(newCode);
    event.preventDefault();
  };

  const handleCopy = (): void => {
    if (!code[4]) return;

    copy(
      Object.entries(code)
        .map((item: any) => item[1])
        .join("")
    );

    toast.success(
      <div>
        <h3>Invite code copied!</h3>
      </div>
    );
  };

  const stepsClickDispatch = (step: StepType): void => {
    if (step.handler === "wallet") {
      confirmConnectWallet();
    }
    if (step.handler === "twitter") {
      router.push(`${API}/twitter`);
    }
    if (step.handler === "discord") {
      router.push(DISCORD_LINK);
    }
    if (step.handler === "telegram") {
      router.push(TELEGRAM_LINK);
    }
  };

  const checkUserAuth = async (): Promise<boolean> => {
    const fomoCode = localStorage.getItem("fomo-code");

    if (!fomoCode) return false;
    if (isAuth) return true;

    const userData = await getUserByToken();

    if (fomoCode) {
      setCode({
        0: fomoCode[0],
        1: fomoCode[1],
        2: fomoCode[2],
        3: fomoCode[3],
        4: fomoCode[4],
      });
    }

    if (!userData?.twitterData && isWalletConnected && !isAuth) {
      return false;
    }

    setIsTelegramConnected(!!userData?.telegramData?.username);
    setIsDiscordConnected(!!userData?.discordData?.username);
    setIsTwitterConnected(!!userData?.twitterData?.username);

    const authState =
      isWalletConnected &&
      userData?.twitterData &&
      userData?.discordData &&
      userData?.telegramData;

    setIsAuth(!!authState);

    return authState;
  };

  const renderAuthSteps = (): Array<StepType> => {
    if (isAuth) {
      return activeSteps;
    }

    if (isWalletConnected && !isAuth) {
      checkUserAuth().then((value: boolean) => {
        setIsAuth(value);
      });
    }

    const currentStepsState: Array<StepType> = [
      {
        ...stepsInitial[0],
        isActive: isWalletConnected,
        isAvailable: isCodeConfirm && !isWalletConnected,
      },
      {
        ...stepsInitial[1],
        isActive: isTwitterConnected,
        isAvailable: !!isWalletConnected && !isTwitterConnected,
      },
      {
        ...stepsInitial[2],
        isActive: isDiscordConnected,
        isAvailable: !!isTwitterConnected && !isDiscordConnected,
      },
      {
        ...stepsInitial[3],
        isActive: !!isTelegramConnected,
        isAvailable: !!isDiscordConnected && !isTelegramConnected,
      },
    ];

    return currentStepsState;
  };

  const renderedSteps: Array<StepType> = useMemo(() => {
    return renderAuthSteps();
  }, [
    isAuth,
    isCodeConfirm,
    isWalletConnected,
    isDiscordConnected,
    isTelegramConnected,
    isTwitterConnected,
  ]);

  useEffect(() => {
    checkUserAuth();
  }, [isWalletConnected, isAuth]);

  useEffect(() => {
    if (isError === "true" && errorText && !toastShownRef.current) {
      toast.error(
        <div>
          <h3>Oops, something went wrong</h3>
          <p>{errorText}</p>
        </div>,
        {
          autoClose: 20000,
        }
      );

      toastShownRef.current = true;
    }
  }, [isError, errorText]);

  return (
    <Wrapper>
      <ImageWrapper>
        <Image alt="fomoland invite" src={inviteBg} />
      </ImageWrapper>
      <BackButton>
        <Link href="/">
          <BackInviteIcon />
        </Link>
      </BackButton>
      <TitleWrapper>
        <Title>
          <Link href="/">
            <svg width="453" height="127" viewBox="0 0 453 127" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g filter="url(#filter0_f_2_454)">
                <path d="M78.5631 30.08C79.3631 30.08 79.9231 30.3733 80.2431 30.96C80.6165 31.4933 80.8031 32.1333 80.8031 32.88V39.2C80.8031 39.9467 80.6165 40.5867 80.2431 41.12C79.9231 41.6533 79.3631 41.92 78.5631 41.92H32.5631C31.7631 41.92 31.2031 41.6267 30.8831 41.04C30.5631 40.4533 30.4031 39.8133 30.4031 39.12V32.96C30.4031 32.2667 30.5631 31.6267 30.8831 31.04C31.2031 30.4 31.7631 30.08 32.5631 30.08H78.5631ZM78.1631 56.88C78.9631 56.88 79.5231 57.1733 79.8431 57.76C80.2165 58.2933 80.4031 58.9333 80.4031 59.68V66C80.4031 66.7467 80.2165 67.3867 79.8431 67.92C79.5231 68.4533 78.9631 68.72 78.1631 68.72H42.4031V93.2C42.4031 93.9467 42.2431 94.6133 41.9231 95.2C41.6031 95.7333 41.0165 96 40.1631 96H32.8031C32.0031 96 31.4165 95.7333 31.0431 95.2C30.7231 94.6133 30.5631 93.9467 30.5631 93.2V62.32C30.5631 60.9867 31.0965 59.76 32.1631 58.64C33.2831 57.4667 34.8565 56.88 36.8831 56.88H78.1631ZM169.022 30.08C173.182 30.08 176.542 30.72 179.102 32C181.715 33.2267 183.742 34.96 185.182 37.2C186.622 39.3867 187.582 42.0267 188.062 45.12C188.542 48.16 188.782 51.4933 188.782 55.12V70.96C188.782 74.5867 188.542 77.9467 188.062 81.04C187.582 84.08 186.622 86.72 185.182 88.96C183.795 91.2 181.795 92.96 179.182 94.24C176.622 95.4667 173.235 96.08 169.022 96.08H149.502C145.342 96.08 141.955 95.44 139.342 94.16C136.782 92.88 134.782 91.12 133.342 88.88C131.955 86.64 131.022 84 130.542 80.96C130.062 77.8667 129.822 74.5333 129.822 70.96V55.12C129.822 51.5467 130.062 48.24 130.542 45.2C131.022 42.1067 131.982 39.44 133.422 37.2C134.862 34.96 136.862 33.2267 139.422 32C141.982 30.72 145.342 30.08 149.502 30.08H169.022ZM176.862 53.76C176.862 52.1067 176.809 50.56 176.702 49.12C176.595 47.68 176.275 46.4267 175.742 45.36C175.262 44.2933 174.462 43.4667 173.342 42.88C172.222 42.24 170.649 41.92 168.622 41.92H149.902C147.929 41.92 146.382 42.24 145.262 42.88C144.142 43.4667 143.315 44.2933 142.782 45.36C142.249 46.4267 141.929 47.68 141.822 49.12C141.715 50.56 141.662 52.1067 141.662 53.76V72.4C141.662 74.0533 141.715 75.6 141.822 77.04C141.929 78.48 142.249 79.7333 142.782 80.8C143.315 81.8133 144.142 82.64 145.262 83.28C146.382 83.8667 147.929 84.16 149.902 84.16H168.622C170.649 84.16 172.222 83.8667 173.342 83.28C174.462 82.64 175.262 81.8133 175.742 80.8C176.275 79.7333 176.595 78.48 176.702 77.04C176.809 75.6 176.862 74.0533 176.862 72.4V53.76ZM306.172 30.08C307.879 30.08 309.185 30.4267 310.092 31.12C310.999 31.76 311.639 32.5867 312.012 33.6C312.439 34.56 312.679 35.6533 312.732 36.88C312.839 38.1067 312.892 39.28 312.892 40.4V93.2C312.892 93.9467 312.705 94.6133 312.332 95.2C311.959 95.7333 311.372 96 310.572 96H303.692C302.892 96 302.305 95.7333 301.932 95.2C301.612 94.6133 301.452 93.9467 301.452 93.2V45.04H301.052L287.132 79.12C286.652 80.3467 286.145 81.5467 285.612 82.72C285.079 83.84 284.412 84.8533 283.612 85.76C282.812 86.6133 281.825 87.3067 280.652 87.84C279.479 88.3733 277.985 88.64 276.172 88.64C274.892 88.64 273.745 88.5333 272.732 88.32C271.719 88.0533 270.785 87.6 269.932 86.96C269.079 86.2667 268.252 85.3067 267.452 84.08C266.705 82.8 265.932 81.1467 265.132 79.12L251.212 45.04H250.812V93.2C250.812 93.9467 250.625 94.6133 250.252 95.2C249.932 95.7333 249.372 96 248.572 96H241.692C240.892 96 240.305 95.7333 239.932 95.2C239.559 94.6133 239.372 93.9467 239.372 93.2V40.4C239.372 39.12 239.425 37.8667 239.532 36.64C239.639 35.36 239.905 34.24 240.332 33.28C240.759 32.32 241.425 31.5467 242.332 30.96C243.239 30.3733 244.519 30.08 246.172 30.08H253.532C254.972 30.08 256.119 30.2667 256.972 30.64C257.825 30.96 258.519 31.4667 259.052 32.16C259.585 32.8 260.012 33.6 260.332 34.56C260.652 35.4667 261.052 36.48 261.532 37.6L275.772 73.28H276.652L291.052 37.6C291.532 36.48 291.932 35.4667 292.252 34.56C292.572 33.6 292.999 32.8 293.532 32.16C294.065 31.52 294.732 31.0133 295.532 30.64C296.385 30.2667 297.532 30.08 298.972 30.08H306.172ZM402.647 30.08C406.807 30.08 410.167 30.72 412.727 32C415.34 33.2267 417.367 34.96 418.807 37.2C420.247 39.3867 421.207 42.0267 421.687 45.12C422.167 48.16 422.407 51.4933 422.407 55.12V70.96C422.407 74.5867 422.167 77.9467 421.687 81.04C421.207 84.08 420.247 86.72 418.807 88.96C417.42 91.2 415.42 92.96 412.807 94.24C410.247 95.4667 406.86 96.08 402.647 96.08H383.127C378.967 96.08 375.58 95.44 372.967 94.16C370.407 92.88 368.407 91.12 366.967 88.88C365.58 86.64 364.647 84 364.167 80.96C363.687 77.8667 363.447 74.5333 363.447 70.96V55.12C363.447 51.5467 363.687 48.24 364.167 45.2C364.647 42.1067 365.607 39.44 367.047 37.2C368.487 34.96 370.487 33.2267 373.047 32C375.607 30.72 378.967 30.08 383.127 30.08H402.647ZM410.487 53.76C410.487 52.1067 410.434 50.56 410.327 49.12C410.22 47.68 409.9 46.4267 409.367 45.36C408.887 44.2933 408.087 43.4667 406.967 42.88C405.847 42.24 404.274 41.92 402.247 41.92H383.527C381.554 41.92 380.007 42.24 378.887 42.88C377.767 43.4667 376.94 44.2933 376.407 45.36C375.874 46.4267 375.554 47.68 375.447 49.12C375.34 50.56 375.287 52.1067 375.287 53.76V72.4C375.287 74.0533 375.34 75.6 375.447 77.04C375.554 78.48 375.874 79.7333 376.407 80.8C376.94 81.8133 377.767 82.64 378.887 83.28C380.007 83.8667 381.554 84.16 383.527 84.16H402.247C404.274 84.16 405.847 83.8667 406.967 83.28C408.087 82.64 408.887 81.8133 409.367 80.8C409.9 79.7333 410.22 78.48 410.327 77.04C410.434 75.6 410.487 74.0533 410.487 72.4V53.76Z" fill="#FF0000" />
              </g>
              <path d="M78.5631 30.08C79.3631 30.08 79.9231 30.3733 80.2431 30.96C80.6165 31.4933 80.8031 32.1333 80.8031 32.88V39.2C80.8031 39.9467 80.6165 40.5867 80.2431 41.12C79.9231 41.6533 79.3631 41.92 78.5631 41.92H32.5631C31.7631 41.92 31.2031 41.6267 30.8831 41.04C30.5631 40.4533 30.4031 39.8133 30.4031 39.12V32.96C30.4031 32.2667 30.5631 31.6267 30.8831 31.04C31.2031 30.4 31.7631 30.08 32.5631 30.08H78.5631ZM78.1631 56.88C78.9631 56.88 79.5231 57.1733 79.8431 57.76C80.2165 58.2933 80.4031 58.9333 80.4031 59.68V66C80.4031 66.7467 80.2165 67.3867 79.8431 67.92C79.5231 68.4533 78.9631 68.72 78.1631 68.72H42.4031V93.2C42.4031 93.9467 42.2431 94.6133 41.9231 95.2C41.6031 95.7333 41.0165 96 40.1631 96H32.8031C32.0031 96 31.4165 95.7333 31.0431 95.2C30.7231 94.6133 30.5631 93.9467 30.5631 93.2V62.32C30.5631 60.9867 31.0965 59.76 32.1631 58.64C33.2831 57.4667 34.8565 56.88 36.8831 56.88H78.1631ZM169.022 30.08C173.182 30.08 176.542 30.72 179.102 32C181.715 33.2267 183.742 34.96 185.182 37.2C186.622 39.3867 187.582 42.0267 188.062 45.12C188.542 48.16 188.782 51.4933 188.782 55.12V70.96C188.782 74.5867 188.542 77.9467 188.062 81.04C187.582 84.08 186.622 86.72 185.182 88.96C183.795 91.2 181.795 92.96 179.182 94.24C176.622 95.4667 173.235 96.08 169.022 96.08H149.502C145.342 96.08 141.955 95.44 139.342 94.16C136.782 92.88 134.782 91.12 133.342 88.88C131.955 86.64 131.022 84 130.542 80.96C130.062 77.8667 129.822 74.5333 129.822 70.96V55.12C129.822 51.5467 130.062 48.24 130.542 45.2C131.022 42.1067 131.982 39.44 133.422 37.2C134.862 34.96 136.862 33.2267 139.422 32C141.982 30.72 145.342 30.08 149.502 30.08H169.022ZM176.862 53.76C176.862 52.1067 176.809 50.56 176.702 49.12C176.595 47.68 176.275 46.4267 175.742 45.36C175.262 44.2933 174.462 43.4667 173.342 42.88C172.222 42.24 170.649 41.92 168.622 41.92H149.902C147.929 41.92 146.382 42.24 145.262 42.88C144.142 43.4667 143.315 44.2933 142.782 45.36C142.249 46.4267 141.929 47.68 141.822 49.12C141.715 50.56 141.662 52.1067 141.662 53.76V72.4C141.662 74.0533 141.715 75.6 141.822 77.04C141.929 78.48 142.249 79.7333 142.782 80.8C143.315 81.8133 144.142 82.64 145.262 83.28C146.382 83.8667 147.929 84.16 149.902 84.16H168.622C170.649 84.16 172.222 83.8667 173.342 83.28C174.462 82.64 175.262 81.8133 175.742 80.8C176.275 79.7333 176.595 78.48 176.702 77.04C176.809 75.6 176.862 74.0533 176.862 72.4V53.76ZM306.172 30.08C307.879 30.08 309.185 30.4267 310.092 31.12C310.999 31.76 311.639 32.5867 312.012 33.6C312.439 34.56 312.679 35.6533 312.732 36.88C312.839 38.1067 312.892 39.28 312.892 40.4V93.2C312.892 93.9467 312.705 94.6133 312.332 95.2C311.959 95.7333 311.372 96 310.572 96H303.692C302.892 96 302.305 95.7333 301.932 95.2C301.612 94.6133 301.452 93.9467 301.452 93.2V45.04H301.052L287.132 79.12C286.652 80.3467 286.145 81.5467 285.612 82.72C285.079 83.84 284.412 84.8533 283.612 85.76C282.812 86.6133 281.825 87.3067 280.652 87.84C279.479 88.3733 277.985 88.64 276.172 88.64C274.892 88.64 273.745 88.5333 272.732 88.32C271.719 88.0533 270.785 87.6 269.932 86.96C269.079 86.2667 268.252 85.3067 267.452 84.08C266.705 82.8 265.932 81.1467 265.132 79.12L251.212 45.04H250.812V93.2C250.812 93.9467 250.625 94.6133 250.252 95.2C249.932 95.7333 249.372 96 248.572 96H241.692C240.892 96 240.305 95.7333 239.932 95.2C239.559 94.6133 239.372 93.9467 239.372 93.2V40.4C239.372 39.12 239.425 37.8667 239.532 36.64C239.639 35.36 239.905 34.24 240.332 33.28C240.759 32.32 241.425 31.5467 242.332 30.96C243.239 30.3733 244.519 30.08 246.172 30.08H253.532C254.972 30.08 256.119 30.2667 256.972 30.64C257.825 30.96 258.519 31.4667 259.052 32.16C259.585 32.8 260.012 33.6 260.332 34.56C260.652 35.4667 261.052 36.48 261.532 37.6L275.772 73.28H276.652L291.052 37.6C291.532 36.48 291.932 35.4667 292.252 34.56C292.572 33.6 292.999 32.8 293.532 32.16C294.065 31.52 294.732 31.0133 295.532 30.64C296.385 30.2667 297.532 30.08 298.972 30.08H306.172ZM402.647 30.08C406.807 30.08 410.167 30.72 412.727 32C415.34 33.2267 417.367 34.96 418.807 37.2C420.247 39.3867 421.207 42.0267 421.687 45.12C422.167 48.16 422.407 51.4933 422.407 55.12V70.96C422.407 74.5867 422.167 77.9467 421.687 81.04C421.207 84.08 420.247 86.72 418.807 88.96C417.42 91.2 415.42 92.96 412.807 94.24C410.247 95.4667 406.86 96.08 402.647 96.08H383.127C378.967 96.08 375.58 95.44 372.967 94.16C370.407 92.88 368.407 91.12 366.967 88.88C365.58 86.64 364.647 84 364.167 80.96C363.687 77.8667 363.447 74.5333 363.447 70.96V55.12C363.447 51.5467 363.687 48.24 364.167 45.2C364.647 42.1067 365.607 39.44 367.047 37.2C368.487 34.96 370.487 33.2267 373.047 32C375.607 30.72 378.967 30.08 383.127 30.08H402.647ZM410.487 53.76C410.487 52.1067 410.434 50.56 410.327 49.12C410.22 47.68 409.9 46.4267 409.367 45.36C408.887 44.2933 408.087 43.4667 406.967 42.88C405.847 42.24 404.274 41.92 402.247 41.92H383.527C381.554 41.92 380.007 42.24 378.887 42.88C377.767 43.4667 376.94 44.2933 376.407 45.36C375.874 46.4267 375.554 47.68 375.447 49.12C375.34 50.56 375.287 52.1067 375.287 53.76V72.4C375.287 74.0533 375.34 75.6 375.447 77.04C375.554 78.48 375.874 79.7333 376.407 80.8C376.94 81.8133 377.767 82.64 378.887 83.28C380.007 83.8667 381.554 84.16 383.527 84.16H402.247C404.274 84.16 405.847 83.8667 406.967 83.28C408.087 82.64 408.887 81.8133 409.367 80.8C409.9 79.7333 410.22 78.48 410.327 77.04C410.434 75.6 410.487 74.0533 410.487 72.4V53.76Z" fill="white" />
              <defs>
                <filter id="filter0_f_2_454" x="0.402344" y="0.0799561" width="452.004" height="126" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
                  <feFlood flood-opacity="0" result="BackgroundImageFix" />
                  <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
                  <feGaussianBlur stdDeviation="15" result="effect1_foregroundBlur_2_454" />
                </filter>
              </defs>
            </svg>

          </Link>
        </Title>
      </TitleWrapper>
      {!isAuth ? <p>Enter invite code to claim your points</p> : <></>}

      {isAuth ? (
        <SuccessAuth>Success! You are logged in to FOMO</SuccessAuth>
      ) : (
        <HeadWrapper>
          <CodeWrapper
            ref={codeWrapperRef}
            onPaste={handlePaste}
            onCopy={handleCopy}
          >
            {[0, 1, 2, 3, 4].map((index) => (
              <CodeInput
                key={index}
                value={code[index]}
                onClick={() => setFocusIndex(index)}
                onKeyDown={(e) =>
                  backspaceHandler(code[index], e.key === "Backspace", index)
                }
                onChange={(e) => codeInputHandler(e.target.value, index)}
              />
            ))}
          </CodeWrapper>
          <RightsWrapper>
            <BlueCheckbox
              isChecked={isAccept}
              onClick={() => setIsAccept((prev) => !prev)}
            />
            <div>
              I have read and accept the <a>Privacy Policy</a> and{" "}
              <a>Terms and Conditions</a>
            </div>
          </RightsWrapper>
          <BlueLinearBtn
            disabled={!isAccept}
            onClick={confirmCheckCode}
            text="Enter Invite Code"
          />
        </HeadWrapper>
      )}
      <StepsWrapper>
        {renderedSteps.map((step: StepType) => {
          return (
            <Step key={step.index} step={step} onClick={stepsClickDispatch} />
          );
        })}
      </StepsWrapper>
      <ConfirmBtnWrapper>
        <BlueLinearBtn
          disabled={!isAuth}
          text="Dive into FOMO"
          onClick={() => window.location.replace("/")}
        />
      </ConfirmBtnWrapper>
    </Wrapper>
  );
};

export default InviteUser;
