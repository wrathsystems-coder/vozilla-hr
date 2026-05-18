import * as migration_20260502_111157 from "./20260502_111157";
import * as migration_20260508_194444 from "./20260508_194444";
import * as migration_20260514_150158 from "./20260514_150158";
import * as migration_20260514_154535 from "./20260514_154535";
import * as migration_20260514_163301 from "./20260514_163301";
import * as migration_20260514_211252_sprint8_model_versions_filter_columns from "./20260514_211252_sprint8_model_versions_filter_columns";
import * as migration_20260518_144240_sprint8_extended_filter_dimensions from "./20260518_144240_sprint8_extended_filter_dimensions";

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
  {
    up: migration_20260514_211252_sprint8_model_versions_filter_columns.up,
    down: migration_20260514_211252_sprint8_model_versions_filter_columns.down,
    name: "20260514_211252_sprint8_model_versions_filter_columns",
  },
  {
    up: migration_20260518_144240_sprint8_extended_filter_dimensions.up,
    down: migration_20260518_144240_sprint8_extended_filter_dimensions.down,
    name: "20260518_144240_sprint8_extended_filter_dimensions",
  },
];
