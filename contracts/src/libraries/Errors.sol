// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  Errors
 * @notice Custom-error library shared across the Modula contract suite.
 * @dev    Custom errors over `require(...)` strings: 4 bytes vs ~50+,
 *         plus the selector is recoverable from a transaction trace
 *         which `require` strings are not. Grouped by which contract
 *         they originate from, in declaration order so the deployed
 *         selector ABI is stable.
 */
library Errors {
    // -------- Registry --------
    error NotFactory();
    error AlreadyRegistered();
    error EmptySlug();
    error SlugTooLong();

    // -------- Factory --------
    error InvalidImplementation();
    error InvalidRegistry();
    error InvalidAsset();

    // -------- Agency --------
    error NotApp();                       // mint/burn callbacks must come from paired App
    error AppAlreadyBound();              // initialize called twice
    error AssetCurrencyZero();
    error AssetTreasuryZero();
    error FeeAboveCap(uint16 attempted, uint16 cap);
    error PremiumOverflow();
    error CurveEmpty();                   // unwrap when supply == 0
    error InsufficientPayment(uint256 supplied, uint256 required);
    error SlippageExceeded(uint256 quoted, uint256 maxAccepted);

    // -------- App --------
    error NotAgency();                    // mint/burn must come from paired Agency
    error AgencyAlreadyBound();
    error EmptyAgency();
    error TokenDoesNotExist(uint256 tokenId);

    // -------- AccessRouter --------
    error NotGatewaySigner();
    error EmptySigner();

    // -------- Generic guards --------
    error ZeroAddress();
    error AlreadyInitialized();
    error NotInitialized();
}
