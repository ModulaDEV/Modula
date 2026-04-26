// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test}            from "forge-std/Test.sol";
import {Asset}           from "../src/interfaces/IERC7527.sol";
import {ModulaApp}       from "../src/ModulaApp.sol";
import {ModulaAgency}    from "../src/ModulaAgency.sol";
import {ModulaRegistry}  from "../src/ModulaRegistry.sol";
import {ModulaFactory}   from "../src/ModulaFactory.sol";
import {ModulaAccessRouter} from "../src/ModulaAccessRouter.sol";
import {MockUSDC}        from "./mocks/MockUSDC.sol";
import {MockTreasury}    from "./mocks/MockTreasury.sol";

/**
 * @notice Shared deployment + actor setup used by every test contract.
 *         Inherits forge-std Test for the cheatcode helpers.
 */
abstract contract BaseTest is Test {
    // -------- Actors --------
    address internal owner    = makeAddr("owner");      // protocol multisig
    address internal signer   = makeAddr("signer");     // gateway hot wallet
    address internal creator  = makeAddr("creator");    // model creator
    address internal alice    = makeAddr("alice");
    address internal bob      = makeAddr("bob");

    // -------- Singletons --------
    MockUSDC            internal usdc;
    MockTreasury        internal treasury;
    ModulaApp           internal appImpl;
    ModulaAgency        internal agencyImpl;
    ModulaRegistry      internal registry;
    ModulaFactory       internal factory;
    ModulaAccessRouter  internal router;

    function setUp() public virtual {
        usdc     = new MockUSDC();
        treasury = new MockTreasury();
        appImpl    = new ModulaApp();
        agencyImpl = new ModulaAgency();

        // Registry needs the factory address up-front (immutable). We
        // pre-compute the factory's CREATE address and feed it in,
        // then deploy the factory.
        address predictedFactory = vm.computeCreateAddress(address(this), vm.getNonce(address(this)) + 1);
        registry = new ModulaRegistry(predictedFactory);
        factory  = new ModulaFactory(address(agencyImpl), address(appImpl), registry);

        router = new ModulaAccessRouter(owner, signer);

        // Fund the test actors with 1M USDC each.
        usdc.mint(creator, 1_000_000e6);
        usdc.mint(alice,   1_000_000e6);
        usdc.mint(bob,     1_000_000e6);
    }

    /// @dev Deploy a model with sensible defaults. Returns the deployed
    ///      Agency + App pair so tests can interact with them.
    function _deployModel(string memory slug)
        internal
        returns (ModulaAgency agency, ModulaApp app)
    {
        Asset memory asset = Asset({
            currency:        address(usdc),
            basePremium:     1_000e0,        // 0.001 USDC at supply 0
            feeRecipient:    address(treasury),
            mintFeePercent:  300,            // 3%
            burnFeePercent:  300             // 3%
        });

        vm.prank(creator);
        (address ag, address ap) = factory.createModel(
            asset,
            slug,
            "Llama-3-8B",
            "LoRA",
            "ipfs://example-manifest"
        );
        return (ModulaAgency(payable(ag)), ModulaApp(ap));
    }

    /// @dev Convenience: have `who` approve the agency for unlimited USDC.
    function _approveAgency(address who, address agency) internal {
        vm.prank(who);
        usdc.approve(agency, type(uint256).max);
    }

    /// @dev Convenience: have `who` wrap one token of `agency`. Returns id.
    function _wrap(address who, address agency, address to)
        internal
        returns (uint256 tokenId)
    {
        _approveAgency(who, agency);
        vm.prank(who);
        tokenId = ModulaAgency(payable(agency)).wrap(to, "");
    }
}
