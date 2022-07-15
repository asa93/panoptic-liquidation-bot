const { default: axios } = require("axios");
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

module.exports.getPools = async function (wallet, panopticPool) {
  return await axios
    .post(process.env.GRAPH_NODE, {
      query: `query MyQuery {\n
              panopticPools(first: 10) {\n
              poolAddress\n
              }\n}`,
      variables: null,
      operationName: "MyQuery",
      extensions: { headers: null },
    })
    .then((result) => {
      return result.data.data;
    })
    .catch((e) => {
      console.log("[ERROR]", e.toString());
    });
};
