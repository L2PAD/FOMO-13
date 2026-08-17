import React, { useContext } from "react";
import { toast } from "react-toastify";
import InviteItem from "./InviteItem";
import inviteSendAction from "../../../../../http/invites/inviteSendAction";
import EmptyList from "../../../../global/EmptyList";
import { IInvite, IUpdateInvite } from "../../../../../types/global_types";
import { AuthContext, LoadingContext } from "../../../../global/Layout";
import { InviteListWrapper } from "./styles";

const InvitestsList = () => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const { userData, refetchAuthData } = useContext(AuthContext);

  const confirmInvite = async (id: string, boardId: string): Promise<void> => {
    loadingStateHandler(true);

    const data: IUpdateInvite = {
      id,
      inviterId: userData._id,
      boardId,
    };

    const { isSuccess } = await inviteSendAction("confirm", data);

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>
            You have accepted the application and successfully added it to the
            board!
          </p>
        </div>
      );
      refetchAuthData();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Something went wrong...</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  const rejectInvite = async (id: string, boardId: string): Promise<void> => {
    loadingStateHandler(true);

    const data: IUpdateInvite = {
      id,
      inviterId: userData._id,
      boardId,
    };

    const { isSuccess } = await inviteSendAction("reject", data);

    if (isSuccess) {
      toast.success(
        <div>
          <h3>Success!</h3>
          <p>You have rejected the application!</p>
        </div>
      );
      refetchAuthData();
    } else {
      toast.error(
        <div>
          <h3>Error!</h3>
          <p>Something went wrong...</p>
        </div>
      );
    }

    loadingStateHandler(false);
  };

  return (
    <InviteListWrapper>
      {userData?.invites?.length && Array.isArray(userData.invites) ? (
        userData.invites.map((item: IInvite) => {
          return (
            <InviteItem
              key={item._id}
              item={item}
              rejectInvite={rejectInvite}
              confirmInvite={confirmInvite}
            />
          );
        })
      ) : (
        <EmptyList />
      )}
    </InviteListWrapper>
  );
};

export default InvitestsList;
