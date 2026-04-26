// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC7527App} from "./IERC7527.sol";

/**
 * @title IModulaApp
 * @notice Modula-specific extensions to IERC7527App.
 * @dev    The base IERC7527App covers mint/burn/agency binding. Modula's
 *         `ModulaApp` additionally exposes an `initialize(...)` entry
 *         point because it is deployed as an EIP-1167 clone by
 *         ModulaFactory and can never have its values set via constructor.
 */
interface IModulaApp is IERC7527App {
    /// @notice Initialize a freshly-cloned App. Reverts after the first call.
    /// @param  agency Address of the paired Agency (also a fresh clone).
    /// @param  slug   Canonical model id; embedded in name() / symbol() and
    ///                used by the registry.
    function initialize(address payable agency, string calldata slug) external;

    /// @notice Returns the slug embedded at initialization.
    function slug() external view returns (string memory);
}
