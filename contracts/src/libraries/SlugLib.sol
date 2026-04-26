// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Errors} from "./Errors.sol";

/**
 * @title  SlugLib
 * @notice Validation + canonicalisation for Modula model slugs.
 * @dev    Slugs are the human-readable, globally-unique id of a model.
 *         Examples: "solidity-audit-v3", "browser-agent-adapter".
 *
 *         Validation rules (kept deliberately strict so URLs, MCP
 *         endpoint paths, and event topics never need escaping):
 *
 *         - 3 ≤ length ≤ 63 bytes
 *         - allowed: [a-z], [0-9], '-', '.'
 *         - cannot start or end with '-' or '.'
 *         - no consecutive '--' or '..'
 */
library SlugLib {
    uint256 internal constant MIN_LEN = 3;
    uint256 internal constant MAX_LEN = 63;

    /// @notice Verify `slug` matches the canonical format. Reverts on failure.
    /// @return id keccak256 of the bytes (the registry's primary key).
    function validate(string memory slug) internal pure returns (bytes32 id) {
        bytes memory b = bytes(slug);
        uint256 n = b.length;
        if (n == 0) revert Errors.EmptySlug();
        if (n < MIN_LEN || n > MAX_LEN) revert Errors.SlugTooLong();

        // First and last char must not be a separator.
        bytes1 first = b[0];
        bytes1 last = b[n - 1];
        if (_isSep(first) || _isSep(last)) revert Errors.SlugTooLong();

        for (uint256 i; i < n; ++i) {
            bytes1 c = b[i];
            if (!_isAllowed(c)) revert Errors.SlugTooLong();
            if (i > 0 && _isSep(c) && _isSep(b[i - 1])) {
                revert Errors.SlugTooLong();
            }
        }
        return keccak256(b);
    }

    function _isAllowed(bytes1 c) private pure returns (bool) {
        // a-z
        if (c >= 0x61 && c <= 0x7A) return true;
        // 0-9
        if (c >= 0x30 && c <= 0x39) return true;
        // '-' or '.'
        if (c == 0x2D || c == 0x2E) return true;
        return false;
    }

    function _isSep(bytes1 c) private pure returns (bool) {
        return c == 0x2D || c == 0x2E;
    }
}
