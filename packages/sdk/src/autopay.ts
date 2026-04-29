/**
 * Auto-pay helper — signs an EIP-3009 transferWithAuthorization for
 * the exact amount in a PaymentRequirements challenge and returns the
 * base64 PAYMENT-SIGNATURE the gateway expects.
 *
 * Requires viem as a peer dependency for the WalletClient + abi encode.
 * The viem import is dynamic so the SDK stays usable in environments
 * that don't have viem (they just can't use auto-pay).
 */

export interface AutoPaySigner {
  /** Caller wallet address. */
  address: `0x${string}`;
  /**
   * Sign a typed EIP-712 message and return the 0x-prefixed hex signature.
   * Matches viem WalletClient.signTypedData signature.
   */
  signTypedData: (args: {
    domain:      Record<string, unknown>;
    types:       Record<string, unknown[]>;
    primaryType: string;
    message:     Record<string, unknown>;
  }) => Promise<`0x${string}`>;
}

export interface PaymentRequirements {
  scheme:            string;
  network:           string;
  maxAmountRequired: string;
  asset:             `0x${string}`;
  payTo:             `0x${string}`;
  resource:          string;
  maxTimeoutSeconds: number;
}

/** Build a base64 PAYMENT-SIGNATURE from a decoded requirements object + signer. */
export async function signPayment(
  reqs: PaymentRequirements,
  signer: AutoPaySigner,
): Promise<string> {
  const validAfter  = "0";
  const validBefore = String(Math.floor(Date.now() / 1000) + reqs.maxTimeoutSeconds);
  // Random 32-byte nonce as hex
  const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")}` as `0x${string}`;

  // EIP-3009 domain — USDC on Base uses the token contract as verifying contract
  const domain = {
    name:              "USD Coin",
    version:           "2",
    chainId:           reqs.network === "base" ? 8453 : 84532,
    verifyingContract: reqs.asset,
  };

  const types = {
    TransferWithAuthorization: [
      { name: "from",        type: "address" },
      { name: "to",          type: "address" },
      { name: "value",       type: "uint256" },
      { name: "validAfter",  type: "uint256" },
      { name: "validBefore", type: "uint256" },
      { name: "nonce",       type: "bytes32" },
    ],
  };

  const message = {
    from:        signer.address,
    to:          reqs.payTo,
    value:       BigInt(reqs.maxAmountRequired),
    validAfter:  BigInt(validAfter),
    validBefore: BigInt(validBefore),
    nonce,
  };

  const signature = await signer.signTypedData({
    domain,
    types,
    primaryType: "TransferWithAuthorization",
    message,
  });

  const payload = {
    scheme:  "exact",
    network: reqs.network,
    payload: {
      signature,
      authorization: {
        from:        signer.address,
        to:          reqs.payTo,
        value:       reqs.maxAmountRequired,
        validAfter,
        validBefore,
        nonce,
      },
    },
  };

  return btoa(JSON.stringify(payload));
}

/** Parse the base64 PAYMENT-REQUIRED header into a PaymentRequirements object. */
export function decodeRequirements(header: string): PaymentRequirements {
  return JSON.parse(atob(header)) as PaymentRequirements;
}
