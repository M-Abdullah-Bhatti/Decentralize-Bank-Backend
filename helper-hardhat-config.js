const { ethers } = require("hardhat");

const networkConfig = {
  default: {
    name: "hardhat",
  },
  5: {
    name: "goerli",
  },
  31337: {
    name: "localhost",
  },
};

const developmentChains = ["hardhat", "localhost"];

module.exports = {
  networkConfig,
  developmentChains,
};
