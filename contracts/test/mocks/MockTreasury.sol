// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @notice Minimum-viable treasury stand-in. Real treasuries are Safes;
 *         this is a passive sink for unit tests so `feeRecipient` can
 *         be a non-zero, distinct address that just accumulates USDC.
 */
contract MockTreasury {
    receive() external payable {}
}
