import * as migration_20260502_111157 from "./20260502_111157";
import * as migration_20260508_194444 from "./20260508_194444";
import * as migration_20260514_150158 from "./20260514_150158";
import * as migration_20260514_154535 from "./20260514_154535";
import * as migration_20260514_163301 from "./20260514_163301";

export const migrations = [
  {
    up: migration_20260502_111157.up,
    down: migration_20260502_111157.down,
    name: "20260502_111157",
  },
  {
    up: migration_20260508_194444.up,
    down: migration_20260508_194444.down,
    name: "20260508_194444",
  },
  {
    up: migration_20260514_150158.up,
    down: migration_20260514_150158.down,
    name: "20260514_150158",
  },
  {
    up: migration_20260514_154535.up,
    down: migration_20260514_154535.down,
    name: "20260514_154535",
  },
  {
    up: migration_20260514_163301.up,
    down: migration_20260514_163301.down,
    name: "20260514_163301",
  },
];
