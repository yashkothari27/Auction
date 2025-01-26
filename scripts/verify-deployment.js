const { ethers } = require("hardhat");

async function main() {
    try {
        // Get the contract factory
        const AuctionSystem = await ethers.getContractFactory("AuctionSystem");
        
        // Deploy the contract
        console.log("Deploying AuctionSystem...");
        const auction = await AuctionSystem.deploy();
        await auction.deployed();
        
        console.log("AuctionSystem deployed to:", auction.address);
        
        // Verify the deployment
        console.log("\nVerifying deployment...");
        const deployedCode = await ethers.provider.getCode(auction.address);
        if (deployedCode === "0x") {
            console.error("Contract deployment failed - no code at address");
        } else {
            console.log("Contract successfully deployed and verified!");
            
            // Try to call getAllAuctions to verify the function
            const auctionCount = await auction.auctionCounter();
            console.log("Initial auction counter:", auctionCount.toString());
            
            // Create a test auction
            const tx = await auction.createAuction(
                "Test Auction",
                "Test Description",
                3600 // 1 hour duration
            );
            await tx.wait();
            console.log("Test auction created successfully");
            
            const allAuctions = await auction.getAllAuctions();
            console.log("getAllAuctions result:", allAuctions);
        }
    } catch (error) {
        console.error("Deployment error:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 