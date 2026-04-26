// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test}    from "forge-std/Test.sol";
import {SlugLib} from "../src/libraries/SlugLib.sol";
import {Errors}  from "../src/libraries/Errors.sol";

/// @notice Wrap the library so we can call it externally and use vm.expectRevert.
contract SlugHarness {
    function validate(string memory slug) external pure returns (bytes32) {
        return SlugLib.validate(slug);
    }
}

contract SlugLibTest is Test {
    SlugHarness internal h;

    function setUp() public {
        h = new SlugHarness();
    }

    function test_AcceptsCanonicalSlug() public view {
        bytes32 id = h.validate("solidity-audit-v3");
        assertEq(id, keccak256(bytes("solidity-audit-v3")));
    }

    function test_AcceptsDot() public view {
        h.validate("v1.alpha.7");
    }

    function test_AcceptsDigits() public view {
        h.validate("model-2026");
    }

    function test_RejectsEmpty() public {
        vm.expectRevert(Errors.EmptySlug.selector);
        h.validate("");
    }

    function test_RejectsTooShort() public {
        vm.expectRevert(Errors.SlugTooLong.selector);
        h.validate("ab");
    }

    function test_RejectsTooLong() public {
        // 64 chars
        vm.expectRevert(Errors.SlugTooLong.selector);
        h.validate("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    }

    function test_RejectsUppercase() public {
        vm.expectRevert(Errors.SlugTooLong.selector);
        h.validate("Solidity-Audit");
    }

    function test_RejectsSpaces() public {
        vm.expectRevert(Errors.SlugTooLong.selector);
        h.validate("solidity audit");
    }

    function test_RejectsLeadingDash() public {
        vm.expectRevert(Errors.SlugTooLong.selector);
        h.validate("-foo");
    }

    function test_RejectsTrailingDot() public {
        vm.expectRevert(Errors.SlugTooLong.selector);
        h.validate("foo.");
    }

    function test_RejectsConsecutiveSeparators() public {
        vm.expectRevert(Errors.SlugTooLong.selector);
        h.validate("foo--bar");
        vm.expectRevert(Errors.SlugTooLong.selector);
        h.validate("foo..bar");
    }

    function test_AcceptsExactBoundaryLengths() public view {
        h.validate("aaa"); // 3 chars
        h.validate("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"); // 63
    }

    function testFuzz_AlwaysReturnsKeccak(string memory slug) public view {
        // We don't care if it reverts on bad input — just that *when* it
        // accepts, the returned id equals keccak256.
        try h.validate(slug) returns (bytes32 id) {
            assertEq(id, keccak256(bytes(slug)));
        } catch {}
    }
}
