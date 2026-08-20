import { getApiErrorMessage, throwApiError } from "@/core/api/api-error";

const FALLBACK = "Error generico";

describe("getApiErrorMessage", () => {
  it("returns the response message when it is a string", () => {
    const error = {
      isAxiosError: true,
      response: { data: { message: "Invalid weight" } },
    };

    expect(getApiErrorMessage(error, FALLBACK)).toBe("Invalid weight");
  });

  it("returns the first entry when the response message is an array", () => {
    const error = {
      isAxiosError: true,
      response: {
        data: { message: ["weight must be a number", "date must be a date"] },
      },
    };

    expect(getApiErrorMessage(error, FALLBACK)).toBe("weight must be a number");
  });

  it("falls back when the response message is neither a string nor an array of strings", () => {
    const error = {
      isAxiosError: true,
      response: { data: { message: { code: 400 } } },
    };

    expect(getApiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when the axios error has no response (network failure)", () => {
    const error = { isAxiosError: true };

    expect(getApiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when the error is not an axios error", () => {
    expect(getApiErrorMessage(new Error("boom"), FALLBACK)).toBe(FALLBACK);
  });

  it("falls back when the thrown value is not an Error", () => {
    expect(getApiErrorMessage("boom", FALLBACK)).toBe(FALLBACK);
    expect(getApiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
  });
});

describe("throwApiError", () => {
  it("throws an Error carrying the resolved message", () => {
    const error = {
      isAxiosError: true,
      response: { data: { message: "Entry not found" } },
    };

    expect(() => throwApiError(error, FALLBACK)).toThrow(Error);
    expect(() => throwApiError(error, FALLBACK)).toThrow("Entry not found");
  });

  it("throws an Error carrying the fallback for a non-axios error", () => {
    expect(() => throwApiError(new Error("Network error"), FALLBACK)).toThrow(
      FALLBACK,
    );
  });
});
