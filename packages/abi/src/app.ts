/**
 * ModulaApp ABI — matches `contracts/src/ModulaApp.sol`.
 *
 * The App's IERC721 surface (transferFrom, ownerOf, approve, etc.) is
 * intentionally omitted here — consumers that need it should import
 * the standard ERC-721 ABI separately. This file ships only the Modula
 * additions so the bundle stays small.
 */
export const modulaAppAbi = [
  // -------- ERC-7527 / IModulaApp surface --------
  {
    type: "function",
    name: "agency",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address payable" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "slug",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAgency",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address payable" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getMaxSupply",
    inputs: [],
    outputs: [{ name: "", type: "uint256", internalType: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getName",
    inputs: [{ name: "id", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },

  // ERC-721 metadata reads we override
  {
    type: "function",
    name: "name",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "symbol",
    inputs: [],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "tokenURI",
    inputs: [{ name: "tokenId", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "string", internalType: "string" }],
    stateMutability: "view",
  },
] as const;
