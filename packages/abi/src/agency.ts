/**
 * ModulaAgency ABI — matches `contracts/src/ModulaAgency.sol`.
 *
 * The Agency is the hottest contract surface from off-chain code:
 * the gateway calls `getWrapOracle` once per `tools/call` to populate
 * x402 PaymentRequirements. Keep these signatures stable.
 */
export const modulaAgencyAbi = [
  // -------- Constants --------
  {
    type: "function",
    name: "MAX_FEE_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint16", internalType: "uint16" }],
    stateMutability: "view",
  },

  // -------- Reads --------
  {
    type: "function",
    name: "app",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IModulaApp" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "assetData",
    inputs: [],
    outputs: [
      { name: "currency",       type: "address", internalType: "address" },
      { name: "basePremium",    type: "uint256", internalType: "uint256" },
      { name: "feeRecipient",   type: "address", internalType: "address" },
      { name: "mintFeePercent", type: "uint16",  internalType: "uint16" },
      { name: "burnFeePercent", type: "uint16",  internalType: "uint16" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWrapOracle",
    inputs: [{ name: "", type: "bytes", internalType: "bytes" }],
    outputs: [
      { name: "premium", type: "uint256", internalType: "uint256" },
      { name: "fee",     type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUnwrapOracle",
    inputs: [{ name: "", type: "bytes", internalType: "bytes" }],
    outputs: [
      { name: "premium", type: "uint256", internalType: "uint256" },
      { name: "fee",     type: "uint256", internalType: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getStrategy",
    inputs: [],
    outputs: [
      { name: "app_",   type: "address", internalType: "address" },
      {
        name: "asset_",
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
      { name: "attributeData_", type: "bytes", internalType: "bytes" },
    ],
    stateMutability: "view",
  },

  // -------- Writes --------
  {
    type: "function",
    name: "wrap",
    inputs: [
      { name: "to",   type: "address", internalType: "address" },
      { name: "data", type: "bytes",   internalType: "bytes" },
    ],
    outputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "unwrap",
    inputs: [
      { name: "to",      type: "address", internalType: "address" },
      { name: "tokenId", type: "uint256", internalType: "uint256" },
      { name: "data",    type: "bytes",   internalType: "bytes" },
    ],
    outputs: [],
    stateMutability: "payable",
  },

  // -------- Events --------
  {
    type: "event",
    name: "Wrap",
    inputs: [
      { name: "to",      type: "address", indexed: true, internalType: "address" },
      { name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "premium", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "fee",     type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "Unwrap",
    inputs: [
      { name: "to",      type: "address", indexed: true, internalType: "address" },
      { name: "tokenId", type: "uint256", indexed: true, internalType: "uint256" },
      { name: "premium", type: "uint256", indexed: false, internalType: "uint256" },
      { name: "fee",     type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
] as const;
