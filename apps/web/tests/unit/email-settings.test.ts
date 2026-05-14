import { describe, expect, it } from "vitest";
import {
  resolveTemplate,
  type EmailSettingsResolved,
  type EmailTemplateKey,
} from "@/lib/email/settings";

const emptySettings: EmailSettingsResolved = {
  fromEmail: null,
  replyTo: null,
  templates: {},
};

const withTemplate = (
  key: EmailTemplateKey,
  enabled: boolean,
  subjectOverride: string | null,
): EmailSettingsResolved => ({
  fromEmail: null,
  replyTo: null,
  templates: { [key]: { enabled, subjectOverride } },
});

describe("resolveTemplate", () => {
  it("defaults to enabled=true / no override when settings have no row for the key", () => {
    expect(resolveTemplate(emptySettings, "lead-confirmation")).toEqual({
      enabled: true,
      subjectOverride: null,
    });
  });

  it("returns enabled=false when admin disabled the template", () => {
    const s = withTemplate("dealer-reminder-1", false, null);
    expect(resolveTemplate(s, "dealer-reminder-1").enabled).toBe(false);
  });

  it("returns subjectOverride verbatim when set", () => {
    const s = withTemplate("lead-to-dealer", true, "Custom subject");
    expect(resolveTemplate(s, "lead-to-dealer").subjectOverride).toBe("Custom subject");
  });

  it("treats unrelated keys independently", () => {
    const s = withTemplate("magic-link", false, null);
    expect(resolveTemplate(s, "lead-confirmation").enabled).toBe(true);
    expect(resolveTemplate(s, "magic-link").enabled).toBe(false);
  });
});
