import { afterEach, describe, expect, it } from "vitest";
import { _resetCache, isEnabled, loadFlags } from "@/lib/feature-flags";

describe("feature-flags", () => {
  afterEach(() => {
    _resetCache();
  });

  it("loads YAML and exposes typed object with boolean values", () => {
    const flags = loadFlags();
    for (const [key, value] of Object.entries(flags)) {
      expect(typeof value, `flag ${key} should be boolean`).toBe("boolean");
    }
  });

  it("MVP defaults: every flag is OFF", () => {
    // Spec: docs/spec/01-vision-and-scope.md — "Sve OFF što nije u core MVP-u".
    // If this fails, someone flipped a flag — verify it's intentional and
    // update the spec / progress log alongside the YAML.
    const flags = loadFlags();
    for (const [key, value] of Object.entries(flags)) {
      expect(value, `flag ${key} should be false in MVP`).toBe(false);
    }
  });

  it("isEnabled returns YAML value for known flag", () => {
    expect(isEnabled("newsletter")).toBe(false);
    expect(isEnabled("sms_notifications")).toBe(false);
    expect(isEnabled("dark_mode")).toBe(false);
  });

  it("override beats YAML when key is present", () => {
    expect(isEnabled("newsletter")).toBe(false);
    expect(isEnabled("newsletter", { newsletter: true })).toBe(true);
  });

  it("override only applies when the queried key is in the override object", () => {
    expect(isEnabled("dark_mode", {})).toBe(false);
    expect(isEnabled("dark_mode", { newsletter: true })).toBe(false);
  });

  it("module cache returns the same object on repeated loads", () => {
    const first = loadFlags();
    const second = loadFlags();
    expect(second).toBe(first);
  });
});
