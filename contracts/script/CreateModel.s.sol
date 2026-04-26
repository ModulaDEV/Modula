// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {ModulaFactory}      from "../src/ModulaFactory.sol";
import {Asset}              from "../src/interfaces/IERC7527.sol";

/**
 * @notice Convenience script for creators: register one model on-chain.
 *
 * @dev    Reads the model parameters from env so the same script
 *         works for any creator without code changes.
 *
 *         Run:
 *           FACTORY=0x… SLUG=my-lora BASE_MODEL=Llama-3-8B \
 *           MODEL_TYPE=LoRA TREASURY=0x… MANIFEST_URI=ipfs://… \
 *           CURRENCY=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
 *           BASE_PREMIUM=1000 \
 *           MINT_FEE_BPS=300 BURN_FEE_BPS=300 \
 *           forge script script/CreateModel.s.sol --rpc-url base --broadcast
 */
contract CreateModel is Script {
    function run() external {
        address factory       = vm.envAddress("FACTORY");
        string  memory slug   = vm.envString("SLUG");
        string  memory base_  = vm.envString("BASE_MODEL");
        string  memory mtype  = vm.envString("MODEL_TYPE");
        string  memory uri    = vm.envString("MANIFEST_URI");
        address treasury      = vm.envAddress("TREASURY");
        address currency      = vm.envAddress("CURRENCY");
        uint256 basePremium   = vm.envUint("BASE_PREMIUM");
        uint16  mintBps       = uint16(vm.envUint("MINT_FEE_BPS"));
        uint16  burnBps       = uint16(vm.envUint("BURN_FEE_BPS"));
        uint256 creatorKey    = vm.envUint("CREATOR_PRIVATE_KEY");

        Asset memory asset = Asset({
            currency:        currency,
            basePremium:     basePremium,
            feeRecipient:    treasury,
            mintFeePercent:  mintBps,
            burnFeePercent:  burnBps
        });

        vm.startBroadcast(creatorKey);
        (address agency, address app) =
            ModulaFactory(factory).createModel(asset, slug, base_, mtype, uri);
        vm.stopBroadcast();

        console2.log("agency:", agency);
        console2.log("app:   ", app);
    }
}
