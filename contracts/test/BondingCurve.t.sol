// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test}         from "forge-std/Test.sol";
import {BondingCurve} from "../src/libraries/BondingCurve.sol";
import {Errors}       from "../src/libraries/Errors.sol";

contract CurveHarness {
    function priceMint(uint256 supply, uint256 base) external pure returns (uint256) {
        return BondingCurve.priceMint(supply, base);
    }

    function priceBurn(uint256 supply, uint256 base) external pure returns (uint256) {
        return BondingCurve.priceBurn(supply, base);
    }

    function applyFee(uint256 premium, uint16 bps) external pure returns (uint256) {
        return BondingCurve.applyFee(premium, bps);
    }
}

contract BondingCurveTest is Test {
    CurveHarness internal h;
    uint256 internal constant BASE = 1_000e6; // 1000 USDC

    function setUp() public {
        h = new CurveHarness();
    }

    // -------- priceMint / priceBurn --------

    function test_PriceMintAtZero() public view {
        // priceMint(0) = base
        assertEq(h.priceMint(0, BASE), BASE);
    }

    function test_PriceMintLinearInSupply() public view {
        // priceMint(100) = base + (100 * base) / 100 = 2 * base
        assertEq(h.priceMint(100, BASE), 2 * BASE);
    }

    function test_PriceMintTen() public view {
        // priceMint(10) = base * 1.1
        uint256 expected = BASE + BASE / 10;
        assertEq(h.priceMint(10, BASE), expected);
    }

    function test_PriceBurnRoundtrip() public view {
        // priceBurn(n+1) == priceMint(n)
        for (uint256 n = 0; n < 50; ++n) {
            assertEq(h.priceBurn(n + 1, BASE), h.priceMint(n, BASE));
        }
    }

    function test_PriceBurnRevertsOnEmpty() public {
        vm.expectRevert(Errors.CurveEmpty.selector);
        h.priceBurn(0, BASE);
    }

    function test_PriceMintZeroBaseIsZero() public view {
        assertEq(h.priceMint(100, 0), 0);
    }

    function test_PriceMintOverflowReverts() public {
        // supply * basePremium overflows when both are near 2^128.
        uint256 huge = 2 ** 200;
        vm.expectRevert(Errors.PremiumOverflow.selector);
        h.priceMint(huge, huge);
    }

    // -------- applyFee --------

    function test_ApplyFeeRoundsDown() public view {
        // 999 * 300 / 10_000 = 29 (would be 29.97 floored)
        assertEq(h.applyFee(999, 300), 29);
    }

    function test_ApplyFeeZero() public view {
        assertEq(h.applyFee(1_000, 0), 0);
    }

    function test_ApplyFeeMax() public view {
        assertEq(h.applyFee(1_000, 10_000), 1_000);
    }

    // -------- fuzz --------

    function testFuzz_PriceMonotonic(uint256 base, uint16 from, uint16 step) public view {
        base = bound(base, 1, 1e18);
        step = uint16(bound(step, 1, type(uint16).max));
        uint256 a = h.priceMint(from, base);
        uint256 b = h.priceMint(uint256(from) + uint256(step), base);
        assertGe(b, a);
    }

    function testFuzz_BurnMintRoundtrip(uint256 base, uint64 supply) public view {
        base   = bound(base, 1, 1e30);
        supply = uint64(bound(supply, 1, type(uint64).max));
        // priceBurn at supply S equals priceMint at S-1.
        assertEq(h.priceBurn(supply, base), h.priceMint(uint256(supply) - 1, base));
    }
}
