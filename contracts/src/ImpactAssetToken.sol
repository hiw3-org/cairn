// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract ImpactAssetToken is ERC721, Ownable {
    uint256 private _nextTokenId = 1;

    // Mapping to store allowed minters
    mapping(address => bool) public allowedMinters;
    
    // Events
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event TokenMinted(address indexed to, uint256 indexed tokenId);

    constructor(
        string memory name, 
        string memory symbol, 
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(symbol).length > 0, "Symbol cannot be empty");
        require(initialOwner != address(0), "Invalid initial owner");
    }

    // Function to add an address to the allow list, callable only by owner
    function addAllowedMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        require(!allowedMinters[minter], "Minter already allowed");
        
        allowedMinters[minter] = true;
        emit MinterAdded(minter);
    }

    // Function to remove an address from the allow list, callable only by owner
    function removeAllowedMinter(address minter) external onlyOwner {
        require(minter != address(0), "Invalid minter address");
        require(allowedMinters[minter], "Minter not in allow list");
        
        allowedMinters[minter] = false;
        emit MinterRemoved(minter);
    }

    // Mint function callable by allowed minters only
    function mint(address to) external {
        require(allowedMinters[msg.sender], "Not allowed to mint");
        require(to != address(0), "Cannot mint to zero address");
        
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        _safeMint(to, tokenId);
        
        emit TokenMinted(to, tokenId);
    }

    // Function to check if an address is an allowed minter
    function isAllowedMinter(address minter) external view returns (bool) {
        return allowedMinters[minter];
    }

    // Function to get the next token ID that will be minted
    function getNextTokenId() external view returns (uint256) {
        return _nextTokenId;
    }

    // Function to get total supply of tokens
    function totalSupply() external view returns (uint256) {
        return _nextTokenId - 1;
    }
}
