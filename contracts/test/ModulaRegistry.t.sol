// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest}        from "./Base.t.sol";
import {ModulaAgency}    from "../src/ModulaAgency.sol";
import {ModulaApp}       from "../src/ModulaApp.sol";
import {ModulaRegistry}  from "../src/ModulaRegistry.sol";
import {IModulaRegistry} from "../src/interfaces/IModulaRegistry.sol";
import {Errors}          from "../src/libraries/Errors.sol";

contract ModulaRegistryTest is BaseTest {
    function test_FactoryIsImmutable() public view {
        assertEq(registry.factory(), address(factory));
    }

    function test_RegistersOnFactoryCall() public {
        _deployModel("solidity-audit-v3");
        bytes32 id = keccak256(bytes("solidity-audit-v3"));
        IModulaRegistry.Record memory r = registry.records(id);
        assertEq(r.slug,      "solidity-audit-v3");
        assertEq(r.creator,   creator);
        assertEq(r.treasury,  address(treasury));
        assertEq(r.baseModel, "Llama-3-8B");
        assertEq(r.modelType, "LoRA");
        assertGt(r.registeredAt, 0);
    }

    function test_RejectsDirectRegister() public {
        IModulaRegistry.Record memory r = IModulaRegistry.Record({
            agency:       address(0xAAA),
            app:          address(0xBBB),
            treasury:     address(0xCCC),
            creator:      alice,
            slug:         "valid-slug",
            baseModel:    "x",
            modelType:    "x",
            manifestURI:  "x",
            registeredAt: 0
        });
        vm.prank(alice);
        vm.expectRevert(Errors.NotFactory.selector);
        registry.register(r);
    }

    function test_RejectsDuplicateSlug() public {
        _deployModel("dup-slug");
        vm.expectRevert(Errors.AlreadyRegistered.selector);
        _deployModel("dup-slug");
    }

    function test_RejectsInvalidSlug() public {
        // Bubbles up SlugTooLong from SlugLib via Factory pre-flight.
        vm.expectRevert(Errors.SlugTooLong.selector);
        _deployModel("ab"); // too short
    }

    function test_ByAgencyReverseLookup() public {
        (ModulaAgency ag, ) = _deployModel("reverse-lookup-test");
        bytes32 id = keccak256(bytes("reverse-lookup-test"));
        assertEq(registry.byAgency(address(ag)), id);
    }

    function test_IsRegisteredHelper() public {
        assertFalse(registry.isRegistered("not-yet"));
        _deployModel("not-yet");
        assertTrue(registry.isRegistered("not-yet"));
    }

    function test_RegistryRecordImmutable() public {
        _deployModel("immutable-test");
        bytes32 id = keccak256(bytes("immutable-test"));
        IModulaRegistry.Record memory r1 = registry.records(id);

        // Trying to register again must revert (no admin path to mutate).
        vm.expectRevert(Errors.AlreadyRegistered.selector);
        _deployModel("immutable-test");

        // Record unchanged.
        IModulaRegistry.Record memory r2 = registry.records(id);
        assertEq(r1.creator,      r2.creator);
        assertEq(r1.agency,       r2.agency);
        assertEq(r1.registeredAt, r2.registeredAt);
    }
}
