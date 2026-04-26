/**
 * ModulaFactory ABI — matches `contracts/src/ModulaFactory.sol`.
 */
export const modulaFactoryAbi = [
  {
    type: "constructor",
    inputs: [
      { name: "agencyImpl_", type: "address", internalType: "address" },
      { name: "appImpl_",    type: "address", internalType: "address" },
      { name: "registry_",   type: "address", internalType: "contract ModulaRegistry" },
    ],
    stateMutability: "nonpayable",
  },

  {
    type: "function",
    name: "agencyImpl",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "appImpl",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registry",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },

  {
    type: "function",
    name: "createModel",
    inputs: [
      {
        name: "asset",
        type: "tuple",
        internalType: "struct Asset",
        components: [
          { name: "currency",        type: "address", internalType: "address" },
          { name: "basePremium",     type: "uint256", internalType: "uint256" },
          { name: "feeRecipient",    type: "address", internalType: "address" },
          { name: "mintFeePercent",  type: "uint16",  internalType: "uint16" },
          { name: "burnFeePercent",  type: "uint16",  internalType: "uint16" },
        ],
      },
      { name: "slug",        type: "string", internalType: "string" },
      { name: "baseModel",   type: "string", internalType: "string" },
      { name: "modelType",   type: "string", internalType: "string" },
      { name: "manifestURI", type: "string", internalType: "string" },
    ],
    outputs: [
      { name: "agency", type: "address", internalType: "address" },
      { name: "app",    type: "address", internalType: "address" },
    ],
    stateMutability: "nonpayable",
  },

  {
    type: "event",
    name: "ModelDeployed",
    inputs: [
      { name: "agency",  type: "address", indexed: true, internalType: "address" },
      { name: "app",     type: "address", indexed: true, internalType: "address" },
      { name: "id",      type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "creator", type: "address", indexed: false, internalType: "address" },
    ],
    anonymous: false,
  },
] as const;
