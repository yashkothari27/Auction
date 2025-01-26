const { ethers } = require("hardhat");

async function main() {
    const AuctionSystem = await ethers.getContractFactory("AuctionSystem");
    console.log("Deploying AuctionSystem...");
    const auction = await AuctionSystem.deploy();
    await auction.deployed();
    console.log("AuctionSystem deployed to:", auction.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 