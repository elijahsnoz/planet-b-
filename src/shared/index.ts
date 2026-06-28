/**
 * @shared — the shared kernel. Depends on NOTHING in the platform or domains.
 * This is the only "downward" dependency every domain is allowed to have.
 */
export * from "./kernel/result";
export * from "./kernel/errors";
export * from "./kernel/pagination";
export * from "./kernel/id";
export * from "./kernel/clock";
export * from "./kernel/preservation";
export * from "./kernel/repository";
