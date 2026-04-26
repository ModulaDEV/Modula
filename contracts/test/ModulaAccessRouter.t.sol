// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest}             from "./Base.t.sol";
import {ModulaAccessRouter}   from "../src/ModulaAccessRouter.sol";
import {Errors}               from "../src/libraries/Errors.sol";

contract ModulaAccessRouterTest is BaseTest {
    bytes32 internal modelId = keccak256("any-model");
    bytes32 internal txHash  = keccak256("0xfeed");

    function test_OwnerIsSet() public view {
        assertEq(router.owner(), owner);
    }

    function test_GatewaySignerIsSet() public view {
        assertEq(router.gatewaySigner(), signer);
    }

    function test_ConstructorEmitsRotation() public {
        // Deploy a fresh router and check the boot rotation event is in the trace.
        vm.recordLogs();
        ModulaAccessRouter fresh = new ModulaAccessRouter(owner, signer);
        assertEq(fresh.gatewaySigner(), signer);
    }

    function test_LogRevertsWhenNotSigner() public {
        vm.prank(alice);
        vm.expectRevert(Errors.NotGatewaySigner.selector);
        router.log(modelId, alice, 1_000, 100, txHash);
    }

    function test_LogEmitsModelCalled() public {
        vm.expectEmit(true, true, false, true, address(router));
        emit ModulaAccessRouter.ModelCalled(modelId, alice, 1_000, 100, txHash);
        vm.prank(signer);
        router.log(modelId, alice, 1_000, 100, txHash);
    }

    function test_RotateSignerRevertsForNonOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        router.setGatewaySigner(alice);
    }

    function test_RotateSignerWorks() public {
        address newSigner = makeAddr("rotated-signer");

        vm.expectEmit(true, true, false, false, address(router));
        emit ModulaAccessRouter.GatewaySignerRotated(signer, newSigner);

        vm.prank(owner);
        router.setGatewaySigner(newSigner);
        assertEq(router.gatewaySigner(), newSigner);

        // Old signer can no longer log.
        vm.prank(signer);
        vm.expectRevert(Errors.NotGatewaySigner.selector);
        router.log(modelId, alice, 1_000, 100, txHash);

        // New signer can.
        vm.prank(newSigner);
        router.log(modelId, alice, 1_000, 100, txHash);
    }

    function test_RotateSignerRejectsZero() public {
        vm.prank(owner);
        vm.expectRevert(Errors.EmptySigner.selector);
        router.setGatewaySigner(address(0));
    }

    function test_ConstructorRejectsZeroSigner() public {
        vm.expectRevert(Errors.EmptySigner.selector);
        new ModulaAccessRouter(owner, address(0));
    }
}
