// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";

import {ModulaApp}          from "../src/ModulaApp.sol";
import {ModulaAgency}       from "../src/ModulaAgency.sol";
import {ModulaRegistry}     from "../src/ModulaRegistry.sol";
import {ModulaFactory}      from "../src/ModulaFactory.sol";
import {ModulaAccessRouter} from "../src/ModulaAccessRouter.sol";

/**
 * @notice One-shot deploy script for the entire Modula contract suite.
 *         Order:
 *           1. ModulaApp implementation
 *           2. ModulaAgency implementation
 *           3. ModulaRegistry (needs the factory address up-front)
 *           4. ModulaFactory
 *           5. ModulaAccessRouter (independent of the above)
 *
 *         Step 3 needs the factory address before the factory exists.
 *         We use vm.computeCreateAddress + vm.getNonce to compute the
 *         factory's future CREATE address and feed it into the registry
 *         constructor. The factory then deploys at that exact address
 *         and the registry's immutable factory slot is correct.
 *
 *         Run via:
 *           forge script script/Deploy.s.sol \
 *             --rpc-url base_sepolia --broadcast --verify
 */
contract Deploy is Script {
    address public app;
    address public agency;
    address public registry;
    address public factory;
    address public router;

    function run() external {
        address protocolOwner    = vm.envAddress("PROTOCOL_OWNER");
        address gatewaySigner    = vm.envAddress("GATEWAY_SIGNER");
        uint256 deployerKey      = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer         = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // 1) Implementations
        app    = address(new ModulaApp());
        agency = address(new ModulaAgency());

        // 2) Registry — needs the factory's future address.
        uint64 nonce          = vm.getNonce(deployer);
        address futureFactory = vm.computeCreateAddress(deployer, nonce + 1);
        registry              = address(new ModulaRegistry(futureFactory));

        // 3) Factory — its CREATE address must equal `futureFactory`.
        factory = address(new ModulaFactory(agency, app, ModulaRegistry(registry)));
        require(factory == futureFactory, "factory address drift");

        // 4) AccessRouter — independent.
        router = address(new ModulaAccessRouter(protocolOwner, gatewaySigner));

        vm.stopBroadcast();

        console2.log("ModulaApp impl:     ", app);
        console2.log("ModulaAgency impl:  ", agency);
        console2.log("ModulaRegistry:     ", registry);
        console2.log("ModulaFactory:      ", factory);
        console2.log("ModulaAccessRouter: ", router);
    }
}
