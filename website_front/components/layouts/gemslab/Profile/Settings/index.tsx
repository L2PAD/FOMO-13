import React, { useContext, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import imageLoader from "../../../../../helpers/imageLoader";
import UserAvatar from "../../../../global/common/UserAvatar";
import { AuthContext, LoadingContext } from "../../../../global/Layout";
import updateUser from "../../../../../http/user/updateUser";
import {
  Form,
  FileInputWrapper,
  GradientButton,
  ErrorLabel,
  CheckboxList,
  AvatarWrapper,
  BioWrapper,
  BioTitle,
  SettingsColumns,
  SettingsBlock,
  BlockHeader,
  BlockBody,
  LocationWrapper,
  RowLabel,
  ConnectedWallet,
  CheckboxWrapper,
  SwitchWrapper,
} from "../styles";
import changeEmail from "../../../../../http/user/changeEmail";
import { ChangePasswordType } from "../../../../../types/global_types";
import changePassword from "../../../../../http/user/changePassword";
import updatePhoto from "../../../../../http/user/updatePhoto";
import Input from "../../../../global/common/Input";
import Checkbox from "../../../../global/common/Checkbox";
import CreateIcon from "../../../../global/Icons/CreateIcon";
import Button from "../../../../global/common/Button";
import Typography from "../../../../global/common/Typography";
import {
  DiscordIcon,
  EditIcon,
  InstagramIcon,
  LinkedinIcon,
  LinkIcon,
  MediumIcon,
  TelegramIcon,
  TikTokIcon,
  TwitterIcon,
} from "../../../../global/Icons";
import TextEditor from "../../../../global/common/text_editor/TextEditor";
import EditButton from "../../../../global/common/EditButton";
import InputWithLabel from "../../../../global/common/components_for_modals/input_with_label";
import SearchCountry from "../../../../global/SearchCountry";
import Switch from "../../../../UI/inputs/switch";
import UpdateEntityActions from "../../../../global/UpdateEntityActions";
import { useTranslation } from "i18n";

interface IInputsData {
  name?: string;
  username?: string;
  solanaAddress?: string;
  cosmosAddress?: string;
  polkadotAddress?: string;
  telegramNotification?: boolean;
  emailNotification?: boolean;
  regionData?: any;
  specialization?: string;
  email?: string;
}

interface IPasswods {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ISocialData {
  telegram?: string;
  discord?: string;
  twitter?: string;
  linkedin?: string;
  tiktok?: string;
  instagram?: string;
  medium?: string;
  linktree?: string;
}

const Settings = () => {
  const { translateText } = useTranslation();
  const [passError, setPassError] = useState<string>("");
  const [profileDisable, setProfileDisable] = useState(true);
  const [passwordDisable, setPasswordDisable] = useState(true);
  const [socialDisable, setSocialDisable] = useState(true);
  const [bioDisable, setBioDisable] = useState(true);
  const [file, setFile] = useState<any>();
  const { userData } = useContext(AuthContext);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [passwordsData, setPasswordsData] = useState<IPasswods>({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [inputsData, setInputsData] = useState<IInputsData>({
    name: userData.name,
    username: userData.username,
    email: userData.email,
    specialization: userData.specialization,
    regionData: userData.regionData,
    solanaAddress: userData.solanaAddress,
    cosmosAddress: userData.cosmosAddress,
    polkadotAddress: userData.polkadotAddress,
    telegramNotification: userData.telegramNotification,
    emailNotification: userData.emailNotification,
  });
  const [socialData, setSocialData] = useState<ISocialData>(
    userData.socialNetworks || {}
  );
  const [bio, setBio] = useState(userData.bio || "");
  const hiddenFileInput = useRef(null);

  const inputsHandler = (name: string, value: any, stateHandler: any): void => {
    stateHandler((prev: any) => {
      return { ...prev, [name]: value };
    });
  };

  const handleClick = () => {
    if (!profileDisable) {
      // @ts-ignore
      hiddenFileInput.current.click();
    }
  };

  const handleChange = (event: any) => {
    const fileUploaded = event.target.files[0];
    setFile(fileUploaded);
  };

  const resetData = (dataType: "profile" | "password" | "social"): void => {
    if (dataType === "profile") {
      setInputsData({
        name: userData.name,
        username: userData.username,
        email: userData.email,
        specialization: userData.specialization,
        regionData: userData.regionData || null,
        solanaAddress: userData.solanaAddress,
        cosmosAddress: userData.cosmosAddress,
        polkadotAddress: userData.polkadotAddress,
        telegramNotification: userData.telegramNotification,
        emailNotification: userData.emailNotification,
      });
      setProfileDisable(true);
    }
    if (dataType === "password") {
      setPasswordsData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordDisable(true);
    }
    if (dataType === "social") {
      setSocialData(userData.socialNetworks || {});
      setSocialDisable(true);
    }
  };

  const confirmUpdateUserData = async (): Promise<void> => {
    loadingStateHandler(true);

    const updateData = {
      name: inputsData.name || "",
      username: inputsData.username || "",
      specialization: inputsData.specialization,
      regionData: inputsData.regionData,
      solanaAddress: inputsData.solanaAddress,
      cosmosAddress: inputsData.cosmosAddress,
      polkadotAddress: inputsData.polkadotAddress,
      telegramNotification: inputsData.telegramNotification,
      emailNotification: inputsData.emailNotification,
    };

    const data = await updateUser(updateData);

    if (data) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Your profile has been successfully updated!")}</p>
        </div>
      );
    }

    if (inputsData.email !== userData.email) {
      await confirmChangeEmail();
      setInputsData((prev: any) => {
        return { ...prev, email: userData.email };
      });
    }

    setProfileDisable(true);
    loadingStateHandler(false);
  };

  const confirmUpdateSocialMedia = async (): Promise<void> => {
    loadingStateHandler(true);

    const isSuccess = await updateUser({ socialNetworks: socialData });

    if (isSuccess) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Your profile has been successfully updated!")}</p>
        </div>
      );
    }

    setSocialDisable(true);
    loadingStateHandler(false);
  };

  const confirmUpdateBio = async (): Promise<void> => {
    loadingStateHandler(true);

    const isSuccess = await updateUser({ bio });

    if (isSuccess) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("Your profile has been successfully updated!")}</p>
        </div>
      );
    }

    setBioDisable(true);
    loadingStateHandler(false);
  };

  const confirmChangeEmail = async (): Promise<void> => {
    if (!inputsData.email) return;

    loadingStateHandler(true);

    const isSuccess = await changeEmail(inputsData.email);

    if (isSuccess) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>
            {translateText("A link has been sent to your email to confirm the password change")}
          </p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  const confirmChangePassword = async (): Promise<void> => {
    loadingStateHandler(true);

    const passwords: ChangePasswordType = {
      oldPassword: passwordsData.oldPassword || "",
      newPassword: passwordsData.newPassword || "",
    };

    const results: { isSuccess: boolean; error: string } =
      await changePassword(passwords);

    if (results.isSuccess) {
      toast.success(
        <div>
          <h3>{translateText("Success!")}</h3>
          <p>{translateText("You have succesfuly change password")}</p>
        </div>
      );
    }

    if (!results.isSuccess && results.error) {
      setPassError(results.error);
      setTimeout(() => {
        setPassError("");
      }, 5000);
    }

    setPasswordsData({ oldPassword: "", newPassword: "", confirmPassword: "" });

    loadingStateHandler(false);
  };

  const confirmUpdatePhoto = async (event: any): Promise<void> => {
    loadingStateHandler(true);

    const img: File = event.target.files[0];

    const isSuccess = await updatePhoto(img);

    if (isSuccess) {
      window.location.reload();
    }

    loadingStateHandler(false);
  };

  const isPasswordValid = useMemo(() => {
    const isValidLength =
      passwordsData.oldPassword.length > 3 &&
      passwordsData.newPassword.length > 3 &&
      passwordsData.confirmPassword.length > 3;

    const isCorrectNewPass =
      passwordsData.confirmPassword === passwordsData.newPassword;

    return isValidLength && isCorrectNewPass;
  }, [passwordsData]);

  return (
    <>
      <Form>
        <AvatarWrapper>
          <UserAvatar
            size="big"
            variant="default"
            avatar={
              !userData.photo
                ? userData?.twitterData?.photo
                  ? //@ts-ignore
                    userData?.twitterData?.photo
                  : "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                : imageLoader(userData.photo)
            }
            name={translateText("New photo")}
          />
          <FileInputWrapper>
            <button className="btn-wrapper">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect width="24" height="24" rx="12" fill="white" />
                <path
                  d="M8.79961 8.08016V8.58016C8.97744 8.58016 9.14189 8.4857 9.2315 8.33209L8.79961 8.08016ZM9.91961 6.16016V5.66016C9.74178 5.66016 9.57732 5.75461 9.48772 5.90822L9.91961 6.16016ZM14.0796 6.16016L14.5115 5.90822C14.4219 5.75461 14.2574 5.66016 14.0796 5.66016V6.16016ZM15.1996 8.08016L14.7677 8.33209C14.8573 8.4857 15.0218 8.58016 15.1996 8.58016V8.08016ZM5.59961 16.2402H6.09961V9.68015H5.59961H5.09961V16.2402H5.59961ZM7.19961 8.08016V8.58016H8.79961V8.08016V7.58016H7.19961V8.08016ZM8.79961 8.08016L9.2315 8.33209L10.3515 6.41209L9.91961 6.16016L9.48772 5.90822L8.36772 7.82822L8.79961 8.08016ZM9.91961 6.16016V6.66016H14.0796V6.16016V5.66016H9.91961V6.16016ZM14.0796 6.16016L13.6477 6.41209L14.7677 8.33209L15.1996 8.08016L15.6315 7.82822L14.5115 5.90822L14.0796 6.16016ZM15.1996 8.08016V8.58016H16.7996V8.08016V7.58016H15.1996V8.08016ZM18.3996 9.68016H17.8996V16.2402H18.3996H18.8996V9.68016H18.3996ZM18.3996 16.2402H17.8996C17.8996 16.8477 17.4071 17.3402 16.7996 17.3402V17.8402V18.3402C17.9594 18.3402 18.8996 17.4 18.8996 16.2402H18.3996ZM16.7996 8.08016V8.58016C17.4071 8.58016 17.8996 9.07264 17.8996 9.68016H18.3996H18.8996C18.8996 8.52036 17.9594 7.58016 16.7996 7.58016V8.08016ZM5.59961 9.68015H6.09961C6.09961 9.07264 6.5921 8.58016 7.19961 8.58016V8.08016V7.58016C6.03981 7.58016 5.09961 8.52036 5.09961 9.68015H5.59961ZM7.19961 17.8402V17.3402C6.5921 17.3402 6.09961 16.8477 6.09961 16.2402H5.59961H5.09961C5.09961 17.4 6.03981 18.3402 7.19961 18.3402V17.8402ZM14.3996 12.5602H13.8996C13.8996 13.6095 13.0489 14.4602 11.9996 14.4602V14.9602V15.4602C13.6012 15.4602 14.8996 14.1618 14.8996 12.5602H14.3996ZM11.9996 14.9602V14.4602C10.9503 14.4602 10.0996 13.6095 10.0996 12.5602H9.59961H9.09961C9.09961 14.1618 10.398 15.4602 11.9996 15.4602V14.9602ZM9.59961 12.5602H10.0996C10.0996 11.5108 10.9503 10.6602 11.9996 10.6602V10.1602V9.66016C10.398 9.66016 9.09961 10.9585 9.09961 12.5602H9.59961ZM11.9996 10.1602V10.6602C13.0489 10.6602 13.8996 11.5108 13.8996 12.5602H14.3996H14.8996C14.8996 10.9585 13.6012 9.66016 11.9996 9.66016V10.1602ZM16.7996 17.8402V17.3402H7.19961V17.8402V18.3402H16.7996V17.8402Z"
                  fill="#738094"
                />
              </svg>
            </button>
            <input
              type="file"
              ref={hiddenFileInput}
              onChange={confirmUpdatePhoto}
            />
          </FileInputWrapper>
        </AvatarWrapper>
        <BioWrapper>
          <BioTitle>{translateText("Bio")}</BioTitle>
          <TextEditor
            value={bio}
            name="bio"
            handler={(name: string, value: string) => setBio(value)}
          />
          <div className="actions">
            <button
              onClick={confirmUpdateBio}
              style={{ padding: "8px" }}
              className="green-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
              >
                <path
                  d="M9.46578 4.63364L11.8658 7.03364M3.46582 13.0336L6.37648 12.4472C6.53099 12.416 6.67287 12.3399 6.7843 12.2284L13.3001 5.70909C13.6125 5.39652 13.6123 4.88986 13.2996 4.57756L11.9193 3.19884C11.6068 2.88666 11.1004 2.88687 10.7881 3.19931L4.27166 9.71935C4.16045 9.83062 4.08452 9.97221 4.05336 10.1264L3.46582 13.0336Z"
                  stroke="#04A584"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{translateText("Save Changes")}</span>
            </button>
            <button
              onClick={() => {
                setBio(userData?.bio || "");
              }}
              className="reset-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
              >
                <path
                  d="M3.74752 9.66797C4.42617 11.7973 6.36984 13.3346 8.6617 13.3346C11.518 13.3346 13.8334 10.9468 13.8334 8.0013C13.8334 5.05578 11.518 2.66797 8.6617 2.66797C6.74743 2.66797 5.07608 3.7405 4.18186 5.33464M5.75261 6.0013H3.16675V3.33464"
                  stroke="#738094"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{translateText("Reset")}</span>
            </button>
          </div>
        </BioWrapper>
      </Form>
      <SettingsColumns>
        <div className="column">
          <SettingsBlock>
            <BlockHeader>
              <h2>{translateText("Profile Information")}</h2>

              <UpdateEntityActions
                isButtonText={false}
                className="profile"
                updateEditState={(value: boolean) => setProfileDisable(false)}
                isActiveEdit={!profileDisable}
                onSave={confirmUpdateUserData}
                onCancel={() => setProfileDisable(true)}
                onReset={() => resetData("profile")}
              />
            </BlockHeader>
            <BlockBody variant="main">
              <InputWithLabel
                disabled={profileDisable}
                value={inputsData?.name || ""}
                placeholder={translateText("Enter your full name")}
                label={translateText("Your Name")}
                onChange={(value: string, name?: string) =>
                  inputsHandler("name", value, setInputsData)
                }
              />
              <InputWithLabel
                disabled={profileDisable}
                value={inputsData?.username || ""}
                placeholder={translateText("@ yourhandle")}
                label={translateText("Username")}
                onChange={(value: string, name?: string) =>
                  inputsHandler("username", value, setInputsData)
                }
              />
              <InputWithLabel
                disabled={profileDisable}
                value={inputsData?.email || ""}
                placeholder={translateText("Enter your email address")}
                label={translateText("Email")}
                onChange={(value: string, name?: string) =>
                  inputsHandler("email", value, setInputsData)
                }
              />
              <InputWithLabel
                disabled={profileDisable}
                value={inputsData?.specialization || ""}
                placeholder={translateText("What are you focused on? (e.g., DeFi, NFT, AI, Gaming)")}
                label={translateText("Specialization")}
                onChange={(value: string, name?: string) =>
                  inputsHandler("specialization", value, setInputsData)
                }
              />
              <LocationWrapper>
                <RowLabel>{translateText("Location")}</RowLabel>
                <SearchCountry
                  disabled={profileDisable}
                  placeholder={translateText("Enter your location (e.g., Lisbon, Portugal)")}
                  className="small-search"
                  selectedCountry={inputsData?.regionData || null}
                  onChange={(country: any) =>
                    inputsHandler("regionData", country, setInputsData)
                  }
                />
              </LocationWrapper>
              <ConnectedWallet>
                <RowLabel>{translateText("Connected Wallet")}</RowLabel>
                <div className="connectedWallet">{userData?.wallet || ""}</div>
              </ConnectedWallet>
              <InputWithLabel
                disabled={profileDisable}
                value={inputsData?.solanaAddress || ""}
                placeholder={translateText("Enter your Solana wallet address (e.g., HN7A...YWrH)")}
                label={translateText("Solana Wallet")}
                onChange={(value: string, name?: string) =>
                  inputsHandler("solanaAddress", value, setInputsData)
                }
              />
              <InputWithLabel
                disabled={profileDisable}
                value={inputsData?.cosmosAddress || ""}
                placeholder={translateText("Enter your Cosmos wallet address (e.g., cosmos1n2g...xwuv)")}
                label={translateText("Cosmos Wallet")}
                onChange={(value: string, name?: string) =>
                  inputsHandler("cosmosAddress", value, setInputsData)
                }
              />
              <InputWithLabel
                disabled={profileDisable}
                value={inputsData?.polkadotAddress || ""}
                placeholder={translateText("Enter your Polkadot wallet address (e.g., 5FNP...5rhZ)")}
                label={translateText("Polkadot Wallet")}
                onChange={(value: string, name?: string) =>
                  inputsHandler("polkadotAddress", value, setInputsData)
                }
              />
              <CheckboxWrapper>
                <RowLabel>{translateText("Notification Preferences")}</RowLabel>
                <CheckboxList>
                  <SwitchWrapper>
                    <Switch
                      disabled={profileDisable}
                      variant="small"
                      checked={!!inputsData.telegramNotification}
                      onChange={() =>
                        inputsHandler(
                          "telegramNotification",
                          !inputsData.telegramNotification,
                          setInputsData
                        )
                      }
                    />
                    <div className="switch-label">
                      {translateText("Telegram Notifications")}
                    </div>
                  </SwitchWrapper>
                  <SwitchWrapper>
                    <Switch
                      disabled={profileDisable}
                      variant="small"
                      checked={!!inputsData.emailNotification}
                      onChange={() =>
                        inputsHandler(
                          "emailNotification",
                          !inputsData.emailNotification,
                          setInputsData
                        )
                      }
                    />
                    <div className="switch-label">
                      {translateText("Email Notifications")}
                    </div>
                  </SwitchWrapper>
                </CheckboxList>
              </CheckboxWrapper>
            </BlockBody>
          </SettingsBlock>
        </div>
        <div className="column">
          <SettingsBlock>
            <BlockHeader>
              <h2>{translateText("Social Network")}</h2>
              <UpdateEntityActions
                isButtonText={false}
                className="profile"
                updateEditState={(value: boolean) => setSocialDisable(false)}
                isActiveEdit={!socialDisable}
                onSave={confirmUpdateSocialMedia}
                onCancel={() => setSocialDisable(true)}
                onReset={() => resetData("social")}
              />
            </BlockHeader>
            <BlockBody className="grid" variant="main">
              <Input
                type="text"
                labelText={
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#070B35",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <TelegramIcon type="new" /> Telegram
                  </p>
                }
                placeholder="https://t.me/username"
                value={socialData.telegram || ""}
                onChange={(value) =>
                  inputsHandler("telegram", value, setSocialData)
                }
                disabled={socialDisable}
              />
              <Input
                type="text"
                labelText={
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#070B35",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <TikTokIcon type="new" fill="#070B35" /> TikTok
                  </p>
                }
                placeholder="https://www.tiktok.com/@username"
                value={socialData.tiktok || ""}
                onChange={(value) =>
                  inputsHandler("tiktok", value, setSocialData)
                }
                disabled={socialDisable}
              />
              <Input
                type="text"
                labelText={
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#070B35",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <DiscordIcon type="new" /> Discord
                  </p>
                }
                placeholder="username#1111"
                value={socialData.discord || ""}
                onChange={(value) =>
                  inputsHandler("discord", value, setSocialData)
                }
                disabled={socialDisable}
              />
              <Input
                type="text"
                labelText={
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#070B35",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <InstagramIcon type="new" /> Instagram
                  </p>
                }
                placeholder="https://www.instagram.com/username"
                value={socialData.instagram || ""}
                onChange={(value) =>
                  inputsHandler("instagram", value, setSocialData)
                }
                disabled={socialDisable}
              />
              <Input
                type="text"
                labelText={
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#070B35",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <TwitterIcon type="new" /> Twitter
                  </p>
                }
                placeholder="https://twitter.com/username"
                value={socialData.twitter || ""}
                onChange={(value) =>
                  inputsHandler("twitter", value, setSocialData)
                }
                disabled={socialDisable}
              />
              <Input
                type="text"
                labelText={
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#070B35",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <LinkedinIcon type="new" /> Linkedin
                  </p>
                }
                placeholder="https://linkedin.com/username"
                value={socialData.linkedin || ""}
                onChange={(value) =>
                  inputsHandler("linkedin", value, setSocialData)
                }
                disabled={socialDisable}
              />

              <Input
                type="text"
                labelText={
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#070B35",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <MediumIcon type="new" fill="#070B35" /> Medium
                  </p>
                }
                placeholder="https://medium.com/@username"
                value={socialData.medium || ""}
                onChange={(value) =>
                  inputsHandler("medium", value, setSocialData)
                }
                disabled={socialDisable}
              />
              <Input
                type="text"
                labelText={
                  <p
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#070B35",
                      fontWeight: "var(--font-weight-semibold)",
                      fontSize: "16px",
                      marginBottom: "12px",
                    }}
                  >
                    <LinkIcon type="new" /> Linktree
                  </p>
                }
                placeholder="https://linktr.ee/username"
                value={socialData.linktree || ""}
                onChange={(value) =>
                  inputsHandler("linktree", value, setSocialData)
                }
                disabled={socialDisable}
              />
            </BlockBody>
          </SettingsBlock>
        </div>
      </SettingsColumns>
    </>
  );
};

export default Settings;
