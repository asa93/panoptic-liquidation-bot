const ethers = require("ethers");
require("dotenv").config();

module.exports.connectWallet = async function (pKey) {
  let wallet = await new ethers.Wallet(pKey);
  return wallet;
};

module.exports.liquidate = async function (wallet, panopticPool) {
  //panopticPool.connect(wallet).liquidate();
};

module.exports.getUnhealthy = async function (wallet, panopticPool) {
  //panopticPool.connect(wallet).liquidate();
};
