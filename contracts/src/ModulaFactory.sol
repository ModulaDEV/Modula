// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Clones}         from "@openzeppelin/contracts/proxy/Clones.sol";

import {IModulaFactory}  from "./interfaces/IModulaFactory.sol";
import {IModulaRegistry} from "./interfaces/IModulaRegistry.sol";
import {Asset}           from "./interfaces/IERC7527.sol";
import {IModulaApp}      from "./interfaces/IModulaApp.sol";
import {IModulaAgency}   from "./interfaces/IModulaAgency.sol";

import {ModulaRegistry} from "./ModulaRegistry.sol";
import {ModulaApp}      from "./ModulaApp.sol";
import {ModulaAgency}   from "./ModulaAgency.sol";

import {SlugLib}        from "./libraries/SlugLib.sol";
import {Errors}         from "./libraries/Errors.sol";

/**
 * @title  ModulaFactory
 * @notice The single entry point creators use to register a model.
 * @dev    Deploys an (Agency, App) pair as EIP-1167 minimal proxy
 *         clones, initialises both, and writes the record to the
 *         global ModulaRegistry — atomic, no in-between states an
 *         indexer would need to handle.
 *
 *         The two implementation contracts (`agencyImpl`, `appImpl`)
 *         are immutable. Bumping them would mean deploying a new
 *         Factory with a new Registry — which is the protocol's
 *         "v2" path, not an upgrade path.
 *
 * @custom:invariant agencyImpl, appImpl, registry all immutable
 * @custom:invariant every successful createModel call results in exactly
 *                   one new ModelRegistered + one new ModelDeployed event
 *                   *atomically* (i.e. either both fire or both revert)
 */
contract ModulaFactory is IModulaFactory {
    using Clones for address;

    /// @inheritdoc IModulaFactory
    address public immutable override agencyImpl;

    /// @inheritdoc IModulaFactory
    address public immutable override appImpl;

    /// @inheritdoc IModulaFactory
    address public immutable override registry;

    constructor(address agencyImpl_, address appImpl_, ModulaRegistry registry_) {
        if (agencyImpl_ == address(0) || appImpl_ == address(0)) {
            revert Errors.InvalidImplementation();
        }
        if (address(registry_) == address(0)) revert Errors.InvalidRegistry();

        agencyImpl = agencyImpl_;
        appImpl    = appImpl_;
        registry   = address(registry_);
    }

    /// @inheritdoc IModulaFactory
    function createModel(
        Asset calldata asset,
        string calldata slug,
        string calldata baseModel,
        string calldata modelType,
        string calldata manifestURI
    )
        external
        override
        returns (address agency, address app)
    {
        // Pre-flight: bounce malformed slugs *before* we incur clone costs.
        bytes32 id = SlugLib.validate(slug);

        // Pre-flight #2: refuse if the slug is already taken so we don't
        // clone two contracts that immediately self-destruct on revert.
        // The Registry will revert on duplicate too — this is belt-and-
        // suspenders for explorability of the failure mode.
        if (_isTaken(id)) revert Errors.AlreadyRegistered();

        // Clone the App first so we have its address to feed into the
        // Agency's initialize. App is bound to its Agency in the next
        // step; nothing about App is callable from outside in between.
        app    = appImpl.clone();
        agency = agencyImpl.clone();

        ModulaApp(app).initialize(payable(agency), slug);
        ModulaAgency(payable(agency)).initialize(IModulaApp(app), asset, "");

        // Atomic registration. If this revert, the clones are wasted
        // (gas burned, contracts orphaned) but no Record is written —
        // i.e. the on-chain index never reflects a half-built model.
        ModulaRegistry(registry).register(
            IModulaRegistry.Record({
                agency:       agency,
                app:          app,
                treasury:     asset.feeRecipient,
                creator:      msg.sender,
                slug:         slug,
                baseModel:    baseModel,
                modelType:    modelType,
                manifestURI:  manifestURI,
                registeredAt: uint64(block.timestamp)
            })
        );

        emit ModelDeployed(agency, app, id, msg.sender);
    }

    function _isTaken(bytes32 id) internal view returns (bool) {
        ModulaRegistry.Record memory r = ModulaRegistry(registry).records(id);
        return r.agency != address(0);
    }
}
