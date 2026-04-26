// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2}     from "forge-std/Script.sol";
import {ModulaAccessRouter}   from "../src/ModulaAccessRouter.sol";

/**
 * @notice Operational script: rotate the gateway hot wallet that may
 *         emit ModelCalled events. Must be called by the AccessRouter
 *         owner (the protocol multisig).
 *
 *         Run:
 *           ROUTER=0x… NEW_SIGNER=0x… forge script script/SetGatewaySigner.s.sol \
 *             --rpc-url base --broadcast --ledger
 */
contract SetGatewaySigner is Script {
    function run() external {
        address router    = vm.envAddress("ROUTER");
        address newSigner = vm.envAddress("NEW_SIGNER");

        vm.startBroadcast();
        ModulaAccessRouter(router).setGatewaySigner(newSigner);
        vm.stopBroadcast();

        console2.log("Rotated gateway signer to:", newSigner);
    }
}
