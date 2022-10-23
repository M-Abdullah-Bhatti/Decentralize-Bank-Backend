const { messagePrefix } = require("@ethersproject/hash");
const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("DBank Unit Tests", function () {
      let dBank, dBankContract;
      const PRICE = ethers.utils.parseEther("0.1");
      const MOREPRICE = ethers.utils.parseEther("0.2");
      const LESSPRICE = ethers.utils.parseEther("0");
      // const TOKEN_ID = 0;

      beforeEach(async () => {
        const accounts = await ethers.getSigners(); // could also do with getNamedAccounts
        deployer = accounts[0];
        user = accounts[1];
        await deployments.fixture(["all"]);
        dBankContract = await ethers.getContract("DBank");
        dBank = dBankContract.connect(deployer);
      });

      describe("deposit", function () {
        it("emits an event after depositing an amount", async function () {
          expect(await dBank.deposit({ value: PRICE })).to.emit("Deposit");
        });

        it("Checks if msg.value is less than or equal to zero", async function () {
          // await dBank.deposit({ value: PRICE });
          const error = `Bank__LessCollateral("Collateral amount must be greater than 0 ETH")`;

          await expect(dBank.deposit({ value: LESSPRICE })).to.be.revertedWith(
            error
          );
        });

        it("Checks balances of etherBalanceOf, depositStart, isDeposited", async function () {
          await dBank.deposit({ value: PRICE });

          // getUserBalance
          const getUserBalance = await dBank.getEtherBalanceOf();
          // console.log("User balance " + getUserBalance);

          // getDepositStartTime
          const getDepositStartTime = await dBank.getDepositStartTime(
            deployer.address
          );

          // chechIsDeposited
          const getChechIsDeposited = await dBank.chechIsDeposited(
            deployer.address
          );

          // getting timestamp
          const blockNumBefore = await ethers.provider.getBlockNumber();
          const blockBefore = await ethers.provider.getBlock(blockNumBefore);
          const timestampBefore = blockBefore.timestamp;

          // Asserts
          // getUserBalance
          assert(getUserBalance.toString() == PRICE.toString());
          // getDepositStartTime
          assert(getDepositStartTime.toString() == timestampBefore.toString());
          // chechIsDeposited
          assert(getChechIsDeposited == true);
        });

        // ========================

        describe("withdraw", function () {
          beforeEach(async () => {
            await dBank.deposit({ value: PRICE });
          });

          it("emits an event after withdrawing an amount", async function () {
            expect(await dBank.withdraw(PRICE)).to.emit("Withdraw");
          });

          it("Checks if amount is greater than userBalance", async function () {
            // getUserBalance
            const getUserBalance = await dBank.getEtherBalanceOf();
            const error = `Bank__OverWithDraw("Withdraw can't be more than deposit")`;

            await expect(dBank.withdraw(MOREPRICE)).to.be.revertedWith(error);
          });

          it("Checks if amount is transferred to msg.sender", async function () {
            // getUserBalance
            const getUserBalance = await dBank.getEtherBalanceOf();
            const withdrawAmount = await dBank.withdraw(PRICE);
            const getUserNewBalance = await dBank.getEtherBalanceOf();
            assert(
              PRICE.toString() ==
                (getUserBalance - getUserNewBalance).toString()
            );
          });
        });

        // ==================================

        describe("borrow", function () {
          // beforeEach(async () => {
          //   await dBank.deposit({ value: PRICE });
          // });

          it("emits an event after borrowing an amount", async function () {
            expect(await dBank.borrow({ value: PRICE })).to.emit("Borrow");
          });

          it("Checks if msg.value in borrow is less than or equal to zero", async function () {
            // await dBank.deposit({ value: PRICE });
            const error = `Bank__LessCollateral("Collateral amount must be greater than 0 ETH")`;

            await expect(dBank.borrow({ value: LESSPRICE })).to.be.revertedWith(
              error
            );
          });

          it("Checks balances of getCollateralAmount and token balance", async function () {
            await dBank.borrow({ value: PRICE });

            // getUserBalance
            const getCollateralAmount = await dBank.getCollateralEther(
              deployer.address
            );

            const tokenBalance = await dBank.balanceOf(deployer.address);

            assert(
              (getCollateralAmount / 2).toString() == tokenBalance.toString()
            );
          });
        });

        // ============================================

        describe("payOff", function () {
          beforeEach(async () => {
            await dBank.borrow({ value: PRICE });
          });

          it("emits an event after payoff the loan", async function () {
            expect(await dBank.payOff()).to.emit("Payoff");
          });

          it("Checks the amount isBorrowed", async function () {
            // chechIsBorrowed
            let getCheckIsBorrowed = await dBank.chechIsBorrowed(
              deployer.address
            );

            const error = `Bank__NoActiveLoan()`;

            assert(getCheckIsBorrowed == true);
            await dBank.payOff();
            await expect(dBank.payOff()).to.be.revertedWith(error);
          });

          it("Checks if tokens is transferred to dBank contract", async function () {
            const userTokenBalance = await dBank.balanceOf(deployer.address);

            const getContractTokens = await dBank.balanceOf(
              dBankContract.address
            );
            await dBank.payOff();
            const userNewTokenBalance = await dBank.balanceOf(deployer.address);
            const getNewContractTokens = await dBank.balanceOf(
              dBankContract.address
            );

            assert(
              userTokenBalance.toString() == getNewContractTokens.toString()
            );
          });
        });
      });
    });

// balanceOf[msg.sender] ---> tokens
