const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) ?
    describe.skip :
    describe("DBank Unit Tests", function() {
        let dBank, dBankContract;
        const PRICE = ethers.utils.parseEther("0.1");
        const MOREPRICE = ethers.utils.parseEther("0.2");
        const LESSPRICE = ethers.utils.parseEther("0");
        // const TOKEN_ID = 0;

        beforeEach(async() => {
            const accounts = await ethers.getSigners(); // could also do with getNamedAccounts
            deployer = accounts[0];
            user = accounts[1];
            await deployments.fixture(["all"]);
            dBankContract = await ethers.getContract("DBank");
            dBank = dBankContract.connect(deployer);
        });

        describe("deposit", function() {
            it("emits an event after depositing an amount", async function() {
                expect(await dBank.deposit({ value: PRICE })).to.emit("Deposit");
            });

            it("Checks if msg.value is less than or equal to zero", async function() {
                // await dBank.deposit({ value: PRICE });
                const error = `Bank__LessCollateral("Collateral amount must be greater than 0 ETH")`;

                await expect(dBank.deposit({ value: LESSPRICE })).to.be.revertedWith(
                    error
                );
            });

            it("Checks balances of etherBalanceOf, depositStart, isDeposited", async function() {
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

            describe("withdraw", function() {
                beforeEach(async() => {
                    await dBank.deposit({ value: PRICE });
                });

                it("emits an event after withdrawing an amount", async function() {
                    expect(await dBank.withdraw(PRICE)).to.emit("Withdraw");
                });

                it("Checks if amount is greater than userBalance", async function() {
                    // getUserBalance
                    const getUserBalance = await dBank.getEtherBalanceOf();
                    const error = `Bank__OverWithDraw("Withdraw can't be more than deposit")`;

                    await expect(dBank.withdraw(MOREPRICE)).to.be.revertedWith(error);
                });

                it("Checks if amount is transferred to msg.sender", async function() {
                    // getUserBalance
                    const getUserBalance = await dBank.getEtherBalanceOf();
                    const withdrawAmount = await dBank.withdraw(PRICE);
                    const getUserNewBalance = await dBank.getEtherBalanceOf();
                    assert(
                        PRICE.toString() ==
                        (getUserBalance - getUserNewBalance).toString()
                    );
                });

                // it("Checks balances of etherBalanceOf, depositStart, isDeposited", async function() {
                //     await dBank.deposit({ value: PRICE });

                //     // getUserBalance
                //     const getUserBalance = await dBank.getEtherBalanceOf();
                //     // console.log("User balance " + getUserBalance);

                //     // getDepositStartTime
                //     const getDepositStartTime = await dBank.getDepositStartTime(
                //         deployer.address
                //     );

                //     // chechIsDeposited
                //     const getChechIsDeposited = await dBank.chechIsDeposited(
                //         deployer.address
                //     );

                //     // getting timestamp
                //     const blockNumBefore = await ethers.provider.getBlockNumber();
                //     const blockBefore = await ethers.provider.getBlock(blockNumBefore);
                //     const timestampBefore = blockBefore.timestamp;

                //     // Asserts
                //     // getUserBalance
                //     assert(getUserBalance.toString() == PRICE.toString());
                //     // getDepositStartTime
                //     assert(getDepositStartTime.toString() == timestampBefore.toString());
                //     // chechIsDeposited
                //     assert(getChechIsDeposited == true);
                // });

                // ========================
            });
        });
    });