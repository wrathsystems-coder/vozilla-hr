import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { _resetThresholdsCache, verifyRecaptcha } from "@/lib/recaptcha/verify";

function mockGoogle(body: Record<string, unknown>, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => body,
  } as Response);
}

describe("verifyRecaptcha", () => {
  beforeEach(() => {
    _resetThresholdsCache();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("dev_bypass when RECAPTCHA_SECRET_KEY is unset", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("dev_bypass");
    expect(result.score).toBe(1.0);
    expect(result.action).toBe("lead_create");
  });

  it("dev_bypass when RECAPTCHA_SECRET_KEY is XXX_ placeholder", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "XXX_RECAPTCHA_SECRET_KEY");
    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("dev_bypass");
  });

  it("blocks empty token without contacting Google", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "real-secret");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await verifyRecaptcha({ token: "", expectedAction: "lead_create" });
    expect(result.outcome).toBe("block");
    expect(result.reason).toBe("missing_token");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks when Google returns success: false with error codes", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "real-secret");
    vi.stubGlobal(
      "fetch",
      mockGoogle({ success: false, "error-codes": ["invalid-input-response"] }),
    );

    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("block");
    expect(result.reason).toBe("recaptcha_invalid-input-response");
  });

  it("blocks when score is below block_below threshold", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "real-secret");
    vi.stubGlobal(
      "fetch",
      mockGoogle({ success: true, score: 0.1, action: "lead_create", hostname: "vozilla.hr" }),
    );

    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("block");
    expect(result.score).toBe(0.1);
    expect(result.reason).toMatch(/^score_below_/);
  });

  it("flags review when score is between block and review thresholds", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "real-secret");
    vi.stubGlobal(
      "fetch",
      mockGoogle({ success: true, score: 0.4, action: "lead_create", hostname: "vozilla.hr" }),
    );

    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("review");
    expect(result.score).toBe(0.4);
  });

  it("passes when score is at or above review_below", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "real-secret");
    vi.stubGlobal(
      "fetch",
      mockGoogle({ success: true, score: 0.8, action: "lead_create", hostname: "vozilla.hr" }),
    );

    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("pass");
    expect(result.score).toBe(0.8);
    expect(result.action).toBe("lead_create");
  });

  it("blocks on action mismatch even with high score", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "real-secret");
    vi.stubGlobal(
      "fetch",
      mockGoogle({ success: true, score: 0.9, action: "homepage", hostname: "vozilla.hr" }),
    );

    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("block");
    expect(result.reason).toMatch(/action_mismatch_expected_lead_create/);
  });

  it("blocks on non-2xx HTTP from Google", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "real-secret");
    vi.stubGlobal("fetch", mockGoogle({}, false, 503));

    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("block");
    expect(result.reason).toBe("http_503");
  });

  it("blocks on network failure (fetch throws)", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "real-secret");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));

    const result = await verifyRecaptcha({ token: "abc", expectedAction: "lead_create" });
    expect(result.outcome).toBe("block");
    expect(result.reason).toMatch(/^network_/);
  });
});
