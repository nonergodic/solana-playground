import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  VersionedTransaction,
  sendAndConfirmTransaction,
  VersionedMessage,
} from "@solana/web3.js";

import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
} from "@solana/spl-token";

import "./utils";

const CLUSTERS = {
  Mainnet: "https://api.mainnet-beta.solana.com",
  Testnet: "https://api.devnet.solana.com",
  Devnet: "http://localhost:8899",
} as const;

const network = "Testnet" as const;

async function main() {
  //...
}

main().then(
  () => {
    console.log('completed successfully');
    process.exit();
  },
  err => {
    console.error("failed with error:")
    console.error(err);
    process.exit(-1);
  },
);
