/**
 * ModulaRegistry ABI — exact match for `contracts/src/ModulaRegistry.sol`.
 *
 * Hand-curated from the Solidity source. The order of struct fields
 * inside `Record` is load-bearing: change it and clients that ABI-decode
 * the `ModelRegistered` event will silently mis-attribute fields.
 */
export const modulaRegistryAbi = [
  // -------- Constructor --------
  {
    type: "constructor",
    inputs: [{ name: "factory_", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },

  // -------- Reads --------
  {
    type: "function",
    name: "factory",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "byAgency",
    inputs: [{ name: "agency", type: "address", internalType: "address" }],
    outputs: [{ name: "id", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "records",
    inputs: [{ name: "id", type: "bytes32", internalType: "bytes32" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct IModulaRegistry.Record",
        components: [
          { name: "agency",       type: "address", internalType: "address" },
          { name: "app",          type: "address", internalType: "address" },
          { name: "treasury",     type: "address", internalType: "address" },
          { name: "creator",      type: "address", internalType: "address" },
          { name: "slug",         type: "string",  internalType: "string" },
          { name: "baseModel",    type: "string",  internalType: "string" },
          { name: "modelType",    type: "string",  internalType: "string" },
          { name: "manifestURI",  type: "string",  internalType: "string" },
          { name: "registeredAt", type: "uint64",  internalType: "uint64" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isRegistered",
    inputs: [{ name: "slug", type: "string", internalType: "string" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },

  // -------- Writes --------
  {
    type: "function",
    name: "register",
    inputs: [
      {
        name: "r",
        type: "tuple",
        internalType: "struct IModulaRegistry.Record",
        components: [
          { name: "agency",       type: "address", internalType: "address" },
          { name: "app",          type: "address", internalType: "address" },
          { name: "treasury",     type: "address", internalType: "address" },
          { name: "creator",      type: "address", internalType: "address" },
          { name: "slug",         type: "string",  internalType: "string" },
          { name: "baseModel",    type: "string",  internalType: "string" },
          { name: "modelType",    type: "string",  internalType: "string" },
          { name: "manifestURI",  type: "string",  internalType: "string" },
          { name: "registeredAt", type: "uint64",  internalType: "uint64" },
        ],
      },
    ],
    outputs: [{ name: "id", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "nonpayable",
  },

  // -------- Events --------
  {
    type: "event",
    name: "ModelRegistered",
    inputs: [
      { name: "id",      type: "bytes32", indexed: true,  internalType: "bytes32" },
      { name: "creator", type: "address", indexed: true,  internalType: "address" },
      {
        name: "record",
        type: "tuple",
        indexed: false,
        internalType: "struct IModulaRegistry.Record",
        components: [
          { name: "agency",       type: "address", internalType: "address" },
          { name: "app",          type: "address", internalType: "address" },
          { name: "treasury",     type: "address", internalType: "address" },
          { name: "creator",      type: "address", internalType: "address" },
          { name: "slug",         type: "string",  internalType: "string" },
          { name: "baseModel",    type: "string",  internalType: "string" },
          { name: "modelType",    type: "string",  internalType: "string" },
          { name: "manifestURI",  type: "string",  internalType: "string" },
          { name: "registeredAt", type: "uint64",  internalType: "uint64" },
        ],
      },
    ],
    anonymous: false,
  },
] as const;
