// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract ASVA is ERC20Burnable, Ownable {
    using SafeMath for uint256;

    uint256 private constant initialSupply = 90e6 * 10**18; //90 million
    //$0.1 = 10 cents
    uint256 public constant seedPrice = 10;
    //$0.3 = 20 cents
    uint256 public constant privatePrice = 20;
    //$0.3 = 30 cents
    uint256 public constant publicPrice = 30;
    //7.5%
    uint256 public constant seedTokenPercentage = 750;
    //20%
    uint256 public constant privateSalePercentage = 2000;
    //12.5%
    uint256 public constant publicSalePercentage = 1250;
    //15%
    uint256 public constant liquidityPercentage = 1500;
    //10%
    uint256 public constant teamPercentage = 1000;
    //5%
    uint256 public constant partnersPercentage = 500;
    //20%
    uint256 public constant stakingPercentage = 2000;
    //5%
    uint256 public constant marketingPercentage = 500;
    //5%
    uint256 public constant reserveFundPercentage = 500;
    uint256 public seedToken;
    uint256 public privateSaleToken;
    uint256 public publicSaleToken;
    uint256 public liquidityToken;
    uint256 public teamToken;
    uint256 public marketingToken;
    uint256 public partnersToken;
    uint256 public stakingToken;
    uint256 public reserveToken;
    uint256 public constant percentageDivider = 10000;

    constructor(address _user) public ERC20("Asva finance", "ASVA") {
        seedToken = (initialSupply.mul(seedTokenPercentage)).div(percentageDivider);
        privateSaleToken = (initialSupply.mul(privateSalePercentage)).div(percentageDivider);
        publicSaleToken = (initialSupply.mul(publicSalePercentage)).div(percentageDivider);
        liquidityToken = (initialSupply.mul(liquidityPercentage)).div(percentageDivider);
        teamToken = (initialSupply.mul(teamPercentage)).div(percentageDivider);
        marketingToken = (initialSupply.mul(marketingPercentage)).div(percentageDivider);
        partnersToken = (initialSupply.mul(partnersPercentage)).div(percentageDivider);
        stakingToken = (initialSupply.mul(stakingPercentage)).div(percentageDivider);
        reserveToken = (initialSupply.mul(reserveFundPercentage)).div(percentageDivider);
        _mint(_user, initialSupply);
    }

    receive() external payable {
        payable(owner()).transfer(msg.value);
    }

    function fallabck() public payable {
        payable(owner()).transfer(getBalance());
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
