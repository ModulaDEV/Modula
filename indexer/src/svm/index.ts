/**
 * Public surface of the indexer's SVM event source.
 *
 * Single-import barrel so consumers (the indexer entry, tests, future
 * cross-rail aggregators) can pull everything they need with one
 * statement instead of walking the file tree:
 *
 *   import { startSvmPoll, recordSvmCall, loadSvmCursor } from "../svm/index.js";
 *
 * Re-exports the full public API. Private helpers stay file-local.
 */

export * from "./constants.js";
export * from "./cursor.js";
export * from "./calls.js";
export * from "./poll.js";
