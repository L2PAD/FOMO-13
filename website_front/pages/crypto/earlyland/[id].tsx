import React, { FC, useContext } from "react";
import { useRouter } from "next/router";
import { useQuery, useQueryClient } from "react-query";
import Layout, { AuthContext } from "../../../components/global/Layout";
import Navigation from "../../../components/global/Navigation";
import { EarlylandPages } from "../../../staticContent/earlyland";
import ProjectDetails from "../../../components/layouts/projects/Crypto/Earlyland/ProjectDetails";
import ActivityDetailsLoading from "../../../components/layouts/projects/Crypto/Earlyland/ProjectDetails/LoadingSkeleton";
import {
  addCryptoActivityToCalendar,
  createCryptoActivityBoardTask,
  favoriteCryptoActivity,
  getCryptoActivity,
  getCryptoActivityErrorStatus,
  reactToCryptoActivity,
  removeCryptoActivityFromCalendar,
  removeCryptoActivityReaction,
  reportCryptoActivity,
  unfavoriteCryptoActivity,
  updateCryptoActivityStepProgress,
} from "../../../http/cryptoActivities";
import { mapCryptoActivityToProjectDetails } from "../../../utils/cryptoActivitiesMapper";
import {
  deleteOptimisticSavedCalendarActivity,
  patchOptimisticActivityUserState,
  restoreQuerySnapshots,
  snapshotQueryRoots,
  upsertOptimisticSavedCalendarActivity,
} from "../../../utils/cryptoActivitiesOptimistic";

export const getServerSideProps = async (context: any) => {
  const { id } = context.params;
  return { props: { id } };
};

interface IProps {
  id: string;
}

const AUTH_REQUIRED_RESULT = { isSuccess: false, authRequired: true };

const ActivityDetailsContent: FC<IProps> = ({ id }) => {
  const router = useRouter();
  const authContext = useContext(AuthContext);
  const queryClient = useQueryClient();
  const viewerAccessVersion = [
    authContext?.isAuth ? "authenticated" : "anonymous",
    String(authContext?.userData?._id || "no-user"),
    String(authContext?.userData?.wallet || "").trim().toLowerCase(),
    Boolean(authContext?.hasSpaceportNft),
    Boolean(authContext?.hasBoughtSpaceportNft),
    Number(authContext?.userData?.spaceportNftCount || 0),
    Number(authContext?.spaceportAccess?.nftBalance || 0),
  ].join(":");
  const { data, isLoading, isError, error } = useQuery(
    ["crypto-earlyland-activity", id, viewerAccessVersion],
    () => getCryptoActivity(id),
    {
      refetchOnWindowFocus: false,
      enabled: Boolean(id),
      retry: (failureCount, queryError) => {
        const status = getCryptoActivityErrorStatus(queryError);
        if (status && status < 500) return false;
        return failureCount < 2;
      },
    }
  );

  const detailsData = data ? mapCryptoActivityToProjectDetails(data) : undefined;
  const mutationActivityId = detailsData?.interactionId || id;
  const isAuthorized = Boolean(authContext?.isAuth && authContext?.userData?.isActive);

  const openAuthModal = () => {
    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    url.searchParams.set("auth-modal", "true");

    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    router.replace(nextUrl, undefined, { shallow: true });
  };

  const requireAuth = () => {
    if (isAuthorized) return true;

    openAuthModal();
    return false;
  };

  const toggleFavourite = async (
    activityId: string,
    nextValue: boolean,
    interactionId: string
  ) => {
    if (!data) return { isSuccess: false };
    if (!requireAuth()) return AUTH_REQUIRED_RESULT;

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-earlyland-activity",
      "crypto-earlyland-activities",
    ]);

    patchOptimisticActivityUserState(queryClient, activityId, {
      isFavourite: nextValue,
    });

    const result = nextValue
      ? await favoriteCryptoActivity(interactionId)
      : await unfavoriteCryptoActivity(interactionId);

    if (!result.isSuccess) {
      restoreQuerySnapshots(queryClient, snapshots);
      return result;
    }

    queryClient.invalidateQueries("crypto-earlyland-activity");
    queryClient.invalidateQueries("crypto-earlyland-activities");

    return result;
  };

  const handleToggleFavourite = (activityId: string, nextValue: boolean) =>
    toggleFavourite(activityId, nextValue, mutationActivityId);

  const handleToggleSimilarFavourite = (
    activityId: string,
    interactionId: string | undefined,
    nextValue: boolean
  ) => toggleFavourite(activityId, nextValue, interactionId || activityId);

  const handleReaction = async (
    activityId: string,
    reaction: "like" | "dislike" | "hot" | "interested" | null
  ) => {
    if (!requireAuth()) return AUTH_REQUIRED_RESULT;

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-earlyland-activity",
      "crypto-earlyland-activities",
    ]);

    patchOptimisticActivityUserState(queryClient, activityId, {
      reaction,
    });

    const result = reaction
      ? await reactToCryptoActivity(mutationActivityId, reaction)
      : await removeCryptoActivityReaction(mutationActivityId);

    if (!result.isSuccess) {
      restoreQuerySnapshots(queryClient, snapshots);
      return result;
    }

    queryClient.invalidateQueries("crypto-earlyland-activity");
    queryClient.invalidateQueries("crypto-earlyland-activities");

    return result;
  };

  const handleReport = async (
    activityId: string,
    reason: "green" | "yellow" | "red"
  ) => {
    if (!requireAuth()) return AUTH_REQUIRED_RESULT;

    const result = await reportCryptoActivity(mutationActivityId, { reason });

    if (result.isSuccess) queryClient.invalidateQueries("crypto-earlyland-activity");

    return result;
  };

  const handleCalendar = async (activityId: string, nextValue: boolean) => {
    if (!data) return { isSuccess: false };
    if (!requireAuth()) return AUTH_REQUIRED_RESULT;

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-earlyland-activity",
      "crypto-earlyland-activities",
      "crypto-activity-calendar",
    ]);

    patchOptimisticActivityUserState(queryClient, activityId, {
      isAddedToCalendar: nextValue,
    });
    if (nextValue) {
      upsertOptimisticSavedCalendarActivity(queryClient, data);
    } else {
      deleteOptimisticSavedCalendarActivity(queryClient, activityId);
    }

    const result = nextValue
      ? await addCryptoActivityToCalendar(mutationActivityId)
      : await removeCryptoActivityFromCalendar(mutationActivityId);

    if (!result.isSuccess) {
      restoreQuerySnapshots(queryClient, snapshots);
      return result;
    }

    queryClient.invalidateQueries("crypto-earlyland-activity");
    queryClient.invalidateQueries("crypto-earlyland-activities");
    queryClient.invalidateQueries("crypto-activity-calendar");

    return result;
  };

  const handleAddToBoard = async () => {
    if (!data) return { isSuccess: false };
    if (!requireAuth()) return AUTH_REQUIRED_RESULT;

    const created = await createCryptoActivityBoardTask({
      activityId: mutationActivityId,
    } as any);

    if (!created) {
      return { isSuccess: false };
    }

    queryClient.invalidateQueries("crypto-earlyland-activity");
    queryClient.invalidateQueries("crypto-activity-board");

    return { isSuccess: true };
  };

  const handleToggleStep = async (
    activityId: string,
    stepId: string,
    completed: boolean
  ) => {
    if (!data) return { isSuccess: false };
    if (!requireAuth()) return AUTH_REQUIRED_RESULT;

    const previousIds = Array.isArray(data.userState?.completedStepIds)
      ? data.userState?.completedStepIds || []
      : [];
    const nextIds = completed
      ? Array.from(new Set([...previousIds, stepId]))
      : previousIds.filter((id) => id !== stepId);
    const stepsTotal = Number(data.userState?.stepsTotal || data.taskGuide?.steps?.length || 0);
    const stepsCompleted = nextIds.length;
    const stepsProgress = stepsTotal ? Math.round((stepsCompleted / stepsTotal) * 100) : 0;

    const snapshots = snapshotQueryRoots(queryClient, [
      "crypto-earlyland-activity",
      "crypto-earlyland-activities",
    ]);

    patchOptimisticActivityUserState(queryClient, activityId, {
      completedStepIds: nextIds,
      stepsCompleted,
      stepsTotal,
      stepsProgress,
    });

    const result = await updateCryptoActivityStepProgress(mutationActivityId, {
      stepId,
      completed,
    });

    if (!result.isSuccess) {
      restoreQuerySnapshots(queryClient, snapshots);
      return result;
    }

    if (result.userState) {
      patchOptimisticActivityUserState(queryClient, activityId, result.userState);
    }

    return result;
  };

  if (isLoading) {
    return <ActivityDetailsLoading />;
  }

  if (isError || !data) {
    const status = getCryptoActivityErrorStatus(error);
    const message = status === 403
      ? "This Prime activity requires a FOMO AI membership."
      : status === 404
        ? "Activity not found."
        : "Unable to load this activity. Please try again.";

    return <div role="alert">{message}</div>;
  }

  return (
    <ProjectDetails
      data={detailsData}
      onToggleFavourite={handleToggleFavourite}
      onToggleSimilarFavourite={handleToggleSimilarFavourite}
      onSimilarDetails={(activityId) => router.push(`/crypto/earlyland/${activityId}`)}
      onReaction={handleReaction}
      onReport={handleReport}
      onCalendar={handleCalendar}
      onAddToBoard={handleAddToBoard}
      onToggleStep={handleToggleStep}
    />
  );
};

const NTFsPage: FC<IProps> = ({ id }) => {
  return (
    <Layout title="Fomoland: EarlyLand">
      <Navigation project="earlyland" pagesList={EarlylandPages} />
      <ActivityDetailsContent id={id} />
    </Layout>
  );
};

export default NTFsPage;
