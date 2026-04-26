// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC7527Agency, Asset} from "./IERC7527.sol";
import {IModulaApp} from "./IModulaApp.sol";

/**
 * @title IModulaAgency
 * @notice Modula-specific extensions to IERC7527Agency.
 * @dev    Adds the clone initialize entry point and a `MAX_FEE_BPS`
 *         hard cap that constrains `Asset.mintFeePercent` and
 *         `Asset.burnFeePercent` at initialize time.
 */
interface IModulaAgency is IERC7527Agency {
    /// @notice Hard cap on either mint or burn fee, in basis points.
    ///         Modula refuses to let a creator misconfigure a model
    ///         with a fee above this. Currently 1_000 (10%).
    function MAX_FEE_BPS() external view returns (uint16);

    /// @notice Initialize a freshly-cloned Agency. Reverts after first call.
    /// @param  app           Paired App (also a fresh clone).
    /// @param  asset         Reserve currency + fee schedule. Validated.
    /// @param  attributeData Optional implementation-defined extras (unused
    ///                       in v1, reserved for forward compatibility).
    function initialize(IModulaApp app, Asset calldata asset, bytes calldata attributeData)
        external;
}
