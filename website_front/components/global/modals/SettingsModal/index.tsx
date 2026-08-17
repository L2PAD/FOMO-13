import React, { FC, useState } from "react";
import { useRouter } from "next/router";
import Modal from "../../common/Modal";
import Checkbox from "../../common/Checkbox";
import UserAvatar from "../../common/UserAvatar";
import {
  ChangeWrapper,
  ContentWrapper,
  EmailInput,
  LinksWrapper,
  PasswordInput,
  SubmitButton,
  UserAvatarWrapper,
} from "./styles";

interface Props {
  onClose: () => void;
}

const mainPages = ["/evolution", "/", "/core", "/about"];

const SettingsModal: FC<Props> = ({ onClose }) => {
  const [username, setUsername] = useState("someUserName");
  const [email, setEmail] = useState("some@user.email");
  const [password, setPassword] = useState("some_user_password");
  const [isChangeEmail, setIsChangeEmail] = useState(false);
  const [isChangePassword, setIsChangePassword] = useState(false);
  const [is2F, setIs2F] = useState(false);
  const router = useRouter();

  const onSubmitClose = () => {
    onClose();
    setUsername("");
    setEmail("");
    setPassword("");
  };

  return (
    <Modal onClose={onSubmitClose} title="Settings">
      <ContentWrapper>
        <UserAvatarWrapper>
          <UserAvatar
            size="giant"
            avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
            name="name"
            variant="default"
          />
          <button>Delete photo</button>
        </UserAvatarWrapper>
        <EmailInput
          value={username}
          onChange={(value) => setUsername(value)}
          type="text"
          placeholder="Enter username"
          labelText="Username"
        />
        {isChangeEmail ? (
          <EmailInput
            value={email}
            onChange={(value) => setEmail(value)}
            type="text"
            placeholder="Enter email"
            labelText="Email"
          />
        ) : (
          <ChangeWrapper>
            <p>Email</p>
            <div>
              <p>{email}</p>
              <button onClick={() => setIsChangeEmail(true)}>
                Change email
              </button>
            </div>
          </ChangeWrapper>
        )}
        {isChangePassword ? (
          <PasswordInput
            value={password}
            onChange={(value) => setPassword(value)}
            type="password"
            placeholder="Enter password"
            labelText="Password"
          />
        ) : (
          <ChangeWrapper>
            <p>Password</p>
            <div>
              <p>***************</p>
              <button onClick={() => setIsChangePassword(true)}>
                Change password
              </button>
            </div>
          </ChangeWrapper>
        )}
        <LinksWrapper>
          <Checkbox
            checked={is2F}
            onChange={() => setIs2F((state) => !state)}
            label="Turn On 2-Fa Autentification"
          />
        </LinksWrapper>
        <SubmitButton
          main={mainPages.includes(router.pathname)}
          onClick={onClose}
        >
          Save changes
        </SubmitButton>
      </ContentWrapper>
    </Modal>
  );
};

export default SettingsModal;
