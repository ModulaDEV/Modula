// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  IModulaRegistry
 * @notice Public read interface for the Modula on-chain registry — the
 *         single source of truth for which models exist on the protocol.
 * @dev    The mutating side (`register`) is gated to the canonical
 *         `ModulaFactory` and lives in the implementation, not here.
 *         Anyone may read.
 */
interface IModulaRegistry {
    /// @notice Static description of one registered model.
    struct Record {
        address agency;       // ERC-7527 Agency contract for this model
        address app;          // ERC-7527 App (ERC-721) for this model
        address treasury;     // creator-controlled Safe receiving fees + revenue
        address creator;      // wallet that called the factory
        string slug;          // canonical, human-readable id ("solidity-audit-v3")
        string baseModel;     // base model the fine-tune is built on ("Llama-3-8B")
        string modelType;     // "LoRA" | "Adapter" | "Small" | "DomainExpert"
        string manifestURI;   // ipfs://… capability schema + runtime URL
        uint64 registeredAt;  // block.timestamp of registration
    }

    /// @notice Emitted exactly once per model when the factory registers it.
    event ModelRegistered(bytes32 indexed id, address indexed creator, Record record);

    /// @notice Look up a model by its canonical id (keccak256(slug)).
    /// @return record The full Record. Empty if `id` is not registered.
    function records(bytes32 id) external view returns (Record memory record);

    /// @notice Reverse lookup: which model id this Agency belongs to.
    /// @return id keccak256(slug) for the matching model, or bytes32(0)
    ///         if the Agency is not registered.
    function byAgency(address agency) external view returns (bytes32 id);

    /// @notice The contract authorized to call `register`. Set immutable
    ///         at construction.
    function factory() external view returns (address);
}
