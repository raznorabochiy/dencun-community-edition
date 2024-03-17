import cli from "cli";
import { Contract, JsonRpcProvider, Wallet } from "ethers";
import fetch from "node-fetch";
import { HttpsProxyAgent } from "https-proxy-agent";
import { getTxLink, loadFromFile } from "./utils";
import {
  CONTRACT_ABI,
  CONTRACT_ADDRESS,
  PROXY_FILENAME,
  PURCHASE_URL,
  RPC_URL,
} from "./constants";
import { PurchaseDataResponse } from "./types";

const provider = new JsonRpcProvider(RPC_URL);
const [proxy] = await loadFromFile(PROXY_FILENAME);
const agent = proxy ? new HttpsProxyAgent(`http://${proxy}`) : undefined;

export async function getPurchaseData(address: string) {
  const response = await fetch(PURCHASE_URL, {
    headers: {
      "accept": "*/*",
      "accept-language": "ru-RU,ru;q=0.9",
      "content-type": "application/json",
      "sec-ch-ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Brave";v="122"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"macOS"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "sec-gpc": "1",
      "Referer": "https://app.phosphor.xyz/",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    },
    body:
      `{"buyer":{"eth_address":"${address}"},"listing_id":"717d7853-49e0-4f71-b351-50900c0a143e","provider":"MINT_VOUCHER","quantity":1}`,
    method: "POST",
    agent,
  });

  const data = await response.json() as PurchaseDataResponse;
  return data;
}

export async function mint(key: string, data: PurchaseDataResponse) {
  const wallet = new Wallet(key, provider);
  const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);

  if (!data.data) {
    console.log("Mint data is empty");
    return;
  }

  const txArgs = [
    [
      data.data.voucher.currency,
      data.data.voucher.initial_recipient,
      parseInt(data.data.voucher.initial_recipient_amount),
      data.data.voucher.quantity,
      data.data.voucher.nonce,
      data.data.voucher.expiry,
      parseInt(data.data.voucher.price),
      parseInt(data.data.voucher.token_id),
      data.data.voucher.net_recipient,
    ],
    data.data.signature,
  ];

  const gasLimit = await contract.mintWithVoucher.estimateGas(...txArgs);

  const unsignedTx = await contract.mintWithVoucher.populateTransaction(
    ...txArgs,
  );

  const { maxFeePerGas, maxPriorityFeePerGas } = await provider.getFeeData();

  cli.spinner("Send transaction");

  const tx = await wallet.sendTransaction({
    ...unsignedTx,
    gasLimit,
    maxFeePerGas,
    maxPriorityFeePerGas,
  });

  await provider.waitForTransaction(tx.hash);

  cli.spinner(getTxLink(tx.hash), true);
}
