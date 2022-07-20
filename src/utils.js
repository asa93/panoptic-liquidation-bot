const { default: axios } = require("axios");
const ethers = require("ethers");
require("dotenv").config();

const panopticHealthAbi = require("../contracts/libraries/PanopticHealth.sol/PanopticHealth.json");
const uniswapV3PoolAbi = require("../contracts/mocks/MockUniswapV3Pool.sol/MockUniswapV3Pool.json");
const panopticAbi = require("../contracts/PanopticPool.sol/PanopticPool.json");
const erc20 = require("../contracts/mocks/MockToken.sol/Token.json");

var provider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL);
const panopticHealth = new ethers.Contract(
  process.env.PANOPTIC_HEALH_ADDRESS,
  panopticHealthAbi.abi,
  provider
);
const panopticPool = new ethers.Contract(
  process.env.PANOPTIC_POOL_ADDRESS,
  panopticAbi.abi,
  provider
);

module.exports.connectWallet = async function (pKey) {
  let wallet = await new ethers.Wallet(pKey);
  return wallet;
};

module.exports.getPools = async function (wallet, panopticPool) {
  return await axios
    .post(process.env.GRAPH_NODE, {
      query: `query MyQuery { 
              panopticPools(first: 10) { 
              poolAddress 
              } }`,
      variables: null,
      operationName: "MyQuery",
      extensions: { headers: null },
    })
    .then((result) => {
      return result.data.data.panopticPools;
    })
    .catch((e) => {
      console.log("[ERROR]", e.toString());
    });
};

module.exports.getPositions = async function (wallet, panopticPool) {
  return await axios
    .post(process.env.GRAPH_NODE, {
      query: `query MyQuery {
        tokenPositions {
          tokenId
          position
        }
      }`,
      variables: null,
      operationName: "MyQuery",
      extensions: { headers: null },
    })
    .then((result) => {
      return result.data.data.tokenPositions;
    })
    .catch((e) => {
      console.log("[ERROR]", e.toString());
    });
};

module.exports.getHealth = async function (
  tokenId = "212922289611937393930017746750408668751",
  numberOfContracts = "1000000000000000000",
  userAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
) {
  // call token id : 42783768059274734303184140182517364303n
  // numberOfContracts 10000000
  // tick 195016

  let status;

  const uniPool = new ethers.Contract(
    await panopticPool.pool(),
    uniswapV3PoolAbi.abi,
    provider
  );

  const { tick } = await uniPool.slot0();

  const required = await panopticHealth.getPositionCollateralAtTick(
    tokenId,
    numberOfContracts,
    await uniPool.tickSpacing(),
    tick
  );

  const recipientToken0 = new ethers.Contract(
    await panopticPool.receiptToken1(),
    erc20.abi,
    provider
  );

  const recipientToken1 = new ethers.Contract(
    await panopticPool.receiptToken1(),
    erc20.abi,
    provider
  );

  //need user address
  const token0Balance = await recipientToken0.balanceOf(userAddress);
  const token1Balance = await recipientToken1.balanceOf(userAddress);

  const status0 = await getStatus(token0Balance, required.token0Required);
  const status1 = await getStatus(token1Balance, required.token1Required);

  return { token0: status0, token1: status1 };
};

async function getStatus(balance, required) {
  const decimals = await panopticHealth.DECIMALS();
  const COLLATERAL_MARGIN_RATIO =
    await panopticHealth.COLLATERAL_MARGIN_RATIO();

  let status;
  if (balance.gte(required)) {
    status = "HEALTHY";
  } else if (balance.gte(required.mul(COLLATERAL_MARGIN_RATIO).div(decimals))) {
    status = "MARGIN_CALLED";
  } else {
    status = "UNDERWATER";
  }
  return status;
}

module.exports.decodeID = async function (tokenId) {
  const poolId = tokenId & ((BigInt("1") << BigInt("80")) - BigInt("1"));

  return poolId.toString(16);
};

module.exports.getPoolFromId = async function (poolId) {
  return (await module.exports.getPools()).filter(async (pool, i) => {
    const { poolAddress } = pool;

    const panopticPool = new ethers.Contract(
      process.env.PANOPTIC_POOL_ADDRESS,
      panopticAbi.abi,
      provider
    );

    const unipoolAddress = await panopticPool.pool();
  })[0];
};
