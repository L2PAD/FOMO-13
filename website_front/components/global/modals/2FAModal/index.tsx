/* eslint-disable */
import React, { FC, useContext, useState } from "react";
import { toast } from "react-toastify";
import copy from "clipboard-copy";
import Button from "../../common/Button";
import MainModal from "../../common/MainModal";
import {
  ButtonWrapper,
  CodeInputWrapper,
  Form,
  ListWrapper,
  QrCode,
  QrCodeDetails,
  QrCodeWrapper,
} from "./styles";
import { ErrorText, TwoFACodeWrapper } from "../AuthModal/styles";
import { ErrorLabel } from "../../../layouts/gemslab/Profile/styles";
import verify2FA from "../../../../http/auth/verify2FA";
import { LoadingContext } from "../../Layout";
import disable2FA from "../../../../http/auth/disable2FA";

interface Props {
  qr: string;
  setupCode?: string;
  state2FA?: boolean;
  isVisible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  refetchQr: () => Promise<void>;
}

const TwoFAModal: FC<Props> = ({
  qr,
  setupCode,
  state2FA,
  isVisible,
  onClose,
  onSuccess,
  refetchQr,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isError, setIsError] = useState(false);
  const { loadingStateHandler } = useContext(LoadingContext);
  const [isFACodeError, setIsFACodeError] = useState<boolean>(false);

  const handlePaste = () => {
    navigator.clipboard
      .readText()
      .then((text) => {
        setInputValue(text);
      })
      .catch((error) => {
        console.error("Error pasting text: ", error);
      });
  };

  const confirmUpdate2FAState = async (e: any): Promise<void> => {
    e.preventDefault();

    loadingStateHandler(true);

    const { isSuccess } = state2FA
      ? await disable2FA(inputValue)
      : await verify2FA(inputValue);

    if (isSuccess) {
      toast.success(
        state2FA ? (
          <div>
            <h3>Two-factor authentication has been successfully disabled.</h3>
            <p>
              You will now not be required to verify your identity with a code
              when logging in.
            </p>
          </div>
        ) : (
          <div>
            <h3>Two-factor authentication has been successfully enabled.</h3>
            <p>
              You will now be required to verify your identity with a code when
              logging in.
            </p>
          </div>
        )
      );
      onSuccess();
    }

    setIsError(!isSuccess);

    loadingStateHandler(false);
  };

  const handleChange = (e: any) => {
    setInputValue(e.target.value);
  };

  const copyKey = (): void => {
    copy(setupCode || "");
    toast.success(
      <div>
        <h3>Setup Key copied!</h3>
      </div>
    );
  };

  return (
    <MainModal
      isVisible={!!isVisible}
      onClose={onClose}
      title={
        state2FA ? "Disable 2FA authentication" : "Set up your authenticator"
      }
      variant={"820"}
    >
      {state2FA ? (
        <TwoFACodeWrapper onSubmit={confirmUpdate2FAState}>
          <div className="fa-subtitle">
            Go to your authenticator and enter the received code
          </div>
          <CodeInputWrapper>
            <p>Code from the authenticator</p>
            <div className="input">
              <input
                type="text"
                placeholder="Enter the 6-digit code"
                value={inputValue}
                onChange={(e: any) => setInputValue(e.target.value)}
              />
            </div>
            <div className="code-label">Code expires in 30 seconds</div>
          </CodeInputWrapper>
          {isFACodeError ? (
            <ErrorLabel style={{ marginBottom: "20px" }}>
              Invalid code. Please try again
            </ErrorLabel>
          ) : (
            <></>
          )}
          <ButtonWrapper>
            <Button type={"submit"} variant={"primary"} onClick={() => {}}>
              Confirm
            </Button>
          </ButtonWrapper>
        </TwoFACodeWrapper>
      ) : (
        <Form onSubmit={confirmUpdate2FAState}>
          <ListWrapper>
            <div className="list-item">
              <div className="list-marker"></div>
              <div className="list-text">
                Open your Authenticator app and tap <span>“Add”</span>
              </div>
            </div>
            <div className="list-item">
              <div className="list-marker"></div>
              <div className="list-text">
                Scan the QR code or enter the setup key manually
              </div>
            </div>
          </ListWrapper>
          <QrCodeWrapper>
            <QrCode>{qr ? <img src={qr} alt="qr" /> : <></>}</QrCode>
            <QrCodeDetails>
              <div className="details-block">
                <div className="details-key">Setup Key</div>
                <div onClick={copyKey} tabIndex={0} className="details-value">
                  {setupCode || ""}
                </div>
              </div>
              <button type="button" onClick={refetchQr} className="refetch-btn">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 13 13"
                  fill="none"
                >
                  <path
                    d="M10.9481 3.93374C10.0215 2.33407 8.28952 1.25781 6.30586 1.25781C4.05675 1.25781 2.13124 2.64138 1.33622 4.60272M9.3204 4.60272H12V1.92679M1.71858 9.28559C2.64521 10.8853 4.37715 11.9615 6.36081 11.9615C8.60991 11.9615 10.5354 10.5779 11.3304 8.61661M3.34626 8.61661H0.666667V11.2925"
                    stroke="#070B35"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Refresh
              </button>
            </QrCodeDetails>
          </QrCodeWrapper>
          <ListWrapper>
            <div className="list-item">
              <div className="list-marker"></div>
              <div className="list-text">
                A new code will appear in your app
              </div>
            </div>
            <div className="list-item">
              <div className="list-marker"></div>
              <div className="list-text">Enter the code below</div>
            </div>
          </ListWrapper>
          <CodeInputWrapper>
            <p>Code from the authenticator</p>
            <div className="input">
              <input
                type="text"
                placeholder="Enter the 6-digit code"
                value={inputValue}
                onChange={handleChange}
              />
            </div>
            <div className="code-label">Code expires in 30 seconds</div>
          </CodeInputWrapper>
          {isError ? (
            <ErrorLabel style={{ marginBottom: "20px" }}>
              Invalid code. Please try again
            </ErrorLabel>
          ) : (
            <></>
          )}
          <ButtonWrapper>
            <Button variant={"primary"} type="submit" onClick={() => {}}>
              Confirm
            </Button>
          </ButtonWrapper>
        </Form>
      )}
    </MainModal>
  );
};

export default TwoFAModal;
