/**
 * ModulaAccessRouter ABI — matches `contracts/src/ModulaAccessRouter.sol`.
 *
 * The indexer cares almost exclusively about the `ModelCalled` event
 * surface here. The gateway cares about the `log` write. The owner
 * cares about `setGatewaySigner`. Three consumers, one ABI.
 */
export const modulaAccessRouterAbi = [
  {
    type: "function",
    name: "gatewaySigner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "log",
    inputs: [
      { name: "modelId",   type: "bytes32", internalType: "bytes32" },
      { name: "agent",     type: "address", internalType: "address" },
      { name: "paidUSDC",  type: "uint256", internalType: "uint256" },
      { name: "latencyMs", type: "uint64",  internalType: "uint64" },
      { name: "txHash",    type: "bytes32", internalType: "bytes32" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "setGatewaySigner",
    inputs: [{ name: "newSigner", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  {
    type: "event",
    name: "ModelCalled",
    inputs: [
      { name: "modelId",   type: "bytes32", indexed: true, internalType: "bytes32" },
      { name: "agent",     type: "address", indexed: true, internalType: "address" },
      { name: "paidUSDC",  type: "uint256", indexed: false, internalType: "uint256" },
      { name: "latencyMs", type: "uint64",  indexed: false, internalType: "uint64" },
      { name: "txHash",    type: "bytes32", indexed: false, internalType: "bytes32" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "GatewaySignerRotated",
    inputs: [
      { name: "oldSigner", type: "address", indexed: true, internalType: "address" },
      { name: "newSigner", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
] as const;
