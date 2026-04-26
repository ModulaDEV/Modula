/**
 * @modula/abi — barrel export.
 *
 * Each subpath is also importable directly via `@modula/abi/<name>`
 * for tighter bundles on the frontend.
 */

export { modulaRegistryAbi }     from "./registry.js";
export { modulaFactoryAbi }      from "./factory.js";
export { modulaAgencyAbi }       from "./agency.js";
export { modulaAppAbi }          from "./app.js";
export { modulaAccessRouterAbi } from "./access.js";
export { erc20Abi }              from "./erc20.js";

export { ADDRESSES, chainById }  from "./addresses.js";
export type { ChainKey, ChainConfig } from "./addresses.js";
