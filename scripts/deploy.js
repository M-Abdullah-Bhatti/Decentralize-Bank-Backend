const hre = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChains } = require("../helper-hardhat-config");
async function main() {
  // We get the contract to deploy.
  const dBank = await hre.ethers.getContractFactory("DBank");
  const dbank = await dBank.deploy();

  await dbank.deployed();

  console.log("DBank deployed to:", dbank.address);
  args = [];
  await verify(dbank.address, args);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// contract address: 0xBFF7393561B830B0AeB1975CBAaA159E4C4436B3
