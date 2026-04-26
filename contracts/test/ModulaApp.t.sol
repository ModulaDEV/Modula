// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {BaseTest}      from "./Base.t.sol";
import {ModulaApp}     from "../src/ModulaApp.sol";
import {ModulaAgency}  from "../src/ModulaAgency.sol";
import {Errors}        from "../src/libraries/Errors.sol";

contract ModulaAppTest is BaseTest {
    ModulaApp     internal app;
    ModulaAgency  internal agency;

    function setUp() public override {
        super.setUp();
        (agency, app) = _deployModel("app-test");
    }

    function test_AgencyBound() public view {
        assertEq(app.getAgency(), payable(address(agency)));
    }

    function test_NameAndSymbolReflectSlug() public view {
        assertEq(app.name(),   "app-test");
        assertEq(app.symbol(), "app-test");
    }

    function test_OnlyAgencyMayMint() public {
        vm.prank(alice);
        vm.expectRevert(Errors.NotAgency.selector);
        app.mint(alice, "");
    }

    function test_OnlyAgencyMayBurn() public {
        // Mint a token via the agency first.
        uint256 id = _wrap(alice, address(agency), alice);
        vm.prank(alice);
        vm.expectRevert(Errors.NotAgency.selector);
        app.burn(id, "");
    }

    function test_SetAgencyAlwaysReverts() public {
        vm.expectRevert(Errors.AgencyAlreadyBound.selector);
        app.setAgency(payable(alice));
    }

    function test_InitializeRevertsAfterFirstCall() public {
        // ModulaFactory called initialize once; a second call by anyone reverts.
        vm.expectRevert(); // OZ Initializable's InvalidInitialization
        app.initialize(payable(alice), "rebrand");
    }

    function test_MintIncreasesOutstanding() public {
        assertEq(app.getMaxSupply(), 0);
        _wrap(alice, address(agency), alice);
        assertEq(app.getMaxSupply(), 1);
        _wrap(bob, address(agency), bob);
        assertEq(app.getMaxSupply(), 2);
    }

    function test_TokenIdsStartAtOneAndDoNotReuse() public {
        uint256 id1 = _wrap(alice, address(agency), alice);
        uint256 id2 = _wrap(bob,   address(agency), bob);
        assertEq(id1, 1);
        assertEq(id2, 2);

        // Burn alice's token; bob's next mint must use id 3, not 1.
        vm.prank(alice);
        agency.unwrap(alice, id1, "");
        uint256 id3 = _wrap(alice, address(agency), alice);
        assertEq(id3, 3);
    }

    function test_TokenURIDeterministic() public {
        uint256 id = _wrap(alice, address(agency), alice);
        assertEq(app.tokenURI(id), "modula://app-test/1");
    }

    function test_TokenURIRevertsOnUnknown() public {
        vm.expectRevert(abi.encodeWithSelector(Errors.TokenDoesNotExist.selector, uint256(42)));
        app.tokenURI(42);
    }

    function test_GetNameRevertsOnUnknown() public {
        vm.expectRevert(abi.encodeWithSelector(Errors.TokenDoesNotExist.selector, uint256(99)));
        app.getName(99);
    }

    function test_GetNameFormat() public {
        uint256 id = _wrap(alice, address(agency), alice);
        assertEq(app.getName(id), "app-test #1");
    }
}
