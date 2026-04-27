// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IModulaRegistry} from "./interfaces/IModulaRegistry.sol";
import {SlugLib}         from "./libraries/SlugLib.sol";
import {Errors}          from "./libraries/Errors.sol";

/**
 * @title  ModulaRegistry
 * @notice The global on-chain index of every model registered with the
 *         Modula protocol. There is exactly one Registry per chain and
 *         the address is published in the public site config.
 *
 * @dev    The Registry is intentionally append-only. Records cannot be
 *         updated, slugs cannot be re-bound to a different (Agency, App)
 *         pair, and there is no admin path to remove a record. This is
 *         the same posture other on-chain registries (ENS, ERC-5564,
 *         ERC-6551) take: censorship resistance is the load-bearing
 *         property and immutability is the cheapest way to guarantee it.
 *
 *         Mutation is gated to one address: the canonical ModulaFactory
 *         set immutably at construction. Anyone may call createModel() on
 *         the factory; the factory in turn deploys a (Agency, App) pair
 *         and atomically registers them here. No other path writes to
 *         this contract.
 *
 * @custom:invariant once set, records[id] never changes
 * @custom:invariant only `factory` may call register
 * @custom:invariant byAgency is the inverse of records (forall id, byAgency[records[id].agency] == id)
 */
contract ModulaRegistry is IModulaRegistry {
    /// @inheritdoc IModulaRegistry
    address public immutable override factory;

    /// @dev Storage backing the public `records()` getter. Private so the
    ///      auto-generated getter doesn't shadow the interface signature.
    mapping(bytes32 => Record) private _records;

    /// @inheritdoc IModulaRegistry
    mapping(address => bytes32) public override byAgency;

    constructor(address factory_) {
        if (factory_ == address(0)) revert Errors.ZeroAddress();
        factory = factory_;
    }

    /// @notice Append a new model record. Reverts unless caller is the factory
    ///         and the slug has not been registered before.
    /// @param  r The new record. `slug` is validated; `id` is derived as
    ///           keccak256(bytes(slug)).
    /// @return id The canonical id under which the record is now stored.
    function register(Record calldata r) external returns (bytes32 id) {
        if (msg.sender != factory) revert Errors.NotFactory();

        id = SlugLib.validate(r.slug);

        // Append-only check — no slot reuse, ever.
        if (_records[id].agency != address(0)) revert Errors.AlreadyRegistered();

        _records[id]    = r;
        byAgency[r.agency] = id;

        emit ModelRegistered(id, r.creator, r);
    }

    /// @inheritdoc IModulaRegistry
    function records(bytes32 id) external view override returns (Record memory) {
        return _records[id];
    }

    /// @notice Convenience helper — true iff a model with this slug exists.
    function isRegistered(string calldata slug) external view returns (bool) {
        bytes32 id = keccak256(bytes(slug));
        return _records[id].agency != address(0);
    }
}
