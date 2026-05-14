import { describe, expect, it } from "vitest";
import {
  pickFeedbackDay,
  FEEDBACK_DAY_3,
  FEEDBACK_DAY_14,
  FEEDBACK_DAY_30,
  type SentMap,
} from "@/lib/cron/customer-feedback";

const DAY = 24 * 60 * 60 * 1000;
const EMPTY: SentMap = { day3SentAt: null, day14SentAt: null, day30SentAt: null };

function ago(now: Date, days: number): Date {
  return new Date(now.getTime() - days * DAY);
}

describe("pickFeedbackDay", () => {
  const now = new Date("2026-05-14T10:00:00Z");

  it("returns null for leads younger than day3 threshold", () => {
    expect(pickFeedbackDay(ago(now, 2.9), now, EMPTY, false)).toBe(null);
    expect(pickFeedbackDay(ago(now, 0), now, EMPTY, false)).toBe(null);
  });

  it("returns 'day3' for leads in [3, 14) day window with day3 unsent", () => {
    expect(pickFeedbackDay(ago(now, FEEDBACK_DAY_3), now, EMPTY, false)).toBe("day3");
    expect(pickFeedbackDay(ago(now, 10), now, EMPTY, false)).toBe("day3");
    expect(pickFeedbackDay(ago(now, FEEDBACK_DAY_14 - 0.1), now, EMPTY, false)).toBe("day3");
  });

  it("returns null in [3, 14) when day3 was already sent (idempotency)", () => {
    expect(pickFeedbackDay(ago(now, 5), now, { ...EMPTY, day3SentAt: ago(now, 2) }, false)).toBe(
      null,
    );
  });

  it("returns 'day14' for [14, 30) day window with day14 unsent", () => {
    expect(pickFeedbackDay(ago(now, FEEDBACK_DAY_14), now, EMPTY, false)).toBe("day14");
    expect(pickFeedbackDay(ago(now, 20), now, EMPTY, false)).toBe("day14");
    expect(pickFeedbackDay(ago(now, FEEDBACK_DAY_30 - 0.1), now, EMPTY, false)).toBe("day14");
  });

  it("catch-up semantics: 20-day-old lead with day3 unsent returns day14, not day3", () => {
    // We don't backfill old day3 — too late in the customer's mental window.
    expect(pickFeedbackDay(ago(now, 20), now, EMPTY, false)).toBe("day14");
  });

  it("returns null in [14, 30) when day14 was already sent", () => {
    expect(pickFeedbackDay(ago(now, 20), now, { ...EMPTY, day14SentAt: ago(now, 6) }, false)).toBe(
      null,
    );
  });

  it("returns 'day30' for leads at/past 30 days with day30 unsent", () => {
    expect(pickFeedbackDay(ago(now, FEEDBACK_DAY_30), now, EMPTY, false)).toBe("day30");
    expect(pickFeedbackDay(ago(now, 100), now, EMPTY, false)).toBe("day30");
  });

  it("catch-up: 40-day-old lead with nothing sent → day30 (skip day3 and day14)", () => {
    expect(pickFeedbackDay(ago(now, 40), now, EMPTY, false)).toBe("day30");
  });

  it("returns null past day30 when day30 was already sent (terminal)", () => {
    expect(pickFeedbackDay(ago(now, 50), now, { ...EMPTY, day30SentAt: ago(now, 20) }, false)).toBe(
      null,
    );
  });

  it("disabled=true short-circuits every branch", () => {
    expect(pickFeedbackDay(ago(now, 3), now, EMPTY, true)).toBe(null);
    expect(pickFeedbackDay(ago(now, 14), now, EMPTY, true)).toBe(null);
    expect(pickFeedbackDay(ago(now, 40), now, EMPTY, true)).toBe(null);
  });

  it("handles a fully-completed lead (all three sent) gracefully", () => {
    const allSent: SentMap = {
      day3SentAt: ago(now, 12),
      day14SentAt: ago(now, 5),
      day30SentAt: ago(now, 1),
    };
    expect(pickFeedbackDay(ago(now, 31), now, allSent, false)).toBe(null);
  });
});
