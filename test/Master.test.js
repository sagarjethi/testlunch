const { expect } = require("chai");
const { ethers } = require("hardhat");
const { abi: TierIDOPoolABI } = require("../artifacts/contracts/TierIDOPool.sol/TierIDOPool.json");
// const { expectRevert, balance, expectEvent } = require('@openzeppelin/test-helpers');


describe.only('Tests for AsavaPoolFactory, TierIDOPool', () => {
    let accounts;
    let owner, nonOwner;
    let investor1, investor2, investor3, investor4;
    let tierIDOPoolAddress;
    const TOTAL_AMOUNT = ethers.BigNumber.from('1000000000000000000000') // 10K
    const MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4 = ethers.BigNumber.from('250000000000000000000') //2.5K
    const PRESALE_PROJECT_ID = 1;
    const TIERS_ALLOCATIONS = [
        MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4,
        MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4,
        MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4,
        MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4
    ];
    const IDO_TOKEN_PRICE = ethers.constants.WeiPerEther;
    const CURRENCY_TRANSFER_AMOUNT = ethers.BigNumber.from('300000000000000000000') //3K

    let asavaPoolConInstance;
    let tierIDOConInstance;
    let asavaInvestmentInfoConInstance;
    let asavaConInstance;
    let idoTokenConInstance;
    let currencyConInstance;
    let txObject;
    let poolInfo = {};
    let latestTime;

    describe('AsavaPoolFactory tests', () => {
        before(async () => {
            accounts = await ethers.getSigners();
            [owner, investor1, investor2, investor3, investor4, nonOwner] = accounts;

            const AsavaPoolFactory = await ethers.getContractFactory("AsavaPoolFactory");
            const ASVA = await ethers.getContractFactory("ASVA");
            const AsvaInvestmentsInfo = await ethers.getContractFactory("AsvaInvestmentsInfo");
            const IDOToken = await ethers.getContractFactory("IDOToken");
            const Currency = await ethers.getContractFactory("Currency");

            asavaInvestmentInfoConInstance = await AsvaInvestmentsInfo.deploy();
            asavaConInstance = await ASVA.deploy(owner.address);
            asavaPoolConInstance = await AsavaPoolFactory.deploy(asavaInvestmentInfoConInstance.address, asavaConInstance.address);
            idoTokenConInstance = await IDOToken.deploy();
            currencyConInstance = await Currency.deploy();

            // Must approve AsavaPoolFactory contract the totalAmount for transferFrom to succeed
            await idoTokenConInstance.approve(asavaPoolConInstance.address, TOTAL_AMOUNT);

            latestTime = Math.floor(Date.now() / 1000);
            round1Start = (latestTime + 86400); // Tomorrow
            poolInfo = {
                _token: idoTokenConInstance.address,
                _currency: currencyConInstance.address,
                _round1Start: round1Start,
                _round1End: round1Start + (2 * 86400),
                _round2Start: round1Start + (3 * 86400),
                _round2End: round1Start + (4 * 86400),
                _releaseTime: round1Start + (5 * 86400),
                _price: IDO_TOKEN_PRICE,
                _totalAmount: TOTAL_AMOUNT,
                _maxAmountThatCanBeInvestedInTier1: MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4,
                _maxAmountThatCanBeInvestedInTier2: MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4,
                _maxAmountThatCanBeInvestedInTier3: MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4,
                _maxAmountThatCanBeInvestedInTier4: MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4,
                _presaleProjectID: PRESALE_PROJECT_ID,
                _whitelistedAddressesTier1: [investor1.address],
                _whitelistedAddressesTier2: [investor2.address],
                _whitelistedAddressesTier3: [investor3.address],
                _whitelistedAddressesTier4: [investor4.address],
                _tiersAllocation: TIERS_ALLOCATIONS
            }

            // Transfer 3K Currency Token to investor1...inverstor4
            await currencyConInstance.transfer(investor1.address, CURRENCY_TRANSFER_AMOUNT);
            await currencyConInstance.transfer(investor2.address, CURRENCY_TRANSFER_AMOUNT);
            await currencyConInstance.transfer(investor3.address, CURRENCY_TRANSFER_AMOUNT);
            await currencyConInstance.transfer(investor4.address, CURRENCY_TRANSFER_AMOUNT);
        });

        describe('createPoolPublic', () => {
            context('reverts', () => {
                it('when invoked by nonOwner', async () => {
                    await expect(
                        asavaPoolConInstance.connect(nonOwner).createPoolPublic(poolInfo)
                    ).to.be.revertedWith("Ownable: caller is not the owner")
                })
                it('when token & currency both are the same', async () => {
                    poolInfo._token = idoTokenConInstance.address;
                    poolInfo._currency = idoTokenConInstance.address;
                    await expect(
                        asavaPoolConInstance.createPoolPublic(poolInfo)
                    ).to.be.revertedWith("Currency and Token can not be the same")
                })
                it('when token is address(0)', async () => {
                    poolInfo._token = ethers.constants.AddressZero;;
                    poolInfo._currency = currencyConInstance.address;
                    await expect(
                        asavaPoolConInstance.createPoolPublic(poolInfo)
                    ).to.be.revertedWith("PoolInfo token cannot be address zero")
                })
                it('when currency is address(0)', async () => {
                    poolInfo._token = idoTokenConInstance.address;
                    poolInfo._currency = ethers.constants.AddressZero;
                    await expect(
                        asavaPoolConInstance.createPoolPublic(poolInfo)
                    ).to.be.revertedWith("PoolInfo currency cannot be address zero")
                })
            })
            context('success', () => {
                it('should create public pool successfully', async () => {
                    poolInfo._currency = currencyConInstance.address;
                    txObject = await asavaPoolConInstance.createPoolPublic(poolInfo)
                    const poolList = await asavaPoolConInstance.poolList(0);
                    tierIDOPoolAddress = poolList.contractAddr;
                    // Sets the TierIDOPool contract instance
                    tierIDOConInstance = await ethers.getContractAt(TierIDOPoolABI, tierIDOPoolAddress);
                    expect(txObject.confirmations).to.equal(1);
                })
                it('should check balance of TierIDOPool to be 10K IDO Tokens', async () => {
                    expect(await idoTokenConInstance.balanceOf(tierIDOPoolAddress)).to.equal(TOTAL_AMOUNT)
                })
                it('should check pool list is set as expected', async () => {
                    const poolList = await asavaPoolConInstance.poolList(0);
                    expect({
                        contractAddr: tierIDOPoolAddress,
                        currency: currencyConInstance.address,
                        token: idoTokenConInstance.address
                    }).to.be.deep.equal({
                        contractAddr: poolList.contractAddr,
                        currency: poolList.currency,
                        token: poolList.token
                    })
                })
                it('should check the presale address to be TierIDOPool address', async () => {
                    const presaleAddress = await asavaInvestmentInfoConInstance.getPresaleAddress(0);
                    expect(presaleAddress).to.equal(tierIDOPoolAddress);
                })
                it('should check the platformToken address to be ASAVA address', async () => {
                    const platformToken = await tierIDOConInstance.platformToken();
                    expect(platformToken).to.equal(asavaConInstance.address);
                })
            })
        })
    })

    describe('TierIDOPool', () => {
        context('should check constructor invocation is successful', () => {
            it('should check ido token is set as expected', async () => {
                expect(
                    await tierIDOConInstance.token()
                ).to.equal(idoTokenConInstance.address)
            })
            it('should check currency is set as expected', async () => {
                expect(
                    await tierIDOConInstance.currency()
                ).to.equal(currencyConInstance.address)
            })
            it('should check round1Start is set as expected', async () => {
                expect(
                    await tierIDOConInstance.round1Start()
                ).to.equal(latestTime + 86400)
            })
            it('should check round1End is set as expected', async () => {
                expect(
                    await tierIDOConInstance.round1End()
                ).to.equal(((latestTime + 86400) + (2 * 86400)))
            })
            it('should check round2Start is set as expected', async () => {
                expect(
                    await tierIDOConInstance.round2Start()
                ).to.equal(((latestTime + 86400) + (3 * 86400)))
            })
            it('should check round2End is set as expected', async () => {
                expect(
                    await tierIDOConInstance.round2End()
                ).to.equal(((latestTime + 86400) + (4 * 86400)))
            })
            it('should check releaseTime is set as expected', async () => {
                expect(
                    await tierIDOConInstance.releaseTime()
                ).to.equal(((latestTime + 86400) + (5 * 86400)))
            })
            it('should check price is set as expected', async () => {
                expect(
                    await tierIDOConInstance.price()
                ).to.equal(IDO_TOKEN_PRICE)
            })
            it('should check totalAmount to equal 10K', async () => {
                expect(
                    await tierIDOConInstance.totalAmount()
                ).to.equal(TOTAL_AMOUNT)
            })
            it('should check availableTokens to equal 10K', async () => {
                expect(
                    await tierIDOConInstance.availableTokens()
                ).to.equal(TOTAL_AMOUNT)
            })
            it('should check tier1 max investment amount to be 2.5K', async () => {
                expect(
                    await tierIDOConInstance.tierMaxAmountThatCanBeInvested(1)
                ).to.equal(MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4)
            })
            it('should check tier2 max investment amount to be 2.5K', async () => {
                expect(
                    await tierIDOConInstance.tierMaxAmountThatCanBeInvested(2)
                ).to.equal(MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4)
            })
            it('should check tier3 max investment amount to be 2.5K', async () => {
                expect(
                    await tierIDOConInstance.tierMaxAmountThatCanBeInvested(3)
                ).to.equal(MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4)
            })
            it('should check tier4 max investment amount to be 2.5K', async () => {
                expect(
                    await tierIDOConInstance.tierMaxAmountThatCanBeInvested(4)
                ).to.equal(MAX_AMOUNT_THAT_CAN_BE_INVESTED_TIER_1_TO_4)
            })
        })
        describe('buy', () => {
            const AMOUNT = ethers.BigNumber.from('100000000000000000000') //1K
            context('execute buy in round1', () => {
                it('reverts when public sale is not active', async () => {
                    await expect(
                        tierIDOConInstance.connect(investor1).buy(AMOUNT)
                    ).to.be.revertedWith("Public sale is not yet activated")
                })
                it('should check investor1 currency balance to be 3K', async () => {
                    expect(
                        await currencyConInstance.balanceOf(investor1.address)
                    ).to.equal('300000000000000000000')
                })
                it('should check TierIDOPool currency balance to be 0', async () => {
                    expect(
                        await currencyConInstance.balanceOf(tierIDOPoolAddress)
                    ).to.equal('0')
                })
                it('should execute buy successfully', async () => {
                    await network.provider.send("evm_increaseTime", [172800]) // Increase time by 2 Days => 86400 * 2 => 172800
                    await network.provider.send("evm_mine")
                    // Investor1 gives approval to TierIDOPool contract
                    await currencyConInstance.connect(investor1).approve(tierIDOConInstance.address, ethers.constants.MaxUint256)
                    txObject = await tierIDOConInstance.connect(investor1).buy(AMOUNT);
                    expect(txObject.confirmations).to.equal(1);
                })
                it('should check number of participants to be equal to 1', async () => {
                    expect(
                        await tierIDOConInstance.numberParticipants()
                    ).to.equal(1)
                })
                it('should check available tokens to be 9K', async () => {
                    expect(
                        await tierIDOConInstance.availableTokens()
                    ).to.equal('900000000000000000000')
                })
                it('should check total amounts sold to be 1K', async () => {
                    expect(
                        await tierIDOConInstance.totalAmountSold()
                    ).to.equal('100000000000000000000')
                })
                it('should check investor1 currency balance to be 2K', async () => {
                    expect(
                        await currencyConInstance.balanceOf(investor1.address)
                    ).to.equal('200000000000000000000')
                })
                it('should check TierIDOPool currency balance to be 1K', async () => {
                    expect(
                        await currencyConInstance.balanceOf(tierIDOPoolAddress)
                    ).to.equal('100000000000000000000')
                })
                it('should check investor info is set as expected', async () => {
                    const investorInfo = await tierIDOConInstance.getInvestors();
                    expect({
                        investor: investor1.address,
                        amount: AMOUNT
                    }).to.be.deep.equal({
                        investor: investorInfo[0][0],
                        amount: investorInfo[1][0]
                    })
                })
            })
            context('execute buy in round2', () => {
                it('should check investor1 currency balance to be 12K', async () => {
                    await currencyConInstance.transfer(investor1.address, '1000000000000000000000');
                    expect(
                        await currencyConInstance.balanceOf(investor1.address)
                    ).to.equal('1200000000000000000000')
                })
                it('should check TierIDOPool currency balance to be 1K', async () => {
                    expect(
                        await currencyConInstance.balanceOf(tierIDOPoolAddress)
                    ).to.equal('100000000000000000000')
                })
                it('should execute buy successfully', async () => {
                    await network.provider.send("evm_increaseTime", [172800]) // Increase time by 2 Days => 86400 * 2 => 172800
                    await network.provider.send("evm_mine")
                    //Investor1 buys the rest 9K IDO Tokens too
                    txObject = await tierIDOConInstance.connect(investor1).buy('900000000000000000000');
                    expect(txObject.confirmations).to.equal(1);
                })
                it('should check available tokens to be 0', async () => {
                    expect(
                        await tierIDOConInstance.availableTokens()
                    ).to.equal('0')
                })
                it('should check total amounts sold to be 10K', async () => {
                    expect(
                        await tierIDOConInstance.totalAmountSold()
                    ).to.equal('1000000000000000000000')
                })
                it('should check investor1 currency balance to be 3K', async () => {
                    expect(
                        await currencyConInstance.balanceOf(investor1.address)
                    ).to.equal('300000000000000000000')
                })
                it('should check TierIDOPool currency balance to be 10K', async () => {
                    expect(
                        await currencyConInstance.balanceOf(tierIDOPoolAddress)
                    ).to.equal('1000000000000000000000')
                })
                it('reverts when availableTokens are 0', async () => {
                    await expect(
                        tierIDOConInstance.connect(investor1).buy(AMOUNT)
                    ).to.be.revertedWith("All tokens were purchased")
                })
            })
        })

        describe('claimTokens', () => {
            it('reverts when release time is not reached', async () => {
                await expect(
                    tierIDOConInstance.connect(investor1).claimTokens()
                ).to.be.revertedWith("Please wait until release time for claiming tokens")
            })
            it('before claim should check balance of TierIDOPool to be 10K IDO Tokens', async () => {
                expect(await idoTokenConInstance.balanceOf(tierIDOPoolAddress)).to.equal(TOTAL_AMOUNT)
            })
            it('should execute claimTokens successfully', async () => {
                await network.provider.send("evm_increaseTime", [172800]) // Increase time by 2 Days => 86400 * 2 => 172800
                await network.provider.send("evm_mine")
                //Investor1 buys the rest 9K IDO Tokens too
                txObject = await tierIDOConInstance.connect(investor1).claimTokens();
                expect(txObject.confirmations).to.equal(1);
            })
            it('after claim should check balance of TierIDOPool to be 0 IDO Tokens', async () => {
                expect(await idoTokenConInstance.balanceOf(tierIDOPoolAddress)).to.equal(0)
            })
            it('after claim should check balance of investor1 to be 10K IDO Tokens', async () => {
                expect(await idoTokenConInstance.balanceOf(investor1.address)).to.equal(TOTAL_AMOUNT)
            })
            it('reverts when trying to claim again', async () => {
                await expect(
                    tierIDOConInstance.connect(investor1).claimTokens()
                ).to.be.revertedWith("Already withdrawn")
            })
        })

    })
})
