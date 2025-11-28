const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const cappuccinoSdkPath = path.resolve(projectRoot, "..", "cappuccino-web-sdk");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...new Set([...(config.watchFolders || []), cappuccinoSdkPath])];

config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, "node_modules"),
    path.resolve(projectRoot, "..", "node_modules"),
];

config.resolver.disableHierarchicalLookup = true;

module.exports = config;
