// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {StdInvariant} from "forge-std/StdInvariant.sol";
import {BaseTest}     from "../Base.t.sol";
import {ModulaAgency} from "../../src/ModulaAgency.sol";
import {ModulaApp}    from "../../src/ModulaApp.sol";
import {AgencyHandler} from "./AgencyHandler.sol";
import {BondingCurve}  from "../../src/libraries/BondingCurve.sol";
import {IERC20}        from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @notice Top-level invariant test. Forge fuzzes random (wrap, unwrap)
 *         calls through the AgencyHandler and verifies after every
 *         step that the Agency can refund every outstanding token
 *         along the curve.
 *
 *         If this invariant fails, an attacker can drain the curve
 *         by wrapping high and unwrapping in an order that depletes
 *         the reserve faster than supply shrinks.
 */
contract AgencySolvencyInvariant is BaseTest, StdInvariant {
    ModulaAgency  internal ag;
    ModulaApp     internal ap;
    AgencyHandler internal handler;

    uint256 internal basePremium;

    function setUp() public override {
        super.setUp();
        (ag, ap) = _deployModel("solvency");
        handler  = new AgencyHandler(ag, ap, usdc, alice, bob);

        basePremium = 1_000;

        targetContract(address(handler));
    }

    /// @notice The agency's USDC balance must always be >= the sum of
    ///         priceMint(i) for i in 0..supply-1, i.e. enough to refund
    ///         every outstanding token along the curve.
    function invariant_ReserveCoversCurveRefunds() public view {
        uint256 supply = ap.getMaxSupply();
        if (supply == 0) return;

        uint256 needed;
        for (uint256 i; i < supply; ++i) {
            // priceBurn(i+1) == priceMint(i); use the cheaper formulation.
            unchecked {
                needed += BondingCurve.priceMint(i, basePremium);
            }
        }

        uint256 have = IERC20(address(usdc)).balanceOf(address(ag));
        assertGe(have, needed, "agency under-reserved");
    }

    /// @notice Token ids never repeat across mints, even under random
    ///         interleaved wraps and unwraps.
    function invariant_TokenIdsMonotonic() public view {
        assertTrue(handler.monotonic(), "token ids reused");
    }
}
