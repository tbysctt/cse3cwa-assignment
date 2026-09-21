/**
 * Public data access layer. Business logic should import from here only —
 * do not use Drizzle or `dal/client` outside this folder.
 *
 * Client components must use `import type` from `@/dal/types` only.
 */

export {
  createActivity,
  deleteActivity,
  getActivity,
  listActivities,
  ping,
  updateActivity,
} from "./activities";

export {
  createWord,
  deleteWord,
  findWordBySlug,
  getKeyboardRows,
  listPhonemeInventory,
  listWords,
  updateWord,
} from "./reference";

export type { BankWordInput } from "./reference";

export type {
  ActivityConfiguration,
  ActivitySummary,
  ActivityType,
  CreateActivityInput,
  Difficulty,
  ListActivitiesFilter,
  PhonemeInput,
  StoredWord,
  UpdateActivityInput,
  WordInput,
} from "./types";

export { DalNotFoundError, DalValidationError } from "./errors";
