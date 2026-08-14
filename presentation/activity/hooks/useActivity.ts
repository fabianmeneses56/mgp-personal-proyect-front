import { getActivity } from "@/core/activity/actions/get-activity.action";
import { useQuery } from "@tanstack/react-query";

const ACTIVITY_LIMIT = 20;

export const useActivity = () => {
  const activityQuery = useQuery({
    queryKey: ["activity"],
    queryFn: () => getActivity(ACTIVITY_LIMIT),
  });

  return { activityQuery };
};
