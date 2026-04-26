// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest}        from "./Base.t.sol";
import {ModulaFactory}   from "../src/ModulaFactory.sol";
import {ModulaApp}       from "../src/ModulaApp.sol";
import {ModulaAgency}    from "../src/ModulaAgency.sol";
import {ModulaRegistry}  from "../src/ModulaRegistry.sol";
import {Asset}           from "../src/interfaces/IERC7527.sol";
import {Errors}          from "../src/libraries/Errors.sol";

contract ModulaFactoryTest is BaseTest {
    function test_DeploysClonesAndRegisters() public {
        (ModulaAgency agency, ModulaApp app) = _deployModel("clone-test");
        bytes32 id = keccak256(bytes("clone-test"));

        // Pair is bound mutually.
        assertEq(app.getAgency(),     payable(address(agency)));
        assertEq(address(agency.app()), address(app));

        // Registry record matches.
        ModulaRegistry.Record memory r = registry.records(id);
        assertEq(r.agency, address(agency));
        assertEq(r.app,    address(app));
    }

    function test_ImplsAreNotClonable() public {
        // The implementation contracts have _disableInitializers in
        // their constructors, so calling initialize directly on them
        // must revert (OZ Initializable's InvalidInitialization).
        Asset memory dummy = Asset({
            currency:        address(usdc),
            basePremium:     1,
            feeRecipient:    address(treasury),
            mintFeePercent:  300,
            burnFeePercent:  300
        });
        vm.expectRevert();
        agencyImpl.initialize(appImpl, dummy, "");
    }

    function test_PreFlightInvalidSlugReverts() public {
        vm.expectRevert(Errors.SlugTooLong.selector);
        _deployModel("ab"); // length 2 < MIN_LEN
    }

    function test_PreFlightDuplicateSlugReverts() public {
        _deployModel("preflight-dup");
        vm.expectRevert(Errors.AlreadyRegistered.selector);
        _deployModel("preflight-dup");
    }

    function test_FactoryConstructorRejectsZero() public {
        vm.expectRevert(Errors.InvalidImplementation.selector);
        new ModulaFactory(address(0), address(appImpl), registry);

        vm.expectRevert(Errors.InvalidImplementation.selector);
        new ModulaFactory(address(agencyImpl), address(0), registry);

        vm.expectRevert(Errors.InvalidRegistry.selector);
        new ModulaFactory(address(agencyImpl), address(appImpl), ModulaRegistry(address(0)));
    }

    function test_DifferentSlugsProduceDifferentClones() public {
        (ModulaAgency a1, ModulaApp p1) = _deployModel("alpha-one");
        (ModulaAgency a2, ModulaApp p2) = _deployModel("alpha-two");
        assertTrue(address(a1) != address(a2));
        assertTrue(address(p1) != address(p2));
    }

    function test_ClonesShareImplementationBytecode() public {
        // EIP-1167 minimal proxy is 45 bytes long. Two clones from the
        // same impl must have identical runtime bytecode.
        (ModulaAgency a1, ModulaApp p1) = _deployModel("eip1167-test-1");
        (ModulaAgency a2, ModulaApp p2) = _deployModel("eip1167-test-2");
        assertEq(address(a1).code, address(a2).code);
        assertEq(address(p1).code, address(p2).code);
    }

    function test_EmitsModelDeployedEvent() public {
        // We can't predict the clone address ahead of time without hooking
        // into Clones, so we use a non-strict expectEmit on the third topic
        // (the id, which is deterministic from the slug).
        vm.recordLogs();
        _deployModel("event-test");
        // The event has signature ModelDeployed(address,address,bytes32,address)
        // and id at indexed[3]. We just verify at least one log fired with
        // the expected id topic.
        bytes32 expectedId = keccak256(bytes("event-test"));
        bytes32[] memory logs = _topicsForEvent("ModelDeployed(address,address,bytes32,address)");
        bool found;
        for (uint256 i; i < logs.length; ++i) {
            if (logs[i] == expectedId) { found = true; break; }
        }
        assertTrue(found, "ModelDeployed for slug not emitted");
    }

    /// @dev Pull all topic-3 values from logs whose topic-0 matches `sig`.
    function _topicsForEvent(string memory sig) internal returns (bytes32[] memory) {
        bytes32 selector = keccak256(bytes(sig));
        Vm.Log[] memory entries = vm.getRecordedLogs();
        bytes32[] memory out = new bytes32[](entries.length);
        uint256 n;
        for (uint256 i; i < entries.length; ++i) {
            if (entries[i].topics.length >= 4 && entries[i].topics[0] == selector) {
                out[n++] = entries[i].topics[3];
            }
        }
        bytes32[] memory trimmed = new bytes32[](n);
        for (uint256 i; i < n; ++i) trimmed[i] = out[i];
        return trimmed;
    }
}

// Forge type alias.
import {Vm} from "forge-std/Vm.sol";
