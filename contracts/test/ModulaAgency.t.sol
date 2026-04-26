// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest}      from "./Base.t.sol";
import {ModulaAgency}  from "../src/ModulaAgency.sol";
import {ModulaApp}     from "../src/ModulaApp.sol";
import {Asset}         from "../src/interfaces/IERC7527.sol";
import {Errors}        from "../src/libraries/Errors.sol";
import {BondingCurve}  from "../src/libraries/BondingCurve.sol";
import {IERC20}        from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ModulaAgencyTest is BaseTest {
    ModulaAgency internal agency;
    ModulaApp    internal app;

    function setUp() public override {
        super.setUp();
        (agency, app) = _deployModel("agency-test");
    }

    // -------- Oracle --------

    function test_WrapOracleAtZeroSupply() public view {
        (uint256 premium, uint256 fee) = agency.getWrapOracle("");
        assertEq(premium, 1_000); // basePremium
        assertEq(fee, (1_000 * 300) / 10_000); // 3% of 1000 = 30
    }

    function test_WrapOracleScalesWithSupply() public {
        _wrap(alice, address(agency), alice); // supply 1
        (uint256 p1,) = agency.getWrapOracle("");
        // priceMint(1, 1000) = 1000 + 10 = 1010
        assertEq(p1, 1_010);
        _wrap(bob, address(agency), bob); // supply 2
        (uint256 p2,) = agency.getWrapOracle("");
        // priceMint(2, 1000) = 1020
        assertEq(p2, 1_020);
    }

    function test_UnwrapOracleRevertsOnEmptyCurve() public {
        vm.expectRevert(Errors.CurveEmpty.selector);
        agency.getUnwrapOracle("");
    }

    // -------- Wrap --------

    function test_WrapTransfersFundsAndMints() public {
        uint256 startBalance = usdc.balanceOf(alice);
        uint256 startTreasury = usdc.balanceOf(address(treasury));

        uint256 id = _wrap(alice, address(agency), alice);

        assertEq(id, 1);
        assertEq(app.ownerOf(id), alice);

        // 1000 premium + 30 fee = 1030 paid by alice.
        assertEq(usdc.balanceOf(alice), startBalance - 1_030);
        // 30 fee landed in treasury.
        assertEq(usdc.balanceOf(address(treasury)), startTreasury + 30);
        // 1000 premium retained in agency reserve.
        assertEq(usdc.balanceOf(address(agency)), 1_000);
    }

    function test_WrapRevertsWithoutApproval() public {
        vm.prank(alice);
        vm.expectRevert(); // ERC20 insufficient allowance
        agency.wrap(alice, "");
    }

    function test_WrapEmitsEvent() public {
        _approveAgency(alice, address(agency));
        vm.expectEmit(true, true, false, true, address(agency));
        emit ModulaAgency.Wrap(alice, 1, 1_000, 30);
        vm.prank(alice);
        agency.wrap(alice, "");
    }

    // -------- Slippage --------

    function test_SlippageGuardRevertsBelowQuote() public {
        _approveAgency(alice, address(agency));
        // Quote at supply 0 is premium=1000, fee=30 -> total 1030. Try max=1000.
        bytes memory data = abi.encode(uint256(1_000));
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Errors.SlippageExceeded.selector, uint256(1_030), uint256(1_000)));
        agency.wrap(alice, data);
    }

    function test_SlippageGuardPassesAboveQuote() public {
        _approveAgency(alice, address(agency));
        bytes memory data = abi.encode(uint256(2_000)); // generous max
        vm.prank(alice);
        agency.wrap(alice, data);
        assertEq(app.getMaxSupply(), 1);
    }

    function test_SlippageGuardZeroMaxIsDisabled() public {
        _approveAgency(alice, address(agency));
        bytes memory data = abi.encode(uint256(0)); // 0 == disabled
        vm.prank(alice);
        agency.wrap(alice, data);
        assertEq(app.getMaxSupply(), 1);
    }

    // -------- Unwrap --------

    function test_UnwrapBurnsAndPays() public {
        uint256 id = _wrap(alice, address(agency), alice);
        uint256 startBalance = usdc.balanceOf(alice);
        uint256 startTreasury = usdc.balanceOf(address(treasury));

        vm.prank(alice);
        agency.unwrap(alice, id, "");

        // Token burned.
        vm.expectRevert(); // ERC721NonexistentToken
        app.ownerOf(id);

        // priceBurn(1) == priceMint(0) == 1000. Fee 3% of 1000 = 30.
        // alice receives 970, treasury receives +30 fee.
        assertEq(usdc.balanceOf(alice), startBalance + 970);
        assertEq(usdc.balanceOf(address(treasury)), startTreasury + 30);
        assertEq(app.getMaxSupply(), 0);
    }

    function test_UnwrapRevertsForNonOwner() public {
        uint256 id = _wrap(alice, address(agency), alice);
        vm.prank(bob);
        vm.expectRevert(Errors.NotApp.selector);
        agency.unwrap(bob, id, "");
    }

    // -------- ETH guard --------

    function test_RejectsETH() public {
        (bool ok,) = address(agency).call{value: 1 ether}("");
        assertFalse(ok);
    }

    // -------- Initialize guards --------

    function test_InitializeRejectsZeroCurrency() public {
        ModulaAgency fresh = new ModulaAgency();
        Asset memory bad = Asset({
            currency:        address(0),
            basePremium:     1,
            feeRecipient:    address(0xBEEF),
            mintFeePercent:  100,
            burnFeePercent:  100
        });
        vm.expectRevert(Errors.AssetCurrencyZero.selector);
        fresh.initialize(app, bad, "");
    }

    function test_InitializeRejectsHighFee() public {
        ModulaAgency fresh = new ModulaAgency();
        Asset memory bad = Asset({
            currency:        address(usdc),
            basePremium:     1,
            feeRecipient:    address(treasury),
            mintFeePercent:  1_001, // > MAX_FEE_BPS
            burnFeePercent:  300
        });
        vm.expectRevert(abi.encodeWithSelector(Errors.FeeAboveCap.selector, uint16(1_001), uint16(1_000)));
        fresh.initialize(app, bad, "");
    }

    function test_InitializeRejectsZeroBase() public {
        ModulaAgency fresh = new ModulaAgency();
        Asset memory bad = Asset({
            currency:        address(usdc),
            basePremium:     0,
            feeRecipient:    address(treasury),
            mintFeePercent:  100,
            burnFeePercent:  100
        });
        vm.expectRevert(Errors.InvalidAsset.selector);
        fresh.initialize(app, bad, "");
    }
}
