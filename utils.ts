import fs from "fs/promises";
import cli from "cli";
import { Presets, SingleBar } from "cli-progress";
import { formatUnits, JsonRpcProvider } from "ethers";
import { L1_RPC_URL, MAX_GAS_GWEI, TX_SCAN } from "./constants";

const provider = new JsonRpcProvider(L1_RPC_URL);

export async function loadFromFile(fileName: string) {
  const file = await fs.readFile(fileName, { encoding: "utf-8" });

  return file.split("\n").map((item) => item.trim()).filter(Boolean);
}

export async function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export const delayProgress = (seconds: number) => {
  if (seconds === 0) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve) => {
    const bar = new SingleBar({
      format: "Delay [{bar}] {value}/{total}",
    }, Presets.shades_classic);

    bar.start(seconds, 0);
    let counter = 0;

    const timer = setInterval(() => {
      counter = counter + 1;
      bar.update(counter);
      if (counter === seconds) {
        clearInterval(timer);
        bar.stop();
        resolve();
      }
    }, 1000);
  });
};

export function getTxLink(txHash: string) {
  const url = TX_SCAN;
  return `${url}${txHash}`;
}

async function getBaseGas() {
  const { gasPrice } = await provider.getFeeData();
  return formatUnits(gasPrice!, "gwei");
}

export async function waitGas() {
  while (true) {
    const gas = parseInt(await getBaseGas());

    cli.spinner(`L1 gas: ${gas}`, true);

    if (gas > MAX_GAS_GWEI) {
      cli.spinner(
        `Gas price is higher than ${MAX_GAS_GWEI} GWEI, waiting 15 seconds`,
      );
      await delay(15);
    } else {
      break;
    }
  }
}
