require("@nomiclabs/hardhat-waffle");
require("dotenv").config();

// Add your private key to .env file
const PRIVATE_KEY = process.env.PRIVATE_KEY;

module.exports = {
  solidity: "0.8.0",
  networks: {
    rtc: {
      url: "https://mainnet.reltime.com",
      chainId: 32323,
      accounts: [`0x${PRIVATE_KEY}`]
    }
  }
}; 