import cli from "cli";
import { Wallet } from "ethers";
import random from "lodash/random";
import shuffle from "lodash/shuffle";
import {
  DELAY_FROM_SEC,
  DELAY_TO_SEC,
  KEYS_FILENAME,
  SHUFFLE_KEYS,
} from "./constants";
import { getPurchaseData, mint } from "./mint";
import { delayProgress, loadFromFile, waitGas } from "./utils";

let keys = await loadFromFile(KEYS_FILENAME);

if (SHUFFLE_KEYS) {
  keys = shuffle(keys);
}

for (const key of keys) {
  const { address } = new Wallet(key);
  console.log(`===== Address: ${address} ======`);

  try {
    await waitGas();
    const data = await getPurchaseData(address);

    if (data.error?.status === "422") {
      console.log("Address not eligible for community mint");
      continue;
    }

    await mint(key, data);
  } catch (e) {
    cli.spinner("", true);
    if (e.message.includes('action="estimateGas"')) {
      console.log("Can't estimateGas (it was probably minted recently)");
    } else {
      console.log("Error:", e.message);
    }
  }

  const delayTimeout = random(DELAY_FROM_SEC, DELAY_TO_SEC);
  await delayProgress(delayTimeout);
}
