const hre = require("hardhat");

let fs = require("fs");
let deployedContractsv1 = require("../deployment/v1.json");
let deploymentConfig = require("../config/config.json");

async function deployBase() {
  console.log("------------------------------ Initial Setup Started ------------------------------");

  const network = await hre.getChainId();
  deployedContractsv1[network] = {};

  console.log("------------------------------ Initial Setup Ended ------------------------------");

  console.log("--------------- Contract Deployment Started ---------------");


  const InvestmentsInfo = await hre.ethers.getContractFactory("AsvaInvestmentsInfo");
  const investmentsInfo = await InvestmentsInfo.deploy();
  console.log("Contract InvestmentsInfo deployed to: ", investmentsInfo.address);


  const asvaContractArgs =  ["0xad97fAb3787527B7D280deDB1F5053106e2d5500"];
  const ASVA = await hre.ethers.getContractFactory("ASVA");
  const asva = await ASVA.deploy(...asvaContractArgs);
  console.log("Contract ASVA deployed to: ", asva.address);

  const argContractFactory = [
    investmentsInfo.address,
    asva.address
 ];
  const AsvaInvestmentsFactory = await hre.ethers.getContractFactory("AsavaPoolFactory");
  const investmentsFactory = await AsvaInvestmentsFactory.deploy(...argContractFactory);
  console.log("Contract AsvaInvestmentsFactory deployed to: ", investmentsFactory.address);

  const IDOToken = await hre.ethers.getContractFactory("IDOToken");
  const idoToken= await IDOToken.deploy([]);
  console.log("Contract IDOToken deployed to: ", idoToken.address);

  const Currency = await hre.ethers.getContractFactory("Currency");
  const currency= await Currency.deploy([]);
  console.log("Contract currency deployed to: ", currency.address);

  console.log("------------------------------ Contract Deployment Ended ------------------------------");
  console.log("------------------------------ Deployment Storage Started ------------------------------");

  deployedContractsv1[network] = {
    AsvaInvestmentsFactory: investmentsFactory.address,
    AsvaInvestmentsInfo: investmentsInfo.address,
    AsvaTokenTest:asva.address,
    Currency: currency.address,
    IDOToken: idoToken.address
  };

  await hre.run("verify:verify", {
    address: investmentsInfo.address,
    network: hre.ethers.provider.network
  })

  await hre.run("verify:verify", {
    address: asva.address,
    network: hre.ethers.provider.network,
    constructorArguments:asvaContractArgs
  })

  await hre.run("verify:verify", {
    address: investmentsFactory.address,
    network: hre.ethers.provider.network,
    constructorArguments:argContractFactory
  })

  await hre.run("verify:verify", {
    address: currency.address,
    network: hre.ethers.provider.network,
    contract:'contract/test-contracts/Currency.sol:Currency'
  })

  await hre.run("verify:verify", {
    address: idoToken.address,
    network: hre.ethers.provider.network,
    contract:'contract/test-contracts/IDOToken.sol:Currency:IDOToken'
  })

  fs.writeFileSync("./deployment/v1.json", JSON.stringify(deployedContractsv1));


  console.log("------------------------------ Deployment Storage Ended ------------------------------");
}

deployBase()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
