// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Asset} from "./IERC7527.sol";

/**
 * @title  IModulaFactory
 * @notice Public interface of the canonical model factory.
 * @dev    Deploys an Agency + App pair as EIP-1167 clones and registers
 *         the resulting record in the global ModulaRegistry. There is
 *         exactly one Factory per chain.
 */
interface IModulaFactory {
    /// @notice Emitted once per successful `createModel` call.
    event ModelDeployed(
        address indexed agency,
        address indexed app,
        bytes32 indexed id,
        address creator
    );

    /// @notice Deploy a fresh (Agency, App) pair and register the model.
    /// @param  asset       Reserve + fee schedule for the model's bonding curve.
    /// @param  slug        Canonical, globally-unique model id (e.g. "solidity-audit-v3").
    /// @param  baseModel   Base model identifier (e.g. "Llama-3-8B").
    /// @param  modelType   "LoRA" | "Adapter" | "Small" | "DomainExpert".
    /// @param  manifestURI ipfs:// URI of the manifest JSON.
    /// @return agency      Address of the freshly-deployed Agency clone.
    /// @return app         Address of the freshly-deployed App clone.
    function createModel(
        Asset calldata asset,
        string calldata slug,
        string calldata baseModel,
        string calldata modelType,
        string calldata manifestURI
    )
        external
        returns (address agency, address app);

    /// @notice Implementation contract used to clone Agency instances.
    function agencyImpl() external view returns (address);

    /// @notice Implementation contract used to clone App instances.
    function appImpl() external view returns (address);

    /// @notice The registry this factory writes to.
    function registry() external view returns (address);
}
