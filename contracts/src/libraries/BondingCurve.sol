// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Errors} from "./Errors.sol";

/**
 * @title  BondingCurve
 * @notice Pure math for the Modula bonding curve.
 * @dev    Modula's reference curve is linear in current supply,
 *         parameterized only by `basePremium`:
 *
 *               premium(n) = basePremium + (n * basePremium) / 100
 *
 *         where n is the App's outstanding supply *before* the wrap is
 *         applied (or *after*, less one, on unwrap). The slope of 1/100
 *         per unit means token #100 costs ~2× token #0; #1,000 costs ~11×.
 *
 *         Linearity matters for two reasons:
 *
 *         1. The integral is closed-form, so a creator (or front-end)
 *            can compute the exact cost of minting K consecutive tokens
 *            without iterating each step on-chain.
 *         2. The marginal cost grows slowly enough that early
 *            participation isn't punished but late participation
 *            still meaningfully signals demand.
 *
 *         The library is intentionally self-contained: no storage, no
 *         external calls, no precision tricks. Auditors should be able
 *         to verify both functions in under a minute.
 *
 * @custom:invariant priceMint(n)   == basePremium + (n   * basePremium) / 100
 * @custom:invariant priceBurn(n+1) == basePremium + (n   * basePremium) / 100
 *                                  == priceMint(n)
 *      (i.e. burn from supply n+1 returns the same price minting brought
 *       supply n -> n+1, modulo the burn fee deducted by the caller)
 */
library BondingCurve {
    /// @dev Slope denominator. Public so test fixtures can reference it.
    uint256 internal constant SLOPE_DENOMINATOR = 100;

    /// @notice Premium owed to *mint* the next token when current supply is `supply`.
    /// @param  supply       Outstanding supply before the mint.
    /// @param  basePremium  Initial price (price at supply 0).
    /// @return premium      Premium in `currency` base units.
    function priceMint(uint256 supply, uint256 basePremium)
        internal
        pure
        returns (uint256 premium)
    {
        // basePremium * (1 + supply / 100) — written as below so the
        // division does not truncate the constant term.
        unchecked {
            // Overflow check: supply * basePremium + basePremium <= max uint256
            // The bonding curve will never realistically reach this, but we
            // guard explicitly because Modula treats overflow as a protocol
            // bug, not a UX edge case.
            uint256 marginal = supply * basePremium;
            if (basePremium != 0 && marginal / basePremium != supply) {
                revert Errors.PremiumOverflow();
            }
            uint256 stepped = marginal / SLOPE_DENOMINATOR;
            uint256 sum = basePremium + stepped;
            if (sum < basePremium) revert Errors.PremiumOverflow();
            premium = sum;
        }
    }

    /// @notice Premium paid out to *burn* one token when current supply is `supply`.
    /// @dev    The burn quote is the price the *previous* mint absorbed, i.e.
    ///         priceMint(supply - 1). Reverts on supply == 0.
    function priceBurn(uint256 supply, uint256 basePremium)
        internal
        pure
        returns (uint256 premium)
    {
        if (supply == 0) revert Errors.CurveEmpty();
        unchecked {
            premium = priceMint(supply - 1, basePremium);
        }
    }

    /// @notice Convenience helper — multiply a premium by a basis-point fee.
    /// @param  premium The premium to apply the fee against.
    /// @param  bps     Fee in basis points (10_000 = 100%).
    /// @return fee     `premium * bps / 10_000`, rounded down.
    function applyFee(uint256 premium, uint16 bps) internal pure returns (uint256 fee) {
        unchecked {
            fee = (premium * uint256(bps)) / 10_000;
        }
    }
}
