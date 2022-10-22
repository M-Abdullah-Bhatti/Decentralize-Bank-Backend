// const { ethers, network } = require("hardhat");
const { Signer } = require("ethers");
const { network, ethers, getNamedAccounts } = require("hardhat");
const PRICE = ethers.utils.parseEther("2");

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

async function borrow() {
  const [customer] = await hre.ethers.getSigners();

  const dbank = await ethers.getContract("DBank");

  const addresses = [customer.address, dbank.address];
  console.log("== start ==");
  await printBalances(addresses);

  await dbank.connect(customer).borrow({ value: PRICE });

  console.log("== borrow ==");
  await printBalances(addresses);
}

borrow()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
