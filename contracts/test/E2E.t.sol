// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest}        from "./Base.t.sol";
import {ModulaApp}       from "../src/ModulaApp.sol";
import {ModulaAgency}    from "../src/ModulaAgency.sol";
import {ModulaRegistry}  from "../src/ModulaRegistry.sol";

/**
 * @notice End-to-end happy-path scenarios — multi-actor, multi-model,
 *         multi-step. Anything more complex than a single contract's
 *         API surface lands here.
 */
contract E2ETest is BaseTest {
    function test_ThreeWrappersThenOneUnwraps_PriceMovesAsExpected() public {
        (ModulaAgency ag, ModulaApp ap) = _deployModel("e2e-curve");

        // Three wraps in a row.
        uint256 id1 = _wrap(alice,   address(ag), alice);
        uint256 id2 = _wrap(bob,     address(ag), bob);
        uint256 id3 = _wrap(creator, address(ag), creator);
        assertEq(id1, 1);
        assertEq(id2, 2);
        assertEq(id3, 3);

        assertEq(ap.getMaxSupply(), 3);
        (uint256 next,) = ag.getWrapOracle("");
        // priceMint(3) = base + 3 * base / 100 = 1030
        assertEq(next, 1_030);

        // Bob unwraps. Curve resets toward priceMint(2) = 1020.
        vm.prank(bob);
        ag.unwrap(bob, id2, "");

        assertEq(ap.getMaxSupply(), 2);
        (uint256 next2,) = ag.getWrapOracle("");
        assertEq(next2, 1_020);
    }

    function test_MultipleModelsCoexist() public {
        (ModulaAgency ag1, ModulaApp ap1) = _deployModel("model-one");
        (ModulaAgency ag2, ModulaApp ap2) = _deployModel("model-two");

        // Wraps on each are independent.
        _wrap(alice, address(ag1), alice);
        _wrap(alice, address(ag2), alice);
        _wrap(bob,   address(ag2), bob);

        assertEq(ap1.getMaxSupply(), 1);
        assertEq(ap2.getMaxSupply(), 2);

        // Different agencies have different reverse lookups.
        bytes32 id1 = keccak256(bytes("model-one"));
        bytes32 id2 = keccak256(bytes("model-two"));
        assertEq(registry.byAgency(address(ag1)), id1);
        assertEq(registry.byAgency(address(ag2)), id2);
        assertTrue(id1 != id2);
    }

    function test_ApprovalIsScopedToAgency() public {
        // alice approves agency1 only. wrap on agency2 must fail with
        // insufficient allowance — proves we don't accidentally share
        // approvals across models.
        (ModulaAgency ag1,) = _deployModel("approval-scope-one");
        (ModulaAgency ag2,) = _deployModel("approval-scope-two");

        _approveAgency(alice, address(ag1));

        vm.prank(alice);
        ag1.wrap(alice, "");

        vm.prank(alice);
        vm.expectRevert(); // ERC20InsufficientAllowance
        ag2.wrap(alice, "");
    }

    function test_TreasuryAccumulatesFeesFromMultipleModels() public {
        (ModulaAgency ag1,) = _deployModel("treasury-acc-one");
        (ModulaAgency ag2,) = _deployModel("treasury-acc-two");

        uint256 before_ = usdc.balanceOf(address(treasury));
        _wrap(alice, address(ag1), alice);
        _wrap(bob,   address(ag2), bob);

        // Two wraps at supply 0 each: 30 + 30 = 60.
        assertEq(usdc.balanceOf(address(treasury)), before_ + 60);
    }
}
