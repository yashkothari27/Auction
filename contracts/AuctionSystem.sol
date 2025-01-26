// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AuctionSystem {
    struct Auction {
        uint256 id;
        address owner;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool isEnded;
        address acceptedBidder;
        uint256 acceptedBidAmount;
    }

    struct Bid {
        uint256 id;
        uint256 auctionId;
        address bidder;
        uint256 amount;
        bool isAccepted;
        bool isPaid;
    }

    mapping(uint256 => Auction) public auctions;
    mapping(uint256 => Bid[]) public auctionBids;
    mapping(address => uint256[]) public userAuctions;
    mapping(address => uint256[]) public userBids;

    uint256 public auctionCounter;
    uint256 public bidCounter;

    event AuctionCreated(uint256 indexed auctionId, address indexed owner);
    event BidPlaced(uint256 indexed auctionId, uint256 indexed bidId, address indexed bidder);
    event BidAccepted(uint256 indexed auctionId, uint256 indexed bidId);
    event AuctionEnded(uint256 indexed auctionId);
    event BidPaid(uint256 indexed auctionId, uint256 indexed bidId);

    modifier onlyAuctionOwner(uint256 _auctionId) {
        require(auctions[_auctionId].owner == msg.sender, "Not auction owner");
        _;
    }

    modifier auctionExists(uint256 _auctionId) {
        require(_auctionId <= auctionCounter, "Auction does not exist");
        _;
    }

    modifier auctionActive(uint256 _auctionId) {
        require(auctions[_auctionId].isActive, "Auction not active");
        require(!auctions[_auctionId].isEnded, "Auction ended");
        require(block.timestamp <= auctions[_auctionId].endTime, "Auction expired");
        _;
    }

    function createAuction(
        string memory _title,
        string memory _description,
        uint256 _duration
    ) external returns (uint256) {
        require(_duration > 0, "Duration must be positive");
        
        auctionCounter++;
        
        Auction storage newAuction = auctions[auctionCounter];
        newAuction.id = auctionCounter;
        newAuction.owner = msg.sender;
        newAuction.title = _title;
        newAuction.description = _description;
        newAuction.startTime = block.timestamp;
        newAuction.endTime = block.timestamp + _duration;
        newAuction.isActive = true;
        newAuction.isEnded = false;

        userAuctions[msg.sender].push(auctionCounter);
        
        emit AuctionCreated(auctionCounter, msg.sender);
        return auctionCounter;
    }

    function placeBid(uint256 _auctionId) external payable auctionExists(_auctionId) auctionActive(_auctionId) {
        require(msg.value > 0, "Bid amount must be positive");
        require(auctions[_auctionId].owner != msg.sender, "Owner cannot bid");

        bidCounter++;
        
        Bid memory newBid = Bid({
            id: bidCounter,
            auctionId: _auctionId,
            bidder: msg.sender,
            amount: msg.value,
            isAccepted: false,
            isPaid: false
        });

        auctionBids[_auctionId].push(newBid);
        userBids[msg.sender].push(bidCounter);
        
        emit BidPlaced(_auctionId, bidCounter, msg.sender);
    }

    function acceptBid(uint256 _auctionId, uint256 _bidId) 
        external 
        auctionExists(_auctionId) 
        onlyAuctionOwner(_auctionId) 
    {
        require(!auctions[_auctionId].isEnded, "Auction already ended");
        
        Bid[] storage bids = auctionBids[_auctionId];
        uint256 bidIndex;
        bool bidFound = false;
        
        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].id == _bidId) {
                bidIndex = i;
                bidFound = true;
                break;
            }
        }
        
        require(bidFound, "Bid not found");
        require(!bids[bidIndex].isAccepted, "Bid already accepted");

        bids[bidIndex].isAccepted = true;
        auctions[_auctionId].acceptedBidder = bids[bidIndex].bidder;
        auctions[_auctionId].acceptedBidAmount = bids[bidIndex].amount;
        
        emit BidAccepted(_auctionId, _bidId);
    }

    function endAuction(uint256 _auctionId) 
        external 
        auctionExists(_auctionId) 
        onlyAuctionOwner(_auctionId) 
    {
        require(!auctions[_auctionId].isEnded, "Auction already ended");
        require(auctions[_auctionId].acceptedBidder != address(0), "No bid accepted");
        
        auctions[_auctionId].isEnded = true;
        auctions[_auctionId].isActive = false;
        
        emit AuctionEnded(_auctionId);
    }

    function payBid(uint256 _auctionId) 
        external 
        payable 
        auctionExists(_auctionId) 
    {
        Auction storage auction = auctions[_auctionId];
        require(auction.isEnded, "Auction not ended");
        require(auction.acceptedBidder == msg.sender, "Not accepted bidder");
        require(msg.value == auction.acceptedBidAmount, "Incorrect payment amount");

        Bid[] storage bids = auctionBids[_auctionId];
        for (uint256 i = 0; i < bids.length; i++) {
            if (bids[i].bidder == msg.sender && bids[i].isAccepted) {
                require(!bids[i].isPaid, "Bid already paid");
                bids[i].isPaid = true;
                payable(auction.owner).transfer(msg.value);
                emit BidPaid(_auctionId, bids[i].id);
                return;
            }
        }
        
        revert("Accepted bid not found");
    }

    function getAuctionBids(uint256 _auctionId) external view returns (Bid[] memory) {
        return auctionBids[_auctionId];
    }

    function getUserAuctions(address _user) external view returns (uint256[] memory) {
        return userAuctions[_user];
    }

    function getUserBids(address _user) external view returns (uint256[] memory) {
        return userBids[_user];
    }

    function getAllAuctions() external view returns (uint256[] memory) {
        uint256[] memory allAuctions = new uint256[](auctionCounter);
        for(uint256 i = 1; i <= auctionCounter; i++) {
            allAuctions[i-1] = i;
        }
        return allAuctions;
    }
} 