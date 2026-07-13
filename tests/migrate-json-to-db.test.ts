import { describe, expect, it } from "vitest";
import {
  buildMigratePlan,
  parseAppConfigFromLegacy,
  planModuleMigration,
  splitPanelRowsForVerify,
  verifyModuleRowsMatchPlan,
  verifyPanelModuleRoundTrip,
} from "../scripts/lib/migrateJsonToDb.js";

describe("migrateJsonToDb", () => {
  it("excludes DB bootstrap keys from app_config", () => {
    const rows = parseAppConfigFromLegacy({
      dbHost: "localhost",
      dbPort: 5432,
      discordToken: "tok",
      webPort: 8088,
    });
    expect(rows.discordToken).toBe("tok");
    expect(rows.webPort).toBe(8088);
    expect(rows.dbHost).toBeUndefined();
  });

  it("merges tickets types into ticketTypes", () => {
    const plan = planModuleMigration(
      "tickets",
      {
        enabled: true,
        ticketTypes: [
          { id: "a", published: false, channelId: "1", panelMessageId: "" },
        ],
      },
      {
        disabled: "off",
        types: { a: { panelTitle: "T", openButtonLabel: "Open" } },
      },
    );
    expect(plan.rows.disabled).toBe("off");
    expect(plan.rows.types).toBeUndefined();
    const list = plan.rows.ticketTypes as Record<string, unknown>[];
    expect(list[0].panelTitle).toBe("T");
    expect(list[0].channelId).toBe("1");
  });

  it("round-trips tickets panel split for verify", () => {
    const plan = planModuleMigration(
      "tickets",
      {
        ticketTypes: [
          {
            id: "a",
            published: true,
            channelId: "1",
            panelMessageId: "m",
            staffRoleId: "",
            deniedRoleIds: [],
          },
        ],
      },
      {
        types: {
          a: { panelTitle: "T", openButtonLabel: "Open" },
        },
      },
    );
    const split = splitPanelRowsForVerify("tickets", plan.rows);
    expect(split.config.ticketTypes).toEqual([
      {
        id: "a",
        published: true,
        channelId: "1",
        panelMessageId: "m",
        staffRoleId: "",
        deniedRoleIds: [],
      },
    ]);
    expect(split.texts.types).toEqual({
      a: { panelTitle: "T", openButtonLabel: "Open" },
    });
    expect(verifyModuleRowsMatchPlan("tickets", plan.rows, plan.rows)).toEqual(
      [],
    );
    expect(
      verifyPanelModuleRoundTrip(
        "tickets",
        plan.rows,
        {
          ticketTypes: [
            {
              id: "a",
              published: true,
              channelId: "1",
              panelMessageId: "m",
              staffRoleId: "",
              deniedRoleIds: [],
            },
          ],
        },
        {
          types: {
            a: { panelTitle: "T", openButtonLabel: "Open" },
          },
        },
      ),
    ).toEqual([]);
  });

  it("imports flat module keys", () => {
    const plan = planModuleMigration(
      "emojis",
      { enabled: true, emojiRoleId: "123" },
      { disabled: "nope" },
    );
    expect(plan.rows.enabled).toBe(true);
    expect(plan.rows.emojiRoleId).toBe("123");
    expect(plan.rows.disabled).toBe("nope");
    expect(verifyModuleRowsMatchPlan("emojis", plan.rows, plan.rows)).toEqual(
      [],
    );
    expect(
      verifyPanelModuleRoundTrip(
        "emojis",
        plan.rows,
        { enabled: true, emojiRoleId: "123" },
        { disabled: "nope" },
      ),
    ).toEqual([]);
  });

  it("builds full migrate plan", () => {
    const plan = buildMigratePlan({
      legacyConfig: { discordToken: "x", clientId: "y", dbHost: "h" },
      modules: [
        {
          namespace: "emojis",
          config: { enabled: true },
          texts: { disabled: "d" },
        },
      ],
    });
    expect(plan.appConfig.discordToken).toBe("x");
    expect(plan.modules).toHaveLength(1);
  });
});
