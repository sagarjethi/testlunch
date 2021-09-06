// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TierIDOPool.sol";
import "./AsvaInvestmentsInfo.sol";

/// @title AsavaPoolFactory
/// @notice Factory contract to create PreSale
/// Useful for launching new NewIDO https://testnet.bscscan.com/address/0xe6d8d1bd5B3f514D4Bba82347e9864a0491cbF73#code
contract AsavaPoolFactory is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    /**
     * @dev Struct to store the IDO Pool Information
     * @param contractAddr The contract address
     * @param currency The curreny used for the IDO
     * @param token The ERC20 token contract address
     */
    struct IDOPoolInfo {
        address contractAddr;
        address currency;
        address token;
    }

    /**
     * @dev Struct to store IDO Information
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
     * @param _presaleProjectID The PreSale project ID
     * @param _whitelistedAddressesTier1 An array of whitelist addresses for tier1
     * @param _whitelistedAddressesTier2 An array of whitelist addresses for tier2
     * @param _whitelistedAddressesTier3 An array of whitelist addresses for tier3
     * @param _whitelistedAddressesTier4 An array of whitelist addresses for tier4
     * @param _tiersAllocation An array of amounts as per tiers
     */
    struct IDOInfo {
        address _token;
        address _currency;
        uint256 _round1Start;
        uint256 _round1End;
        uint256 _round2Start;
        uint256 _round2End;
        uint256 _releaseTime;
        uint256 _price;
        uint256 _totalAmount;
        uint256 _maxAmountThatCanBeInvestedInTier1;
        uint256 _maxAmountThatCanBeInvestedInTier2;
        uint256 _maxAmountThatCanBeInvestedInTier3;
        uint256 _maxAmountThatCanBeInvestedInTier4;
        uint256 _presaleProjectID;
        address[] _whitelistedAddressesTier1;
        address[] _whitelistedAddressesTier2;
        address[] _whitelistedAddressesTier3;
        address[] _whitelistedAddressesTier4;
        uint256[] _tiersAllocation;
    }

    uint256 public nextPoolId;
    IDOPoolInfo[] public poolList;

    //solhint-disable-next-line var-name-mixedcase
    AsvaInvestmentsInfo public immutable AsvaInfo;

    IERC20 public platformToken; // Platform token

    event PoolCreated(
        uint256 indexed asvaId,
        uint256 presaleDbID,
        address indexed _token,
        address indexed _currency,
        address pool,
        address creator
    );

    /**
     * @dev Sets the values for {_asvaInfoAddress, _platformToken}
     *
     * All two of these values are immutable: they can only be set once during construction.
     */
    constructor(address _asvaInfoAddress, address _platformToken) public {
        AsvaInfo = AsvaInvestmentsInfo(_asvaInfoAddress);
        platformToken = IERC20(_platformToken);
    }

    /**
     * @dev To create a pool
     *
     * Requirements:
     * - poolinfo token & currency cannot be the same
     * - poolinfo token cannot be address zero
     * - poolinfo currency cannot be address zero
     */
    //solhint-disable-next-line function-max-lines
    function createPoolPublic(IDOInfo calldata poolInfo) external onlyOwner {
        require(poolInfo._token != poolInfo._currency, "Currency and Token can not be the same");
        require(poolInfo._token != address(0), "PoolInfo token cannot be address zero");
        require(poolInfo._currency != address(0), "PoolInfo currency cannot be address zero");

        // AsvaInvestmentsPresale presale = new AsvaInvestmentsPresale(address(this), AsvaInfo.owner());
        IERC20 tokenIDO = IERC20(poolInfo._token);

        TierIDOPool _idoPool = new TierIDOPool(
            poolInfo._token,
            poolInfo._currency,
            poolInfo._round1Start,
            poolInfo._round1End,
            poolInfo._round2Start,
            poolInfo._round2End,
            poolInfo._releaseTime,
            poolInfo._price,
            poolInfo._totalAmount,
            poolInfo._maxAmountThatCanBeInvestedInTier1,
            poolInfo._maxAmountThatCanBeInvestedInTier2,
            poolInfo._maxAmountThatCanBeInvestedInTier3,
            poolInfo._maxAmountThatCanBeInvestedInTier4
        );

        tokenIDO.transferFrom(msg.sender, address(_idoPool), poolInfo._totalAmount);

        poolList.push(IDOPoolInfo(address(_idoPool), poolInfo._currency, poolInfo._token));

        uint256 asvaId = AsvaInfo.addPresaleAddress(address(_idoPool), poolInfo._presaleProjectID);

        _idoPool.setPlatformTokenAddress(address(platformToken));

        initializeWhitelistedAddresses(_idoPool, poolInfo._whitelistedAddressesTier1, 1);
        initializeWhitelistedAddresses(_idoPool, poolInfo._whitelistedAddressesTier2, 2);
        initializeWhitelistedAddresses(_idoPool, poolInfo._whitelistedAddressesTier3, 3);
        initializeWhitelistedAddresses(_idoPool, poolInfo._whitelistedAddressesTier4, 4);

        setIDOTierInfo(_idoPool, poolInfo._tiersAllocation);

        emit PoolCreated(
            asvaId,
            poolInfo._presaleProjectID,
            poolInfo._token,
            poolInfo._currency,
            address(_idoPool),
            msg.sender
        );
    }

    /**
     * @dev To set tier information in IDO contract
     * @param _pool The TierIDOPool contract object
     * @param _tiersAllocation An array of tiers allocation
     */
    function setIDOTierInfo(TierIDOPool _pool, uint256[] calldata _tiersAllocation) internal {
        _pool.setTierInfo(_tiersAllocation);
    }

    /**
     * @dev To initialize whitelsited addresses
     * @param _pool The TierIDOPool contract object
     * @param _whitelistedAddresses An array of addresses
     * @param _tier Tier to which the addresses belong
     */
    function initializeWhitelistedAddresses(
        TierIDOPool _pool,
        address[] calldata _whitelistedAddresses,
        uint8 _tier
    ) internal {
        _pool.addToPoolWhiteList(_whitelistedAddresses, _tier);
    }
}
