import { waitFor, renderHook } from "@testing-library/react-native";

import { getActivity } from "@/core/activity/actions/get-activity.action";
import { useActivity } from "@/presentation/activity/hooks/useActivity";
import { buildActivityItems } from "@/test-utils/fixtures";
import { createQueryWrapper } from "@/test-utils/query-wrapper";

jest.mock("@/core/activity/actions/get-activity.action");

const mockedGetActivity = getActivity as jest.MockedFunction<
  typeof getActivity
>;

afterEach(() => {
  jest.clearAllMocks();
});

describe("useActivity", () => {
  it("fetches the activity feed with a limit of 20 and exposes the data", async () => {
    const items = buildActivityItems();
    mockedGetActivity.mockResolvedValue(items);

    const { result } = await renderHook(() => useActivity(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => {
      expect(result.current.activityQuery.isSuccess).toBe(true);
    });

    expect(mockedGetActivity).toHaveBeenCalledWith(20);
    expect(result.current.activityQuery.data).toEqual(items);
  });
});
