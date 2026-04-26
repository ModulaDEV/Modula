// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title  IERC7527 — Token Bound Function Oracle AMM (interfaces)
 * @notice The pair of interfaces defined by EIP-7527, plus the canonical
 *         Asset struct passed between an Agency and its App.
 * @dev    The spec defines two cooperating contracts:
 *
 *         - The Agency holds the reserve currency and runs the oracle.
 *           Wrapping deposits currency and mints the App's NFT; unwrapping
 *           burns the NFT and returns the curve-quoted refund.
 *         - The App is an ERC-721 whose mint and burn entry points are
 *           callable only by its bound Agency.
 *
 *         The original spec is at https://eips.ethereum.org/EIPS/eip-7527
 *         (Draft, September 2023).
 */

/// @notice Description of the reserve asset and fee schedule shared by an
///         Agency and its App. Immutable after construction in our
///         implementation.
struct Asset {
    /// @dev Reserve currency. address(0) for native ETH; else an ERC-20.
    ///      In Modula, this is always USDC on Base.
    address currency;
    /// @dev Initial premium (mint price at supply 0), in `currency` base units.
    uint256 basePremium;
    /// @dev Where mint/burn fees are routed. In Modula, this is the model's
    ///      creator-controlled treasury (a Safe).
    address feeRecipient;
    /// @dev Mint fee, basis points (1 bp = 0.01%). 100 == 1%, 10_000 == 100%.
    uint16 mintFeePercent;
    /// @dev Burn fee, basis points.
    uint16 burnFeePercent;
}

/**
 * @title IERC7527Agency
 * @notice Pricing engine + reserve vault. Exactly one Agency per App.
 */
interface IERC7527Agency {
    /// @notice Emitted on every successful wrap (mint).
    event Wrap(address indexed to, uint256 indexed tokenId, uint256 premium, uint256 fee);

    /// @notice Emitted on every successful unwrap (burn).
    event Unwrap(address indexed to, uint256 indexed tokenId, uint256 premium, uint256 fee);

    /// @notice Deposit currency, pull the premium plus fee from the caller,
    ///         route the fee to the configured recipient, and ask the App
    ///         to mint a new token to `to`.
    /// @return tokenId Unique id of the freshly minted App token.
    function wrap(address to, bytes calldata data) external payable returns (uint256 tokenId);

    /// @notice Burn `tokenId` on the App, route the burn fee, and pay
    ///         out the curve-quoted premium to `to`.
    function unwrap(address to, uint256 tokenId, bytes calldata data) external payable;

    /// @notice Quote the next mint along the curve. Pure on on-chain state.
    /// @return premium The currency amount the caller must supply.
    /// @return fee     The mint fee paid out of `premium` to the feeRecipient.
    function getWrapOracle(bytes memory data)
        external
        view
        returns (uint256 premium, uint256 fee);

    /// @notice Quote the next burn along the curve. Pure on on-chain state.
    /// @return premium The currency amount the caller will receive (less fee).
    /// @return fee     The burn fee deducted from `premium`.
    function getUnwrapOracle(bytes memory data)
        external
        view
        returns (uint256 premium, uint256 fee);

    /// @notice Return the bound App, the active Asset record, and any
    ///         additional implementation-defined attribute bytes.
    function getStrategy()
        external
        view
        returns (address app, Asset memory asset, bytes memory attributeData);
}

/**
 * @title IERC7527App
 * @notice ERC-721 wrapper whose mint and burn are gated to its Agency.
 *         We extend the canonical interface with the standard token-uri
 *         and ownership signals via inheritance in our implementation.
 */
interface IERC7527App {
    /// @notice Mint a fresh token to `to`. MUST revert when called by anyone
    ///         other than the bound Agency.
    function mint(address to, bytes calldata data) external returns (uint256 tokenId);

    /// @notice Burn `tokenId`. MUST revert when called by anyone other
    ///         than the bound Agency.
    function burn(uint256 tokenId, bytes calldata data) external;

    /// @notice The Agency this App is paired with. address(0) before pairing.
    function getAgency() external view returns (address payable);

    /// @notice One-shot binder. Reverts after first call (cf. invariant in
    ///         our implementation).
    function setAgency(address payable agency) external;

    /// @notice Total tokens currently outstanding. Drives the bonding curve.
    function getMaxSupply() external view returns (uint256);

    /// @notice Optional, implementation-defined human label for `id`.
    function getName(uint256 id) external view returns (string memory);
}
