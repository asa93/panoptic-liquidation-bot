#!/usr/bin/env node
require("dotenv").config();
const cron = require("node-cron");
const { Command } = require("commander");
const ethers = require("ethers");
const { connectWallet, getPools, getPositions, getHealth } = require("./utils");
const consts = require("./consts");
const chalk = require("chalk");

//GET CONTRACT INFO
const panopticAbi = require("../contracts/PanopticPool.sol/PanopticPool.json");

var provider = new ethers.providers.JsonRpcProvider(process.env.NODE_URL);

const panopticPool = new ethers.Contract(
  process.env.PANOPTIC_POOL_ADDRESS,
  panopticAbi.abi,
  provider
);

//CLI COMMANDS
const program = new Command();
program
  .name("panoptic-liquidation-bot")
  .description(
    `panopticbot cli allows to run and monitor panoptic liquidation bot.
    `
  )
  .version("0.0.1");

program
  .command("balance")
  .description("Display liquidator bot address & balance")
  .action(async (str, options) => {
    const wallet = await connectWallet(process.env.PRIVATE_KEY);
    const balance = await provider.getBalance(wallet.address);

    console.log("------------------");
    console.log("-Address:", wallet.address);
    console.log(`-Balance:  ${balance.toString()} ETH `);

    if (balance < consts.MIN_ETH_BALANCE)
      console.log(chalk.yellow.bold("Balance too low to run liquidator bot."));
  });

program
  .command("start")
  .description("Start liquidator bot")
  .action(async (str, options) => {
    const wallet = await connectWallet(process.env.PRIVATE_KEY);
    const balance = await provider.getBalance(wallet.address);

    console.log(chalk.green.bold(" Liquidator bot running ✔️"));

    var task = cron.schedule(consts.CRON_SCHEDULE, async () => {
      if (balance < consts.MIN_ETH_BALANCE)
        console.log(
          chalk.yellow.bold("Balance too low to run liquidator bot.")
        );

      console.error("Polling PanopticPool for unhealthy positions...");
      try {
        //add liquidation process here
        const positions = await getPositions();
        console.log(`Found ${positions.length} positions`);

        for (let i = 0; i < positions.length; i++) {
          const position = positions[i];

          await healthCheck(position.tokenId);

          const test = await panopticPool.pool();

          //force exercise if conditions are met
        }
      } catch (e) {
        console.log(chalk.red.bold(`[ERROR] ${e.toString()}`));
        console.log("Exiting CRON task.");
        task.stop();
      }
    });

    task.start();
  });

program
  .command("info")
  .description("Display general protocol info")
  .action(async (str, options) => {
    const wallet = await connectWallet(process.env.PRIVATE_KEY);
    const test = await panopticPool.pool();

    console.log(`
    -network name : ${provider.network.name}  
    -chainId : ${provider.network.chainId}
 
    `);
  });

program
  .command("pools")
  .description("Query list of pools agains subgraph")
  .action(async (str, options) => {
    const data = await getPools();
    console.log(data);
  });

program
  .command("positions")
  .description("Query list of token positions agains subgraph")
  .action(async (str, options) => {
    const data = await getPositions();
    console.log(data);
  });

program
  .command("health")
  .description("Query list of token positions agains subgraph")
  .action(async (str, options) => {
    const status = await getHealth();
    console.log("status", status);
  });

program.parse();
