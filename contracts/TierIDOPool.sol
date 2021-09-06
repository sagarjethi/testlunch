// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title TierIDOPool
/// @notice IDO contract useful for launching NewIDO
//solhint-disable-next-line max-states-count
contract TierIDOPool is Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    enum Type {
        MOON,
        PLANET,
        RIDER,
        KNIGHT
    }

    /**
     * @dev Struct to store information of each Sale
     * @param investor Address of user/investor
     * @param amount Amount of tokens to be purchased
     * @param tokensWithdrawn Tokens Withdrawal status
     */
    struct Sale {
        address investor;
        uint256 amount;
        bool tokensWithdrawn;
    }

    /**
     * @dev Struct to store information of each Investor
     * @param investor Address of user/investor
     * @param amount Amount of tokens purchased
     */
    struct Investor {
        address investor;
        uint256 amount;
    }

    /**
     * @dev Struct to Properties of IDO
     * @param round1Start Timestamp of when round1 starts
     * @param round1End Timestamp of when round1 ends
     * @param round2Start Timestamp of when round2 starts
     * @param round2End Timestamp of when round2 ends
     * @param platformToken The ERC20 platform token contract address
     * @param token The ERC20 token contract address
     * @param currency The curreny used for the IDO
     * @param price Price of the token for the IDO
     * @param rate The rate for each token
     */
    struct Props {
        uint256 round1Start;
        uint256 round1End;
        uint256 round2Start;
        uint256 round2End;
        IERC20 platformToken;
        IERC20 token;
        IERC20 currency;
        uint256 price;
        uint256 rate;
    }

    // Platform token
    IERC20 public platformToken;
    // Token for sale
    IERC20 public token;
    // Token used to buy
    IERC20 public currency;

    // List investors
    Investor[] private investorInfo;
    // Info of each investor that buy tokens.
    mapping(address => Sale) public sales;
    // Round 1 start time
    uint256 public round1Start;
    // Round 1 end time
    uint256 public round1End;
    // Round 2 start time
    uint256 public round2Start;
    // Round 1 end time
    uint256 public round2End;
    // Price of each token
    uint256 public price;
    // Amount of tokens remaining
    uint256 public availableTokens;
    // Total amount of tokens to be sold
    uint256 public totalAmount;
    // Total amount sold
    uint256 public totalAmountSold;
    // Release time
    uint256 public releaseTime;
    // Whitelist addresses
    mapping(address => bool) public poolWhiteList;
    address[] private listWhitelists;
    // Tier to which white list address belongs
    mapping(address => uint8) public addressBelongsToTier;

    // Number of investors
    uint256 public numberParticipants;
    // Tiers allocations
    mapping(uint8 => uint256) public tierAllocations;
    // Amount of tokens remaining w.r.t Tier
    mapping(uint8 => uint256) public tokensAvailableInTier;

    mapping(uint8 => uint256) public tierMaxAmountThatCanBeInvested;

    event Buy(address indexed _user, uint256 _amount, uint256 _tokenAmount);
    event Claim(address indexed _user, uint256 _amount);
    event Withdraw(address indexed _user, uint256 _amount);
    event EmergencyWithdraw(address indexed _user, uint256 _amount);
    event Burn(address indexed _burnAddress, uint256 _amount);

    modifier publicSaleActive() {
        require(
            (block.timestamp >= round1Start && block.timestamp <= round1End) ||
                (block.timestamp >= round2Start && block.timestamp <= round2End),
            "Public sale is not yet activated"
        );
        _;
    }

    modifier publicSaleEnded() {
        require((block.timestamp >= round2End || availableTokens == 0), "Public sale not yet ended");
        _;
    }

    modifier canClaim() {
        require(block.timestamp >= releaseTime, "Please wait until release time for claiming tokens");
        _;
    }

    /**
     * @dev Initialzes the TierIDO Pool contract
     * @param _token The ERC20 token contract address
     * @param _currency The curreny used for the IDO
     * @param _round1Start Timestamp of when round1 starts
     * @param _round1End Timestamp of when round1 ends
     * @param _round2Start Timestamp of when round2 starts
     * @param _round2End Timestamp of when round2 ends
     * @param _releaseTime Timestamp of when the token will be released
     * @param _price Price of the token for the IDO
     * @param _totalAmount The total amount for the IDO
     * @param _maxAmountThatCanBeInvestedInTier1 Max investment amount in tier1
     * @param _maxAmountThatCanBeInvestedInTier2 Max investment amount in tier2
     * @param _maxAmountThatCanBeInvestedInTier3 Max investment amount in tier3
     * @param _maxAmountThatCanBeInvestedInTier4 Max investment amount in tier4
     */
    //solhint-disable-next-line function-max-lines
    constructor(
        address _token,
        address _currency,
        uint256 _round1Start,
        uint256 _round1End,
        uint256 _round2Start,
        uint256 _round2End,
        uint256 _releaseTime,
        uint256 _price,
        uint256 _totalAmount,
        uint256 _maxAmountThatCanBeInvestedInTier1,
        uint256 _maxAmountThatCanBeInvestedInTier2,
        uint256 _maxAmountThatCanBeInvestedInTier3,
        uint256 _maxAmountThatCanBeInvestedInTier4
    ) public {
        require(_token != address(0), "Token address cannot be address zero");
        require(_currency != address(0), "Currency address cannot be address zero");
        require(_round1Start < _round1End, "Round1 start time > Round1 end time");
        require(_round1End <= _round2Start, "Round1 end time > Round2 start time");
        require(_round2Start < _round2End, "Round1 start time > Round2 end time");
        require(_totalAmount > 0, "Total amount must be > 0");

        token = IERC20(_token);
        currency = IERC20(_currency);
        round1Start = _round1Start;
        round1End = _round1End;
        round2Start = _round2Start;
        round2End = _round2End;
        releaseTime = _releaseTime;
        price = _price;
        totalAmount = _totalAmount;
        availableTokens = _totalAmount;

        tierMaxAmountThatCanBeInvested[1] = _maxAmountThatCanBeInvestedInTier1;
        tierMaxAmountThatCanBeInvested[2] = _maxAmountThatCanBeInvestedInTier2;
        tierMaxAmountThatCanBeInvested[3] = _maxAmountThatCanBeInvestedInTier3;
        tierMaxAmountThatCanBeInvested[4] = _maxAmountThatCanBeInvestedInTier4;
    }

    /**
     * @dev To buy tokens
     *
     * @param amount The amount of tokens to buy
     *
     * Requirements:
     * - can be invoked only when the public sale is active
     * - this call is non reentrant
     */

    function buy(uint256 amount) external publicSaleActive nonReentrant {
        require(availableTokens > 0, "All tokens were purchased");
        require(amount > 0, "Amount must be > 0");
        uint8 tier = getAddressTier(msg.sender);
        require(tier > 0, "You are not whitelisted");

        uint256 remainingAllocation = tokensAvailableInTier[tier];

        if (block.timestamp >= round2Start) {
            remainingAllocation = availableTokens;
        }

        require(amount <= remainingAllocation && amount <= availableTokens, "Not enough tokens to buy");

        Sale storage sale = sales[msg.sender];

        // If round 1 is running then we check maxInvest amount as per tier
        if (block.timestamp <= round1End) {
            uint256 maxPurchase = tierMaxAmountThatCanBeInvested[tier];
            require(amount <= maxPurchase.sub(sale.amount), "Buy exceeds amount");
            tokensAvailableInTier[tier] = tokensAvailableInTier[tier].sub(amount);
        }

        uint256 currencyAmount = amount.mul(price).div(1e18);

        require(currency.balanceOf(msg.sender) >= currencyAmount, "Insufficient currency balance of caller");

        availableTokens = availableTokens.sub(amount);

        currency.safeTransferFrom(msg.sender, address(this), currencyAmount);

        if (sale.amount == 0) {
            sales[msg.sender] = Sale(msg.sender, amount, false);
            numberParticipants += 1;
        } else {
            sales[msg.sender] = Sale(msg.sender, amount.add(sale.amount), false);
        }

        totalAmountSold = totalAmountSold.add(amount);
        investorInfo.push(Investor(msg.sender, amount));
        emit Buy(msg.sender, currencyAmount, amount);
    }

    /**
     * @dev To withdraw purchased tokens after release time
     *
     * Requirements:
     * - this call is non reentrant
     * - cannot claim within release time
     */
    function claimTokens() external canClaim nonReentrant {
        Sale storage sale = sales[msg.sender];
        require(!sale.tokensWithdrawn, "Already withdrawn");
        require(sale.amount > 0, "Only investors");
        sale.tokensWithdrawn = true;
        token.transfer(sale.investor, sale.amount);
        emit Claim(msg.sender, sale.amount);
    }

    /**
     * @dev To withdraw tokens after the sale ends and burns the remaining tokens
     *
     * Requirements:
     * - invocation can be done, only by the contract owner.
     * - the public sale must have ended
     * - this call is non reentrant
     */
    function withdraw() external onlyOwner publicSaleEnded nonReentrant {
        if (availableTokens > 0) {
            availableTokens = 0;
        }

        uint256 tokenBalance = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, tokenBalance);
        emit Withdraw(msg.sender, tokenBalance);
        uint256 currencyBalance = currency.balanceOf(address(this));
        currency.safeTransfer(msg.sender, currencyBalance);
        emit Withdraw(msg.sender, currencyBalance);
    }

    /**
     * @dev To withdraw in case of any possible hack/vulnerability
     *
     * Requirements:
     * - invocation can be done, only by the contract owner.
     * - this call is non reentrant
     */
    function emergencyWithdraw() external onlyOwner nonReentrant {
        if (availableTokens > 0) {
            availableTokens = 0;
        }

        uint256 tokenBalance = token.balanceOf(address(this));
        token.safeTransfer(msg.sender, tokenBalance);
        emit Withdraw(msg.sender, tokenBalance);
        uint256 currencyBalance = currency.balanceOf(address(this));
        currency.safeTransfer(msg.sender, currencyBalance);
        emit Withdraw(msg.sender, currencyBalance);
    }

    /**
     * @dev To set the platform token address
     *
     * Requirements:
     * - invocation can be done, only by the contract owner.
     */
    function setPlatformTokenAddress(address _platformToken) external onlyOwner returns (bool) {
        platformToken = IERC20(_platformToken);
        return true;
    }

    /**
     * @dev To get investor of the IDO
     * Returns array of investor addresses and their invested funds
     */
    function getInvestors() external view returns (address[] memory, uint256[] memory) {
        address[] memory addrs = new address[](numberParticipants);
        uint256[] memory funds = new uint256[](numberParticipants);

        for (uint256 i = 0; i < numberParticipants; i++) {
            Investor storage investor = investorInfo[i];
            addrs[i] = investor.investor;
            funds[i] = investor.amount;
        }

        return (addrs, funds);
    }

    /**
     * @dev To add users and tiers to the contract storage
     * @param _users An array of addresses
     */
    function addToPoolWhiteList(address[] memory _users, uint8 _tier) public onlyOwner returns (bool) {
        for (uint256 i = 0; i < _users.length; i++) {
            if (poolWhiteList[_users[i]] != true) {
                poolWhiteList[_users[i]] = true;
                addressBelongsToTier[_users[i]] = _tier;
                listWhitelists.push(address(_users[i]));
            }
        }
        return true;
    }

    /**
     * @dev To add users and tiers to the contract storage
     * @param _tiersAllocation An array of tiers
     */
    function setTierInfo(uint256[] memory _tiersAllocation) public onlyOwner returns (bool) {
        for (uint8 i = 0; i < _tiersAllocation.length; i++) {
            require(_tiersAllocation[i] > 0, "Tier allocation amount must be > 0");
            // Since we have named Tier1, Tier2, Tier3 & Tier4
            tierAllocations[i + 1] = _tiersAllocation[i];
            tokensAvailableInTier[i + 1] = _tiersAllocation[i];
        }
        return true;
    }

    /**
     * @dev To get the whitelisted addresses
     */
    function getPoolWhiteLists() public view returns (address[] memory) {
        return listWhitelists;
    }

    /**
     * @dev To get user tier
     */
    function getAddressTier(address _user) public view returns (uint8) {
        return addressBelongsToTier[_user];
    }
}
