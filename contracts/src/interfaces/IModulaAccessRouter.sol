// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  IModulaAccessRouter
 * @notice Off-chain → on-chain bookkeeping bridge.
 * @dev    The Modula MCP gateway calls `log(...)` after every successful
 *         x402-paid `tools/call`. Emitting through a dedicated contract
 *         (instead of having the gateway sign on behalf of each Agency)
 *         keeps the per-call gas footprint tiny and the on-chain
 *         analytics trail uniform.
 *
 *         This contract is deliberately permissioned: only `gatewaySigner`
 *         may call `log(...)`. The gatewaySigner is a hot wallet held by
 *         the gateway service; rotating it is a no-op for inference
 *         users (their funds are gated by x402 in front of this contract,
 *         not by the contract itself).
 */
interface IModulaAccessRouter {
    /// @notice Emitted on every successful inference call routed through
    ///         the gateway.
    /// @param  modelId   keccak256(slug) of the called model.
    /// @param  agent     EOA that signed the x402 payment.
    /// @param  paidUSDC  USDC base units transferred (6 dp).
    /// @param  latencyMs Wall-clock latency observed by the gateway.
    /// @param  txHash    The x402 settlement transaction hash, for cross-ref.
    event ModelCalled(
        bytes32 indexed modelId,
        address indexed agent,
        uint256 paidUSDC,
        uint64  latencyMs,
        bytes32 txHash
    );

    /// @notice The hot wallet authorized to emit ModelCalled events.
    function gatewaySigner() external view returns (address);

    /// @notice Emit ModelCalled. Reverts unless `msg.sender == gatewaySigner`.
    function log(
        bytes32 modelId,
        address agent,
        uint256 paidUSDC,
        uint64  latencyMs,
        bytes32 txHash
    )
        external;
}
