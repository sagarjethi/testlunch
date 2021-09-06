const { expect } = require("chai");
const { ethers } = require("hardhat");

function web3StringToBytes32(text) {
  var result = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(text));
  while (result.length < 66) { result += '0'; }
  if (result.length !== 66) { throw new Error("invalid web3 implicit bytes32"); }
  return result;
}
describe("ASVA TOken", function() {

  let TokenAsva,
    AsvaInvestmentsInfoContract,
    AsvaInvestmentsFactory,
    closingTime,
    TestToken,
    owner,
    addr1,
    addr2,
    addrs,
    asvaProjectId;
  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    const HardhatTokenAsva = await ethers.getContractFactory("ASVA");

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    TokenAsva = await HardhatTokenAsva.deploy(owner.address);
    
    const HardhatAsvaInvestmentsInfoContract = await ethers.getContractFactory("AsvaInvestmentsInfo");
    AsvaInvestmentsInfoContract = await HardhatAsvaInvestmentsInfoContract.deploy() 
   
    const  HardhateAsvaInvestmentsFactory  = await ethers.getContractFactory("AsavaPoolFactory");
    AsvaInvestmentsFactory = await HardhateAsvaInvestmentsFactory.deploy(AsvaInvestmentsInfoContract.address,TokenAsva.address);
    await AsvaInvestmentsFactory.deployed();

    const  HardhateTestToken  = await ethers.getContractFactory("TestToken");
    TestToken = await HardhateTestToken.deploy(owner.address);
    await TestToken.deployed();

    const ownerTest = await TestToken.owner();


    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
   
  });
  
  it("Creating new presale", async function() {
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const round1Start = currentTimestamp ;
      round1End = round1Start + 6912000;
      round2Start = round1End + 6912000;
      round2End = round2Start + 6912000;
      
      releaseTime = round2End + 6912000 + 6912000;
      const price = '1000000000000000000';

      const _intro ={
        _token: TestToken.address,
        _currency:"0x8301F2213c0eeD49a7E28Ae4c3e91722919B8B47",
        _round1Start:round1Start,   
        _round1End:round1End,
        _round2Start:round2Start,
        _round2End:round2End,
        _releaseTime: releaseTime,
        _price: price,
        _totalAmount:  '100000000000000000000000',
        _Tier1MaxAmoutInvest: '10000000000000000000',
        _Tier2MaxAmoutInvest:'100000000000000000000',
        _Tier3MaxAmoutInvest: '1000000000000000000000',
        _Tier4MaxAmoutInvest: '10000000000000000000000',
        // _Tier1Allocation:'25000000000000000000000',
        // _Tier2Allocation:'25000000000000000000000',
        // _Tier3Allocation:'25000000000000000000000', 
        // _Tier4Allocation:'25000000000000000000000',
        _presaleDbID: "1",
        _whitelistedAddresses: [addr1.address],
        _tiers:[1]
      };
     

    // const balance= await AsvaInvestmentsFactory.getBalancecreatePresale(_intro, PresaleAMMInfo,_stringInfo);
      await TestToken.increaseAllowance(AsvaInvestmentsFactory.address, "1000000000000000000000000");
      

      const transaction = await AsvaInvestmentsFactory.createPoolPublic(_intro);
      
      console.log("presale",owner.address);
      
      let tx = await transaction.wait()
      let event = tx.events[tx.events.length-1]
    
      // asvaProjectId =event.args.asvaId.toNumber();
    
      // const asvaProjectContract= await AsvaInvestmentsInfoContract.getPresaleAddress(asvaProjectId);
      
      // this.AsvaInvestmentsPresale = await ethers.getContractFactory("AsvaInvestmentsPresale");
   
      // this.presale = await ethers.getContractFactory('AsvaInvestmentsPresale', this.AsvaInvestmentsPresale);
     
     // console.log("this.presale",event);
      //get variables from token instance
      // const asvaInvestmentsFactoryAddress = await this.presale.asvaDevAddress()
    
            
    // expect(asvaInvestmentsFactoryAddress).to.equal(owner);

    });
  
  // it("Checking  token info address set okay", async function() {
  //   expect(await AsvaInvestmentsFactory.platformToken()).to.equal(TokenAsva.address);
  // });

  // it("Checking platform token info address set okay", async function() {
  //   expect(await AsvaInvestmentsFactory.ASVA()).to.equal(AsvaInvestmentsInfoContract.address);
  // });





});
