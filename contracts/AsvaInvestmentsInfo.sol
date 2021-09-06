// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title AsvaInvestmentsInfo
/// @notice AsvaInvestmentsInfo gives infromation regarding  IDO contract which is launch by ASVAFACTORY contract.
/// Ref: https://testnet.bscscan.com/address/0x3109bf9e73f50209Cf92D2459B5Da0E38D8890C1#code
contract AsvaInvestmentsInfo is Ownable {
    address[] private presaleAddresses;

    mapping(address => bool) public alreadyAdded;
    mapping(uint256 => address) public presaleAddressByProjectID;

    /**
     * @dev To add presale address
     *
     * Requirements:
     * - presale address cannot be address zero.
     * - presale should not be already added
     */
    function addPresaleAddress(address _presale, uint256 _presaleProjectID) external returns (uint256) {
        require(_presale != address(0), "Address cannot be a zero address");
        require(!alreadyAdded[_presale], "Address already added");

        presaleAddresses.push(_presale);
        alreadyAdded[_presale] = true;
        presaleAddressByProjectID[_presaleProjectID] = _presale;
        return presaleAddresses.length - 1;
    }

    /**
     * @dev To return presale counts
     */
    function getPresalesCount() external view returns (uint256) {
        return presaleAddresses.length;
    }

    /**
     * @dev To get presale contract address by DB id
     */
    function getPresaleAddressByDbId(uint256 asvaDbId) external view returns (address) {
        return presaleAddressByProjectID[asvaDbId];
    }

    /**
     * @dev To get presale contract address by asvaId
     *
     * Requirements:
     * - asvaId must be a valid id
     */
    function getPresaleAddress(uint256 asvaId) external view returns (address) {
        require(validAsvaId(asvaId), "Not a valid Id");
        return presaleAddresses[asvaId];
    }

    /**
     * @dev To get valid asva Id's
     */
    function validAsvaId(uint256 asvaId) public view returns (bool) {
        if (asvaId >= 0 && asvaId <= presaleAddresses.length - 1) return true;
    }
}
