// SPDX-License-Identifier: CC0-1.0

pragma solidity ^0.8.0;

import './Ownable.sol';
import './Structures.sol';

contract Config is Ownable, Structures {
    uint256 constant REGISTRATION_BOND = 10 wei; // TODO owner can update
    uint256 constant BLOCK_STAKE = 1 wei;
    uint256 constant ROTATE_PROPOSER_BLOCKS = 4;
    uint256 constant COOLING_OFF_PERIOD = 1 weeks;
    bytes32 constant ZERO = bytes32(0);
    uint256 constant TXHASH_TREE_HEIGHT = 5;

    address bootProposer;
    address bootChallenger;
    address maticAddress;
    mapping(address => uint256[2]) erc20limit;

    function initialize() public virtual override initializer {
        Ownable.initialize();
    }

    // restricting proposers
    modifier onlyBootProposer() {
        require(msg.sender == bootProposer, 'You are not the boot proposer');
        _;
    }

    function setBootProposer(address proposer) external onlyOwner {
        bootProposer = proposer;
        emit NewBootProposerSet(bootProposer);
    }

    function getBootProposer() external view returns (address) {
        return bootProposer;
    }

    // restricting challengers
    modifier onlyBootChallenger() {
        require(msg.sender == bootChallenger, 'You are not the boot challenger');
        _;
    }

    function setBootChallenger(address challenger) external onlyOwner {
        bootChallenger = challenger;
        emit NewBootChallengerSet(bootChallenger);
    }

    function getBootChallenger() external view returns (address) {
        return bootChallenger;
    }

    //Set payments address
    function setMaticAddress(address _maticAddress) external onlyOwner {
        maticAddress = _maticAddress;
    }

    function getMaticAddress() public view returns (address) {
        return maticAddress;
    }

    // restricting tokens
    // 0 for deposit and 1 for withdraw
    function getRestriction(address tokenAddr, uint256 transactionType)
        public
        view
        returns (uint256)
    {
        return erc20limit[tokenAddr][transactionType];
    }

    function setRestriction(
        address tokenAddr,
        uint256 depositAmount,
        uint256 withdrawAmount
    ) external onlyOwner {
        erc20limit[tokenAddr][0] = depositAmount;
        erc20limit[tokenAddr][1] = withdrawAmount;
    }

    function removeRestriction(address tokenAddr) external onlyOwner {
        delete erc20limit[tokenAddr][0];
        delete erc20limit[tokenAddr][1];
    }
}
