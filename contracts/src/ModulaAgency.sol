// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20}      from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20}   from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC721}     from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {Initializable}   from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IModulaAgency} from "./interfaces/IModulaAgency.sol";
import {IERC7527Agency, Asset} from "./interfaces/IERC7527.sol";
import {IModulaApp}    from "./interfaces/IModulaApp.sol";
import {BondingCurve}  from "./libraries/BondingCurve.sol";
import {Errors}        from "./libraries/Errors.sol";

/**
 * @title  ModulaAgency
 * @notice ERC-7527 Agency for one Modula model: holds the USDC reserve,
 *         runs the deterministic bonding-curve oracle, and mints/burns
 *         the paired App on every wrap/unwrap.
 * @dev    Deployed as an EIP-1167 minimal proxy by ModulaFactory.
 *         Initialised once via {initialize} immediately after cloning
 *         and locked thereafter.
 *
 * Wrap path
 * ---------
 *   1. Caller approves Agency for `premium` of currency.
 *   2. Caller calls {wrap}(to, data).
 *   3. Agency reads {getWrapOracle} -> (premium, fee).
 *      data may carry a uint256 `maxPremium` for slippage protection;
 *      if absent the caller accepts any quoted price.
 *   4. Agency safe-transfers `premium` from caller into itself, then
 *      forwards `fee` to the configured fee recipient (the model
 *      treasury Safe).
 *   5. Agency calls App.mint(to, data) which atomically increments
 *      the App's outstanding supply.
 *
 * Unwrap path
 * -----------
 *   1. Caller (must own `tokenId`) calls {unwrap}(to, tokenId, data).
 *   2. Agency reads {getUnwrapOracle} -> (premium, fee).
 *   3. Agency calls App.burn(tokenId, data) which atomically decrements
 *      the App's outstanding supply.
 *   4. Agency safe-transfers `premium - fee` of currency to `to`, and
 *      `fee` to the fee recipient.
 *
 * @custom:invariant Asset is set exactly once at initialize and never mutated
 * @custom:invariant balanceOf(currency, this) >= sum of all minted premiums - sum of all unwrapped premiums
 * @custom:invariant mintFeePercent <= MAX_FEE_BPS && burnFeePercent <= MAX_FEE_BPS
 * @custom:invariant nonReentrant guard on wrap and unwrap
 */
contract ModulaAgency is IModulaAgency, ReentrancyGuard, Initializable {
    using SafeERC20 for IERC20;

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    /// @inheritdoc IModulaAgency
    uint16 public constant override MAX_FEE_BPS = 1_000; // 10%

    // ---------------------------------------------------------------------
    // Storage (clone-relative; the implementation never holds real state)
    // ---------------------------------------------------------------------

    IModulaApp public app;
    Asset      public assetData;
    bytes      private _attributeData;

    // ---------------------------------------------------------------------
    // Constructor — implementation only; clones never run it.
    // ---------------------------------------------------------------------

    constructor() {
        _disableInitializers();
    }

    // ---------------------------------------------------------------------
    // Initialisation (one-shot, called by ModulaFactory immediately after clone)
    // ---------------------------------------------------------------------

    /// @inheritdoc IModulaAgency
    function initialize(IModulaApp app_, Asset calldata asset_, bytes calldata attributeData_)
        external
        override
        initializer
    {
        if (address(app_) == address(0))     revert Errors.EmptyAgency();
        if (asset_.currency == address(0))   revert Errors.AssetCurrencyZero();
        if (asset_.feeRecipient == address(0)) revert Errors.AssetTreasuryZero();
        if (asset_.mintFeePercent > MAX_FEE_BPS) {
            revert Errors.FeeAboveCap(asset_.mintFeePercent, MAX_FEE_BPS);
        }
        if (asset_.burnFeePercent > MAX_FEE_BPS) {
            revert Errors.FeeAboveCap(asset_.burnFeePercent, MAX_FEE_BPS);
        }
        if (asset_.basePremium == 0) revert Errors.InvalidAsset();

        app            = app_;
        assetData      = asset_;
        _attributeData = attributeData_;
    }

    // ---------------------------------------------------------------------
    // Oracle (pure on on-chain state)
    // ---------------------------------------------------------------------

    /// @inheritdoc IERC7527Agency
    function getWrapOracle(bytes memory)
        public
        view
        override(IERC7527Agency, IModulaAgency)
        returns (uint256 premium, uint256 fee)
    {
        Asset memory a = assetData;
        uint256 supply = app.getMaxSupply();
        premium = BondingCurve.priceMint(supply, a.basePremium);
        fee     = BondingCurve.applyFee(premium, a.mintFeePercent);
    }

    /// @inheritdoc IERC7527Agency
    function getUnwrapOracle(bytes memory)
        public
        view
        override(IERC7527Agency, IModulaAgency)
        returns (uint256 premium, uint256 fee)
    {
        Asset memory a = assetData;
        uint256 supply = app.getMaxSupply();
        premium = BondingCurve.priceBurn(supply, a.basePremium);
        fee     = BondingCurve.applyFee(premium, a.burnFeePercent);
    }

    /// @inheritdoc IERC7527Agency
    function getStrategy()
        external
        view
        override
        returns (address app_, Asset memory asset_, bytes memory attributeData_)
    {
        return (address(app), assetData, _attributeData);
    }

    // ---------------------------------------------------------------------
    // Wrap / Unwrap (state-changing)
    // ---------------------------------------------------------------------

    /// @inheritdoc IERC7527Agency
    function wrap(address to, bytes calldata data)
        external
        payable
        override
        nonReentrant
        returns (uint256 tokenId)
    {
        Asset memory a = assetData;
        (uint256 premium, uint256 fee) = getWrapOracle(data);

        // Slippage guard. If the caller passed a uint256 maxPremium it must
        // not be exceeded by the quoted total. data shorter than 32 bytes
        // means no guard requested.
        if (data.length >= 32) {
            uint256 maxPremium = abi.decode(data[:32], (uint256));
            if (maxPremium != 0 && premium + fee > maxPremium) {
                revert Errors.SlippageExceeded(premium + fee, maxPremium);
            }
        }

        IERC20(a.currency).safeTransferFrom(msg.sender, address(this), premium + fee);
        if (fee > 0) {
            IERC20(a.currency).safeTransfer(a.feeRecipient, fee);
        }

        tokenId = app.mint(to, data);
        emit Wrap(to, tokenId, premium, fee);
    }

    /// @inheritdoc IERC7527Agency
    function unwrap(address to, uint256 tokenId, bytes calldata data)
        external
        payable
        override
        nonReentrant
    {
        Asset memory a = assetData;

        // Caller must hold the token they're unwrapping. We check before
        // burning so the revert path is cheap.
        if (IERC721(address(app)).ownerOf(tokenId) != msg.sender) {
            revert Errors.NotApp();
        }

        (uint256 premium, uint256 fee) = getUnwrapOracle(data);

        // Burn first, then pay out. Burn-then-pay avoids the classic
        // mint-then-pay reentrancy where a malicious receiver could
        // re-enter the curve before the supply update lands.
        app.burn(tokenId, data);

        if (fee > 0) {
            IERC20(a.currency).safeTransfer(a.feeRecipient, fee);
        }
        IERC20(a.currency).safeTransfer(to, premium - fee);

        emit Unwrap(to, tokenId, premium, fee);
    }

    // ---------------------------------------------------------------------
    // Native ETH guard — Modula reserves are always ERC-20, never ETH.
    // ---------------------------------------------------------------------

    /// @dev ERC-7527 declares wrap/unwrap payable so an Agency *may*
    ///      use ETH as its reserve. Modula's Asset.currency is always
    ///      USDC, so any ETH attached to wrap/unwrap is unintended —
    ///      we reject it explicitly to surface the misconfig.
    receive() external payable {
        revert();
    }
}
