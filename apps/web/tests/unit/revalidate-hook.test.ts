import { describe, expect, it, vi, beforeEach } from "vitest";

const revalidateTagSpy = vi.fn();

vi.mock("next/cache", () => ({
  revalidateTag: (tag: string) => revalidateTagSpy(tag),
}));

import {
  makeCollectionRevalidateHooks,
  makeGlobalRevalidateHook,
} from "@/lib/payload/revalidate-hook";

beforeEach(() => {
  revalidateTagSpy.mockReset();
});

const collectionCtx = (slug: string) =>
  ({ collection: { slug } }) as Parameters<
    ReturnType<typeof makeCollectionRevalidateHooks>["afterChange"]
  >[0];

describe("makeCollectionRevalidateHooks", () => {
  it("calls revalidateTag for each tag on afterChange", () => {
    const { afterChange } = makeCollectionRevalidateHooks(["brands", "models"]);
    afterChange({ ...collectionCtx("brands"), doc: { id: 1 } } as never);
    expect(revalidateTagSpy).toHaveBeenCalledTimes(2);
    expect(revalidateTagSpy).toHaveBeenNthCalledWith(1, "brands");
    expect(revalidateTagSpy).toHaveBeenNthCalledWith(2, "models");
  });

  it("calls revalidateTag for each tag on afterDelete", () => {
    const { afterDelete } = makeCollectionRevalidateHooks(["reviews"]);
    afterDelete({ ...collectionCtx("reviews"), doc: { id: 9 } } as never);
    expect(revalidateTagSpy).toHaveBeenCalledTimes(1);
    expect(revalidateTagSpy).toHaveBeenCalledWith("reviews");
  });

  it("returns the doc unchanged so Payload can continue the pipeline", () => {
    const { afterChange } = makeCollectionRevalidateHooks(["pages"]);
    const doc = { id: 42, title: "About" };
    const out = afterChange({ ...collectionCtx("pages"), doc } as never);
    expect(out).toBe(doc);
  });

  it("does not throw when revalidateTag rejects (e.g. outside request scope)", () => {
    revalidateTagSpy.mockImplementationOnce(() => {
      throw new Error("revalidateTag called outside of a request");
    });
    const { afterChange } = makeCollectionRevalidateHooks(["brands"]);
    expect(() =>
      afterChange({ ...collectionCtx("brands"), doc: { id: 1 } } as never),
    ).not.toThrow();
  });
});

describe("makeGlobalRevalidateHook", () => {
  it("revalidates the tag on global change", () => {
    const hook = makeGlobalRevalidateHook(["leasing_defaults"]);
    hook({ global: { slug: "leasing_defaults" }, doc: { disclaimer: "x" } } as never);
    expect(revalidateTagSpy).toHaveBeenCalledWith("leasing_defaults");
  });
});
