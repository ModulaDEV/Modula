// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {Ownable}      from "@openzeppelin/contracts/access/Ownable.sol";

import {IModulaAccessRouter} from "./interfaces/IModulaAccessRouter.sol";
import {Errors}              from "./libraries/Errors.sol";

/**
 * @title  ModulaAccessRouter
 * @notice Off-chain → on-chain bookkeeping bridge for the Modula MCP
 *         gateway. After every successful x402-paid `tools/call`, the
 *         gateway calls {log} which emits {ModelCalled}. The indexer
 *         tails this event for the call-counters and sparklines on the
 *         registry page.
 *
 * @dev    The hot wallet that calls {log} (`gatewaySigner`) is not the
 *         contract owner. Two-step ownership is held by the protocol
 *         multisig, which can rotate the gatewaySigner if the hot wallet
 *         is compromised. This separation is important: rotating the
 *         signer must not require a sensitive multisig key.
 *
 *         Compromise of the gatewaySigner key would let an attacker
 *         emit fake ModelCalled events but cannot let them charge any
 *         user — payment gating happens in x402 upstream of this contract.
 *         A fake event surfaces in the indexer as inflated call counts,
 *         which is detectable and recoverable (rotate signer, re-index
 *         from the rotation block forward).
 *
 * @custom:invariant gatewaySigner != address(0) after construction
 * @custom:invariant only `gatewaySigner` may emit ModelCalled
 * @custom:invariant only `owner` may call setGatewaySigner
 */
contract ModulaAccessRouter is IModulaAccessRouter, Ownable2Step {
    /// @inheritdoc IModulaAccessRouter
    address public override gatewaySigner;

    /// @notice Emitted whenever the protocol owner rotates the signer.
    event GatewaySignerRotated(address indexed oldSigner, address indexed newSigner);

    constructor(address owner_, address gatewaySigner_) Ownable(owner_) {
        if (owner_ == address(0)) revert Errors.ZeroAddress();
        if (gatewaySigner_ == address(0)) revert Errors.EmptySigner();
        gatewaySigner = gatewaySigner_;
        emit GatewaySignerRotated(address(0), gatewaySigner_);
    }

    /// @inheritdoc IModulaAccessRouter
    function log(
        bytes32 modelId,
        address agent,
        uint256 paidUSDC,
        uint64  latencyMs,
        bytes32 txHash
    )
        external
        override
    {
        if (msg.sender != gatewaySigner) revert Errors.NotGatewaySigner();
        emit ModelCalled(modelId, agent, paidUSDC, latencyMs, txHash);
    }

    /// @notice Rotate the hot-wallet signer that may emit ModelCalled.
    /// @dev    Two-step ownership (Ownable2Step) gates this entry point.
    function setGatewaySigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert Errors.EmptySigner();
        emit GatewaySignerRotated(gatewaySigner, newSigner);
        gatewaySigner = newSigner;
    }
}
