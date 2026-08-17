/* eslint-disable */
import React, {
  FC,
  useState,
  useContext,
  useEffect,
  useMemo,
  SyntheticEvent,
} from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-toastify";
import { LoadingContext } from "../../Layout";
import Modal from "../../common/Modal";
import { MailIcon } from "../../Icons";
import { mainPages } from "../../../../staticContent/global";
import { LoginType, RegistrationType } from "../../../../types/global_types";
import registrationByEmail from "../../../../http/auth/registerByEmail";
import loginByEmail from "../../../../http/auth/loginByEmail";
import sendConfrimLink from "../../../../http/auth/sendConfrimLink";
import forgotPassword from "../../../../http/auth/forgotPassword";
import EyeIcon from "../../../../assets/icons/eye.svg";
import EyeHideIcon from "../../../../assets/icons/eye-password-hide.svg";
import {
  ContentWrapper,
  DontHaveAccount,
  EmailInput,
  ErrorText,
  ForgotButton,
  LinksWrapper,
  MailIconWrapper,
  PasswordInput,
  PasswordWrapper,
  SentText,
  SubmitButton,
  EmailInputWrapper,
  PasswordInputWrapper,
  PasswordInfo,
  TwoFACodeWrapper,
} from "./styles";
import { ButtonWrapper, CodeInputWrapper } from "../2FAModal/styles";
import { ErrorLabel } from "../../../layouts/gemslab/Profile/styles";
import { Button } from "../../common/Button";
import verify2FA from "../../../../http/auth/verify2FA";

interface Props {
  onClose: () => void;
}

const AuthModal: FC<Props> = ({ onClose }) => {

  // const [isViewPassword, setIsViewPassword] = useState<boolean>(false);
  // const [login, setLogin] = useState<boolean>(true);
  // const [isTwoFA, setIsTwoFA] = useState<boolean>(false);
  // const [createAccount, setCreateAccount] = useState<boolean>(false);
  // const [username, setUsername] = useState<string>("");
  // const [email, setEmail] = useState<string>("");
  // const [password, setPassword] = useState<string>("");
  // const [isRegError, setIsRegError] = useState<boolean>(false);
  // const [isLoginError, setIsLoginError] = useState<boolean>(false);
  // const [loginError, setLoginError] = useState<string>("");
  // const [isSendAgain, setIsSendAgain] = useState<boolean>(false);
  // const [twoFACode, setTwoFACode] = useState<string>("");
  // const [isFACodeError, setIsFACodeError] = useState<boolean>(false);
  // const [isForgotPassword, setIsForgotPassword] = useState<boolean>(false);
  // const { loadingStateHandler } = useContext(LoadingContext);
  // const router = useRouter();
  // const isBackBtn = router.pathname === "/gemslab/profile";

  // const onSubmitClose = (): void => {
  //   onClose();
  //   setUsername("");
  //   setEmail("");
  //   setPassword("");
  //   setLogin(true);
  //   setCreateAccount(false);
  // };

  // const confirmRegistation = async (): Promise<void> => {
  //   if (!username || !email || !password) return;

  //   const registationData: RegistrationType = {
  //     email,
  //     password,
  //     username,
  //   };

  //   loadingStateHandler(true);

  //   const isSuccess: boolean = await registrationByEmail(registationData);

  //   loadingStateHandler(false);
  //   setIsRegError(!isSuccess);
  //   setCreateAccount(isSuccess);

  //   if (!isSuccess) {
  //     setTimeout(() => {
  //       setIsRegError(false);
  //     }, 5000);
  //   }
  // };

  // const confirmSendAgain = async (): Promise<void> => {
  //   loadingStateHandler(true);

  //   const isSuccess: boolean = await sendConfrimLink();

  //   setIsSendAgain(true);
  //   loadingStateHandler(false);
  // };

  // const confrimResetPass = async (): Promise<void> => {
  //   if (email.length < 4) {
  //     toast.error(
  //       <div>
  //         <h3>Error!</h3>
  //         <p>Enter email</p>
  //       </div>
  //     );
  //     return;
  //   }

  //   loadingStateHandler(true);

  //   const isSuccess: boolean = await forgotPassword();

  //   setIsForgotPassword(isSuccess);

  //   loadingStateHandler(false);
  // };

  // const confirmLogin = async (e: SyntheticEvent): Promise<void> => {
  //   e.preventDefault();

  //   if (email.length < 14) {
  //     toast.error(
  //       <div>
  //         <h3>Error!</h3>
  //         <p>Enter email</p>
  //       </div>
  //     );
  //     return;
  //   }
  //   loadingStateHandler(true);

  //   const data: LoginType = { email, password };

  //   const loginResults: {
  //     isSuccess: boolean;
  //     error?: string;
  //     requires2FA: boolean;
  //   } = await loginByEmail(data);

  //   loadingStateHandler(false);

  //   if (loginResults.requires2FA) {
  //     setIsTwoFA(true);
  //     return;
  //   }

  //   if (loginResults.isSuccess) {
  //     window.location.reload();
  //   }

  //   if (!loginResults.isSuccess && loginResults.error) {
  //     setIsLoginError(true);
  //     setLoginError(loginResults.error);
  //     setTimeout(() => {
  //       setIsLoginError(false);
  //       setLoginError("");
  //     }, 5000);
  //   }
  // };

  // const confirmSetup = async (e: any): Promise<void> => {
  //   e.preventDefault();
  //   loadingStateHandler(true);

  //   const { isSuccess } = await verify2FA(twoFACode);

  //   if (isSuccess) {
  //     window.location.reload();
  //   }

  //   setIsFACodeError(!isSuccess);

  //   loadingStateHandler(false);
  // };

  // const isPasswordValid: boolean = useMemo(() => {
  //   return password.length > 5 && password.toLowerCase() !== password;
  // }, [password]);

  // const isEmailValid: Boolean = useMemo(() => {
  //   return password.length > 5 && password.toLowerCase() !== password;
  // }, [password]);

  // if (isTwoFA) {
  //   return (
  //     <Modal
  //       className="creating_project_modal"
  //       variant="610"
  //       onClose={onClose}
  //       title="Two-Factor Authentication (2FA)"
  //     >
  //       <TwoFACodeWrapper onSubmit={confirmSetup}>
  //         <div className="fa-subtitle">
  //           Go to your authenticator and enter the received code
  //         </div>
  //         <CodeInputWrapper>
  //           <p>Code from the authenticator</p>
  //           <div className="input">
  //             <input
  //               type="text"
  //               placeholder="Enter the 6-digit code"
  //               value={twoFACode}
  //               onChange={(e: any) => setTwoFACode(e.target.value)}
  //             />
  //           </div>
  //           <div className="code-label">Code expires in 30 seconds</div>
  //         </CodeInputWrapper>
  //         {isFACodeError ? (
  //           <ErrorLabel style={{ marginBottom: "20px" }}>
  //             Invalid code. Please try again
  //           </ErrorLabel>
  //         ) : (
  //           <></>
  //         )}
  //         <ButtonWrapper>
  //           <Button type={"submit"} variant={"primary"} onClick={() => {}}>
  //             Confirm
  //           </Button>
  //         </ButtonWrapper>
  //       </TwoFACodeWrapper>
  //     </Modal>
  //   );
  // }

  // if (isForgotPassword) {
  //   return (
  //     <Modal
  //       onClose={() => setIsForgotPassword(false)}
  //       title="Create an Account"
  //     >
  //       <ContentWrapper>
  //         <MailIconWrapper>
  //           <MailIcon fill={false ? "#E24828" : "#04A584"} />
  //         </MailIconWrapper>
  //         <SentText>
  //           We have sent reset link to <br /> <span>{email}</span>
  //         </SentText>

  //         <DontHaveAccount main={false}>
  //           <button
  //             onClick={() => {
  //               setIsForgotPassword(false);
  //             }}
  //           >
  //             Close
  //           </button>
  //         </DontHaveAccount>
  //       </ContentWrapper>
  //     </Modal>
  //   );
  // }

  // if (createAccount) {
  //   return (
  //     <Modal onClose={onSubmitClose} title="Create an Account">
  //       <ContentWrapper>
  //         <MailIconWrapper>
  //           <MailIcon fill={false ? "#E24828" : "#04A584"} />
  //         </MailIconWrapper>
  //         <SentText>
  //           We have sent confirmation email to <br /> <span>{email}</span>
  //         </SentText>
  //         <DontHaveAccount main={false}>
  //           Didn’t receive an email?
  //           {!isSendAgain ? (
  //             <button onClick={confirmSendAgain}>Send again</button>
  //           ) : (
  //             <></>
  //           )}
  //         </DontHaveAccount>
  //         <DontHaveAccount main={false}>
  //           <button
  //             onClick={() => {
  //               setCreateAccount(false);
  //               setLogin(true);
  //             }}
  //           >
  //             Login
  //           </button>
  //         </DontHaveAccount>
  //       </ContentWrapper>
  //     </Modal>
  //   );
  // }

  // if (login) {
  //   return (
  //     <Modal isBackBtn={isBackBtn} onClose={onSubmitClose} title="Login">
  //       <form onSubmit={confirmLogin}>
  //         <ContentWrapper>
  //           <EmailInput
  //             value={email}
  //             onChange={(value) => setEmail(value)}
  //             type="text"
  //             placeholder="Enter email"
  //             labelText="Email"
  //           />
  //           <EmailInputWrapper isError={isLoginError}>
  //             <PasswordWrapper>
  //               <ForgotButton
  //                 type="button"
  //                 onClick={confrimResetPass}
  //                 main={false}
  //               >
  //                 Forgot password?
  //               </ForgotButton>
  //               <PasswordInputWrapper>
  //                 <PasswordInput
  //                   value={password}
  //                   onChange={(value) => setPassword(value)}
  //                   type={isViewPassword ? "string" : "password"}
  //                   placeholder="Enter password"
  //                   labelText="Password"
  //                 />
  //                 <button
  //                   type="button"
  //                   onClick={() => setIsViewPassword((prev: boolean) => !prev)}
  //                 >
  //                   <Image
  //                     src={isViewPassword ? EyeHideIcon : EyeIcon}
  //                     alt={"view password"}
  //                   />
  //                 </button>
  //               </PasswordInputWrapper>
  //             </PasswordWrapper>
  //             {isLoginError && <ErrorText>{loginError}</ErrorText>}
  //           </EmailInputWrapper>
  //           <SubmitButton
  //             type="submit"
  //             disabled={email.length < 5}
  //             main={false}
  //           >
  //             Login
  //           </SubmitButton>
  //           <DontHaveAccount main={false}>
  //             Don’t have an Account yet?
  //             <button
  //               type="button"
  //               onClick={() => {
  //                 setLogin(false);
  //                 setEmail("");
  //                 setPassword("");
  //               }}
  //             >
  //               Create new
  //             </button>
  //           </DontHaveAccount>
  //         </ContentWrapper>
  //       </form>
  //     </Modal>
  //   );
  // }

  // if (!login) {
  //   return (
  //     <Modal onClose={onSubmitClose} title="Create an Account">
  //       <ContentWrapper>
  //         <EmailInput
  //           value={username}
  //           onChange={(value) => setUsername(value)}
  //           type="text"
  //           placeholder="Enter username"
  //           labelText="Username"
  //         />
  //         <EmailInputWrapper isError={isRegError}>
  //           <EmailInput
  //             value={email}
  //             onChange={(value) => setEmail(value)}
  //             type="text"
  //             placeholder="Enter email"
  //             labelText="Email"
  //           />
  //           {isRegError ? (
  //             <ErrorText>User with this email address already exists</ErrorText>
  //           ) : (
  //             <></>
  //           )}
  //         </EmailInputWrapper>
  //         <PasswordWrapper>
  //           <ForgotButton onClick={confrimResetPass} main={false}>
  //             Forgot password?
  //           </ForgotButton>
  //           <PasswordInputWrapper>
  //             <PasswordInput
  //               value={password}
  //               onChange={(value) => setPassword(value)}
  //               type={isViewPassword ? "string" : "password"}
  //               placeholder="Enter password"
  //               labelText="Password"
  //             />
  //             <button
  //               onClick={() => setIsViewPassword((prev: boolean) => !prev)}
  //             >
  //               <Image
  //                 src={isViewPassword ? EyeHideIcon : EyeIcon}
  //                 alt={"view password"}
  //               />
  //             </button>
  //           </PasswordInputWrapper>
  //           {!isPasswordValid && password.length ? (
  //             <PasswordInfo>
  //               The password must be at least <b>5 characters long</b> and
  //               contain <b>1 capital letter</b>
  //             </PasswordInfo>
  //           ) : (
  //             <></>
  //           )}
  //         </PasswordWrapper>
  //         <LinksWrapper main={false}>
  //           By clicking Create Account, you are accepting the{" "}
  //           <Link href="/terms_of_use">Terms of Use</Link> and{" "}
  //           <Link href="/terms_of_use">Privacy Policy</Link>?
  //         </LinksWrapper>
  //         <SubmitButton
  //           disabled={!username || !email || !isPasswordValid}
  //           main={false}
  //           onClick={confirmRegistation}
  //         >
  //           Create an Account
  //         </SubmitButton>
  //         <DontHaveAccount main={false}>
  //           Already have an Account?
  //           <button onClick={() => setLogin(true)}>Login</button>
  //         </DontHaveAccount>
  //       </ContentWrapper>
  //     </Modal>
  //   );
  // }

  return <></>;
};

export default AuthModal;
