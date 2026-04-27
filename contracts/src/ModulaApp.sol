// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721}     from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Strings}    from "@openzeppelin/contracts/utils/Strings.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import {IModulaApp}  from "./interfaces/IModulaApp.sol";
import {IERC7527App} from "./interfaces/IERC7527.sol";
import {Errors}      from "./libraries/Errors.sol";

/**
 * @title  ModulaApp
 * @notice One ERC-721 per Modula model. Tokens are minted and burned
 *         exclusively by the paired ModulaAgency along its bonding curve.
 * @dev    The App is deployed as an EIP-1167 minimal proxy clone by
 *         ModulaFactory, so it cannot receive constructor args. The
 *         {initialize} entry point performs the post-clone setup once
 *         and then locks itself.
 *
 *         The App's Agency is set immutable (in spirit; technically
 *         an `address public` slot) at initialization time, and any
 *         subsequent attempt to rebind reverts with `AgencyAlreadyBound`.
 *         This invariant is the keystone of the App's access control:
 *         once an App's Agency is set, only that Agency may mint or
 *         burn tokens against it.
 *
 * @custom:invariant agency != address(0) after first {initialize} call
 * @custom:invariant only `agency` may call {mint} and {burn}
 * @custom:invariant {totalSupply} grows monotonically by mints minus burns
 *                   (no other supply path exists)
 */
contract ModulaApp is IModulaApp, ERC721, Initializable {
    using Strings for uint256;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    /// @notice The Agency this App is bound to. Set once in `initialize`.
    ///         Returned by the explicit `getAgency()` view below for
    ///         IERC7527App conformance.
    address payable public agency;

    /// @inheritdoc IModulaApp
    string public slug;

    /// @dev Internal token-id counter. Starts at 1 so id 0 always means
    ///      "no token". Burned tokens are not reused — every token id is
    ///      unique forever on a given App.
    uint256 private _nextId;

    /// @dev Tracks current outstanding supply (totalMinted - totalBurned).
    ///      Drives the bonding curve via `getMaxSupply()`.
    uint256 private _outstanding;

    // ---------------------------------------------------------------------
    // Constructor (for the implementation contract; clones never run it)
    // ---------------------------------------------------------------------

    /// @dev The implementation contract is deployed once by ModulaFactory
    ///      with empty name+symbol. Clones override these via the
    ///      {initialize} path which writes them through ERC-721's storage.
    constructor() ERC721("Modula App (impl)", "MOD-APP") {
        _disableInitializers();
    }

    // ---------------------------------------------------------------------
    // Initialization (one-shot, called immediately after cloning)
    // ---------------------------------------------------------------------

    /// @inheritdoc IModulaApp
    function initialize(address payable agency_, string calldata slug_)
        external
        override
        initializer
    {
        if (agency_ == address(0)) revert Errors.EmptyAgency();
        agency = agency_;
        slug = slug_;
        _nextId = 1;
    }

    // ---------------------------------------------------------------------
    // ERC-7527 mint / burn — Agency only
    // ---------------------------------------------------------------------

    /// @inheritdoc IERC7527App
    function mint(address to, bytes calldata /* data */ )
        external
        override
        returns (uint256 tokenId)
    {
        if (msg.sender != agency) revert Errors.NotAgency();
        unchecked {
            tokenId = _nextId++;
            _outstanding++;
        }
        _safeMint(to, tokenId);
    }

    /// @inheritdoc IERC7527App
    function burn(uint256 tokenId, bytes calldata /* data */ ) external override {
        if (msg.sender != agency) revert Errors.NotAgency();
        if (_ownerOf(tokenId) == address(0)) revert Errors.TokenDoesNotExist(tokenId);
        unchecked {
            _outstanding--;
        }
        _burn(tokenId);
    }

    // ---------------------------------------------------------------------
    // ERC-7527 view surface
    // ---------------------------------------------------------------------

    /// @inheritdoc IERC7527App
    function getAgency() external view override returns (address payable) {
        return agency;
    }

    /// @inheritdoc IERC7527App
    function setAgency(address payable) external pure override {
        // The Agency is bound at {initialize} time and is permanently
        // immutable thereafter. We deliberately revert here rather than
        // omit the function so that ERC-7527 conformance tooling that
        // probes the interface gets a clean, named revert.
        revert Errors.AgencyAlreadyBound();
    }

    /// @inheritdoc IERC7527App
    /// @dev Modula's curve is parameterized on *outstanding* supply,
    ///      not lifetime mints. Burned tokens reduce this.
    function getMaxSupply() external view override returns (uint256) {
        return _outstanding;
    }

    /// @inheritdoc IERC7527App
    function getName(uint256 id) external view override returns (string memory) {
        if (_ownerOf(id) == address(0)) revert Errors.TokenDoesNotExist(id);
        return string.concat(slug, " #", id.toString());
    }

    // ---------------------------------------------------------------------
    // ERC-721 metadata
    // ---------------------------------------------------------------------

    /// @dev Cloned Apps share the implementation's name/symbol storage,
    ///      but we override the public views to surface the slug instead.
    ///      This means OpenSea/Basescan show "solidity-audit-v3" rather
    ///      than the impl-time placeholder.
    function name() public view override returns (string memory) {
        return slug;
    }

    function symbol() public view override returns (string memory) {
        return slug;
    }

    /// @dev Token URIs are derived deterministically from the slug + id
    ///      so the gateway and indexer can reconstruct them without
    ///      reading on-chain state. Override to point at the model
    ///      manifest URI on IPFS at the project level.
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert Errors.TokenDoesNotExist(tokenId);
        return string.concat("modula://", slug, "/", tokenId.toString());
    }
}
