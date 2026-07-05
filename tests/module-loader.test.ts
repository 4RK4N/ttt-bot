import { describe, expect, it } from "vitest";
import { loadModules } from "../bot/src/moduleLoader.js";

describe("loadModules", () => {
  it("discovers modules under bot/src/modules", async () => {
    const { handlers, inits, componentRoutes } = await loadModules();

    expect(inits.length).toBeGreaterThan(0);
    expect(handlers.size + componentRoutes.length).toBeGreaterThan(0);
  });
});
