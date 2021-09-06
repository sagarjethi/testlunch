// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Currency is ERC20 {
    /**
     * @dev Sets the values for {name = Currecny}, {fixedSupply = 1 Million} and {symbol = CUR}.
     *
     * All of these values are immutable: they can only be set once during
     * construction.
     */
    constructor() public ERC20("Currency", "CUR") {
        uint256 fixedSupply = 1e6 * 10**18; // Since 18 is the number of decimals
        super._mint(msg.sender, fixedSupply); // Since Total supply 1 Million
    }

    /**
     * @dev Contract might receive/hold ETH as part of the maintenance process.
     * The receive function is executed on a call to the contract with empty calldata.
     */
    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    fallback() external payable {}

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply.
     */
    function burn(uint256 amount) public {
        _burn(msg.sender, amount);
    }
}
