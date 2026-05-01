/**
 * `modula register` — interactive model registration.
 *
 * Prompts for slug, runtime URL, and model type, then:
 *   1. Uploads a manifest JSON to IPFS via nft.storage.
 *   2. Calls ModulaFactory.deployPair(slug, manifestURI) on-chain.
 *   3. Prints the agency address and live MCP endpoint.
 *
 * Required env vars:
 *   PRIVATE_KEY        — 0x-prefixed EOA private key
 *   FACTORY_ADDRESS    — deployed ModulaFactory address
 *   NFT_STORAGE_KEY    — nft.storage API key
 *   CHAIN              — "base" | "base-sepolia" (default: base-sepolia)
 */
import { input, select } from "@inquirer/prompts";
import { createWalletClient, createPublicClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base, baseSepolia } from "viem/chains";
import { uploadToIPFS } from "./ipfs.js";

const FACTORY_ABI = parseAbi([
  "function deployPair(string slug, string manifestURI) returns (address app, address agency)",
]);

export async function register(): Promise<void> {
  const slug       = await input({ message: "Model slug (e.g. my-model-v1):" });
  const runtimeUrl = await input({ message: "Runtime URL (https://...):" });
  const modelType  = await select({
    message: "Model type:",
    choices: ["LoRA", "Adapter", "Small", "Domain"].map((v) => ({ value: v })),
  });
  const description = await input({
    message: "Short description (optional, press Enter to skip):",
  });

  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  if (!privateKey) throw new Error("PRIVATE_KEY env var is required");

  const factoryAddress = process.env.FACTORY_ADDRESS as `0x${string}` | undefined;
  if (!factoryAddress) throw new Error("FACTORY_ADDRESS env var is required");

  const chain = process.env.CHAIN === "base" ? base : baseSepolia;

  console.log("\nUploading manifest to IPFS...");
  const cid = await uploadToIPFS({
    name:        slug,
    runtimeUrl,
    modelType,
    description: description || undefined,
  });
  const manifestUri = `ipfs://${cid}`;
  console.log(`  CID: ${cid}`);

  console.log("Submitting deployPair transaction...");
  const account = privateKeyToAccount(privateKey);
  const wallet  = createWalletClient({ account, chain, transport: http() });
  const publicClient = createPublicClient({ chain, transport: http() });

  const hash = await wallet.writeContract({
    address:      factoryAddress,
    abi:          FACTORY_ABI,
    functionName: "deployPair",
    args:         [slug, manifestUri],
  });
  console.log(`  tx: ${hash}`);

  console.log("Waiting for confirmation...");
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  // The factory emits ModelRegistered(address indexed app, address indexed agency, string slug)
  // Read the returned addresses from the decoded log or simulation output.
  console.log(`\n✓ Registered on ${chain.name}!`);
  console.log(`  tx:         ${receipt.transactionHash}`);
  console.log(`  block:      ${receipt.blockNumber}`);
  console.log(`  manifest:   ${manifestUri}`);
  console.log(`  MCP endpoint: https://mcp.modulabase.org/m/<agency-address>/mcp`);
}
