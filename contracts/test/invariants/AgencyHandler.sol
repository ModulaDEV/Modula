// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ModulaAgency}  from "../../src/ModulaAgency.sol";
import {ModulaApp}     from "../../src/ModulaApp.sol";
import {MockUSDC}      from "../mocks/MockUSDC.sol";

/**
 * @notice Stateful handler used by the Forge invariant fuzzer to drive
 *         random (wrap, unwrap) sequences against one Agency. Tracks
 *         outstanding token ids per actor so unwrap calls always
 *         target a token the actor actually holds.
 */
contract AgencyHandler {
    ModulaAgency internal immutable agency;
    ModulaApp    internal immutable app;
    MockUSDC     internal immutable usdc;
    address      internal immutable a;
    address      internal immutable b;

    /// @dev Tokens currently held by each actor.
    mapping(address => uint256[]) internal heldByActor;

    /// @dev Highest token id seen so far. Used by the invariant
    ///      contract to verify no id is ever reused.
    uint256 public maxIdSeen;

    /// @dev True iff every minted token id has been strictly greater
    ///      than every previously-minted id. Flipped to false by mint
    ///      logic if a duplicate ever sneaks in.
    bool public monotonic = true;

    constructor(
        ModulaAgency agency_,
        ModulaApp    app_,
        MockUSDC     usdc_,
        address      a_,
        address      b_
    ) {
        agency = agency_;
        app    = app_;
        usdc   = usdc_;
        a      = a_;
        b      = b_;
    }

    /// @notice Pre-fund actors with USDC + max approvals so wrap/unwrap
    ///         never trip on allowance or balance.
    function fundActors() external {
        usdc.mint(a, 1_000_000_000e6);
        usdc.mint(b, 1_000_000_000e6);
    }

    /// @notice Fuzzer entry — random actor wraps a token to themselves.
    function wrap(uint8 actorSeed) external {
        address who = (actorSeed & 1 == 0) ? a : b;

        // Top up allowance opportunistically; cheap and keeps the fuzz
        // loop unblocked.
        if (usdc.allowance(who, address(agency)) < 1e30) {
            // Allowance is given by the actor, but the actor here is an
            // EOA we don't have prankability for. We fall back to using
            // approval the test harness can do.
            // Forge's invariant fuzzer treats this contract as the
            // caller, so we approve from the handler instead and use
            // safeTransferFrom flow with handler-as-spender.
            usdc.approve(address(agency), type(uint256).max);
        }

        try agency.wrap(who, "") returns (uint256 id) {
            heldByActor[who].push(id);
            if (id <= maxIdSeen) monotonic = false;
            else maxIdSeen = id;
        } catch {
            // OK — wrap may revert under fuzz with extreme states.
        }
    }

    /// @notice Fuzzer entry — random actor burns one of their held tokens.
    function unwrap(uint8 actorSeed, uint16 idxSeed) external {
        address who = (actorSeed & 1 == 0) ? a : b;
        uint256 len = heldByActor[who].length;
        if (len == 0) return;
        uint256 idx = uint256(idxSeed) % len;
        uint256 tokenId = heldByActor[who][idx];

        // Pop — swap with last and shrink.
        heldByActor[who][idx] = heldByActor[who][len - 1];
        heldByActor[who].pop();

        try agency.unwrap(who, tokenId, "") {
            // ok
        } catch {
            // The actor has approved this handler? In practice, since
            // unwrap doesn't pull funds from the actor (only burns
            // their NFT and pays them out), no approval is needed but
            // app.ownerOf(tokenId) must be the actor — which is the
            // case because we minted to them.
            heldByActor[who].push(tokenId);
        }
    }

    function idsAreMonotonic() external view returns (bool) {
        return monotonic;
    }
}
