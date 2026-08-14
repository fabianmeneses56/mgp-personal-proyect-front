import { getActivity } from "@/core/activity/actions/get-activity.action";
import { mgpApi } from "@/core/api/mgpApi";
import { buildActivityItems } from "@/test-utils/fixtures";

jest.mock("@/core/api/mgpApi", () => ({
  mgpApi: {
    get: jest.fn(),
  },
}));

const mockedMgpApi = mgpApi as jest.Mocked<typeof mgpApi>;

describe("getActivity", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("requests /activity with the default limit and returns the items", async () => {
    const items = buildActivityItems();
    mockedMgpApi.get.mockResolvedValue({ data: items });

    const result = await getActivity();

    expect(mockedMgpApi.get).toHaveBeenCalledWith("/activity", {
      params: { limit: 20 },
    });
    expect(result).toEqual(items);
  });

  it("requests /activity with an explicit limit", async () => {
    const items = buildActivityItems();
    mockedMgpApi.get.mockResolvedValue({ data: items });

    await getActivity(5);

    expect(mockedMgpApi.get).toHaveBeenCalledWith("/activity", {
      params: { limit: 5 },
    });
  });

  it("propagates the response message from an axios error", async () => {
    mockedMgpApi.get.mockRejectedValue({
      isAxiosError: true,
      response: { data: { message: "Activity feed unavailable" } },
    });

    await expect(getActivity()).rejects.toThrow("Activity feed unavailable");
  });

  it("falls back to a generic message when the error has no response message", async () => {
    mockedMgpApi.get.mockRejectedValue(new Error("Network error"));

    await expect(getActivity()).rejects.toThrow(
      "Error al obtener la actividad reciente"
    );
  });
});
