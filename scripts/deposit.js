// const { ethers, network } = require("hardhat");
const { Signer } = require("ethers");
const { network, ethers, getNamedAccounts } = require("hardhat");
const PRICE = ethers.utils.parseEther("0.001");

async function getBalance(address) {
  const balanceBigInt = await hre.waffle.provider.getBalance(address);
  return hre.ethers.utils.formatEther(balanceBigInt);
}

// Logs the Ether balances for a list of addresses.
async function printBalances(addresses) {
  let idx = 0;
  for (const address of addresses) {
    console.log(`Address ${idx} balance: `, await getBalance(address));
    idx++;
  }
}

async function deposit() {
  const [customer] = await hre.ethers.getSigners();

  const dbank = await ethers.getContract("DBank");

  const addresses = [customer.address, dbank.address];
  console.log("== start ==");
  await printBalances(addresses);

  await dbank.connect(customer).deposit({ value: PRICE });

  console.log("== deposit ==");
  await printBalances(addresses);
}

deposit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
