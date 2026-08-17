import React, { FC, useState } from "react";
import { OptionsForSortProjectsPage } from "../../../../../staticContent/global";
import CustomAssetModal from "../CustomAssetModal";
import Modal from "../../../../global/common/Modal";
import UserAvatar from "../../../../global/common/UserAvatar";
import { CloseIcon } from "../../../../global/Icons";
import {
  AddButton,
  DescriptionBottom,
  Dropdown,
  DropdownWrapper,
  List,
  ListItem,
  ListWrapper,
  OrText,
  Title,
  UserRowItem,
} from "./styles";

interface Props {
  onClose: () => void;
}

const AddAssetsModal: FC<Props> = ({ onClose }) => {
  const [option, setOption] = useState<{ name: string; value: string }[]>([]);
  const [customModal, setCustomModal] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const onChangeAsset = (value: { name: string; value: string }) => {
    let includeValue = false;
    option.forEach((item) => {
      includeValue = item.value === value.value;
    });
    if (includeValue) {
      setOption((state) => state.filter((item) => item.value !== value.value));
    } else {
      setOption((state) => [...state, value]);
    }
  };

  if (!customModal) {
    return (
      <Modal variant="small" title="Add asset" onClose={onClose}>
        <DropdownWrapper>
          <Title>Asset Name</Title>
          <Dropdown
            label=""
            placeholder="Asset name or ticket"
            options={OptionsForSortProjectsPage}
            values={option}
            onChange={onChangeAsset}
            searchValue={searchValue}
            onSearch={(value) => setSearchValue(value)}
            dropdownClassName="dropdown-styles"
          />
        </DropdownWrapper>
        <ListWrapper>
          <Title>Your assets</Title>
          <List>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
            <ListItem>
              <UserRowItem>
                <UserAvatar
                  avatar="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTyz-77X11MoGE22xVjjPhbpW6lPj6I0SkcTQ&usqp=CAU"
                  name="name"
                  size="xSmall"
                  variant="default"
                />
                <div>
                  Current <span>CRNC</span>
                </div>
              </UserRowItem>
              <button>
                <CloseIcon fill="#E42736" />
              </button>
            </ListItem>
          </List>
        </ListWrapper>
        <OrText>Or continue with</OrText>
        <AddButton onClick={() => setCustomModal(true)}>
          Add custom asset
        </AddButton>
        <DescriptionBottom>
          This option allows you to add an Asset, which is not listed to
          Dropstab yet
        </DescriptionBottom>
      </Modal>
    );
  }
  if (customModal)
    return (
      <CustomAssetModal
        onClose={() => {
          onClose();
          setCustomModal(false);
        }}
      />
    );

  return null;
};

export default AddAssetsModal;
