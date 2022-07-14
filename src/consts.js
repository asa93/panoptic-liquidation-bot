const ethers = require("ethers");

module.exports = {
  MIN_ETH_BALANCE: ethers.utils.parseEther("0.001"),
  CRON_SCHEDULE: "*/3 * * * * *",
};
