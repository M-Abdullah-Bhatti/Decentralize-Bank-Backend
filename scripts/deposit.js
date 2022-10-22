// const { ethers, network } = require("hardhat");
const { network, ethers, getNamedAccounts } = require("hardhat");
const PRICE = ethers.utils.parseEther("0.001");
async function deposit() {
  const { deployer } = await getNamedAccounts();
  const dbank = await ethers.getContract("DBank");

  let dep = dbank.connect(deployer);

  const secondAddressSigner = await ethers.getSigner(dep);

  const depositMoney = await secondAddressSigner.deposit({ value: PRICE });

  await depositMoney.wait(1);

  const userBalance = await deployer.getBalance();

  console.log("Amount deposited!!!!!!!!!!! ", userBalance);
  console.log("Total Contract balance ", depositMoney);
}

deposit()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
