import assert from "assert";
import { web3 } from "@coral-xyz/anchor-29";
import {
  convertWhGovernanceSolanaPayloadToInstruction,
  getUpgradeInstruction,
} from "../../src";
import { FailedTransactionMetadata, LiteSVM, TransactionMetadata } from "litesvm";
import path from "path";

const TRANSFER_MINT_AUTHORITY_PAYLOAD = Buffer.from(([
  0, 0, 0, 0, 0, 0, 0, 0, 71, 101, 110, 101, 114, 97, 108, 80, 117, 114, 112, 
  111, 115, 101, 71, 111, 118, 101, 114, 110, 97, 110, 99, 101, 2, 0, 1, 6, 
  116, 45, 124, 165, 35, 160, 58, 170, 254, 72, 171, 171, 2, 228, 126, 184, 
  174, 245, 52, 21, 203, 96, 60, 71, 163, 204, 248, 100, 216, 109, 192, 6, 
  133, 111, 67, 171, 244, 170, 164, 162, 107, 50, 174, 142, 164, 203, 143, 
  173, 200, 224, 45, 38, 119, 3, 251, 213, 249, 218, 216, 95, 109, 0, 179, 
  0, 5, 75, 208, 197, 204, 130, 227, 14, 37, 5, 6, 179, 170, 80, 191, 38, 107, 
  219, 172, 12, 179, 231, 72, 100, 133, 134, 70, 201, 146, 29, 32, 118, 60, 1, 
  0, 181, 63, 32, 15, 141, 179, 87, 249, 225, 233, 130, 239, 14, 196, 179, 184, 
  121, 249, 246, 81, 109, 82, 71, 48, 126, 186, 240, 13, 24, 123, 229, 26, 0, 
  0, 159, 146, 220, 179, 101, 223, 33, 164, 164, 236, 35, 216, 255, 76, 192, 
  32, 205, 208, 152, 149, 248, 18, 156, 44, 47, 180, 50, 137, 188, 83, 249, 
  95, 0, 0, 7, 7, 49, 45, 29, 65, 218, 113, 240, 251, 40, 12, 22, 98, 205, 
  101, 235, 235, 46, 8, 89, 192, 203, 174, 63, 219, 220, 178, 108, 134, 224, 
  175, 0, 1, 6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 
  235, 121, 172, 28, 180, 133, 237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 
  255, 0, 169, 0, 0, 0, 40, 87, 237, 187, 84, 168, 175, 241, 75, 5, 104, 238, 
  20, 144, 17, 150, 10, 99, 96, 143, 237, 71, 209, 247, 252, 198, 164, 27, 
  204, 205, 98, 91, 56, 155, 22, 68, 199, 20, 64, 232, 167
]));

const NTT_MANAGER_ADDRESS = new web3.PublicKey(
  "STTUVCMPuNbk21y1J6nqEGXSQ8HKvFmFBKnCvKHTrWn"
);
const NTT_PROGRAM_DATA_ADDRESS = new web3.PublicKey(
  "CKKGtQ2m1t4gHUz2tECGQNqaaFtGsoc9eBjzm61qqV2Q"
);
const NEW_PROGRAM_BUFFER = new web3.PublicKey(
  "UGrgktHeUccU3dujEWrEfYaEv9x79K77uooEdadkUVD"
);
const NTT_UPGRADE_AUTHORITY_AND_CONFIG_OWNER = new web3.PublicKey(
  "66xDajRZ7MTrgePf27NdugVwDBFhKCCY9EYZ7B9CdDWj"
);
const NTT_CONFIG = new web3.PublicKey(
  "DCWd3ygRyr9qESyRfPRCMQ6o1wAsPu2niPUc48ixWeY9"
);
const TOKEN_MINT = new web3.PublicKey(
  "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA"
);
const BPF_LOADER_UPGRADEABLE_PROGRAM_ID = new web3.PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

async function fetchAndSetAccount(
  svm: LiteSVM,
  cluster: string, 
  pubkey: web3.PublicKey
) {
  const connection = new web3.Connection(cluster);
  const account = await connection.getAccountInfo(pubkey);
  if (!account) throw new Error(`Account not found: ${pubkey.toBase58()}`);

  const accountInfoBytes = {
    lamports: account.lamports,
    owner: account.owner,
    data: Buffer.from(account.data),
    executable: account.executable,
  };

  svm.setAccount(pubkey, accountInfoBytes)
}

const MAINNET_RPC_URL = "https://api.mainnet-beta.solana.com";
const DEVNET_RPC_URL = "https://api.devnet.solana.com";

const main = async () => {

  const svm = new LiteSVM();
  svm.withSigverify(false)

  await svm.addProgramFromFile(NTT_PROGRAM_DATA_ADDRESS, path.resolve(__dirname, "./fixtures/ntt_manager.so"));
  await fetchAndSetAccount(svm, MAINNET_RPC_URL, NTT_PROGRAM_DATA_ADDRESS);
  await fetchAndSetAccount(svm, MAINNET_RPC_URL, NTT_MANAGER_ADDRESS);
  // load ntt program data account

  // load the new program buffer (in devnet)
  await fetchAndSetAccount(svm, DEVNET_RPC_URL, NEW_PROGRAM_BUFFER);
  // load the ntt upgrade authority ITS A PDA!!
  // await fetchAndSetAccount(svm, MAINNET_RPC_URL, NTT_UPGRADE_AUTHORITY_AND_CONFIG_OWNER);
  // load the ntt config
  await fetchAndSetAccount(svm, MAINNET_RPC_URL, NTT_CONFIG);
  // load the mint
  await fetchAndSetAccount(svm, MAINNET_RPC_URL, TOKEN_MINT);

  // get upgrade program ix for ntt program
  const upgradeIx = getUpgradeInstruction(
    NTT_MANAGER_ADDRESS,
    NTT_PROGRAM_DATA_ADDRESS,
    NEW_PROGRAM_BUFFER,
    NTT_UPGRADE_AUTHORITY_AND_CONFIG_OWNER,
    NTT_UPGRADE_AUTHORITY_AND_CONFIG_OWNER
  );

  const transferMintAuthorityIx = convertWhGovernanceSolanaPayloadToInstruction(
    TRANSFER_MINT_AUTHORITY_PAYLOAD,
    NTT_UPGRADE_AUTHORITY_AND_CONFIG_OWNER,
    NTT_UPGRADE_AUTHORITY_AND_CONFIG_OWNER // owner does not matter here
  );

  const blockhash = svm.latestBlockhash();
  const messageV0 = new web3.TransactionMessage({
    payerKey: NTT_UPGRADE_AUTHORITY_AND_CONFIG_OWNER,
    recentBlockhash: blockhash,
    instructions: [upgradeIx, transferMintAuthorityIx],
  }).compileToV0Message();

  const transaction = new web3.VersionedTransaction(messageV0);
  
  const resp = svm.sendTransaction(transaction);
  

  if (resp instanceof TransactionMetadata) {
    console.log("success");
    console.log(resp.logs());
  } else if (resp instanceof FailedTransactionMetadata) {
    // FailedTransactionMetadata
    console.error("failed");
    console.error(resp.meta().toString())
    console.error(resp.err())
  }

};

main()


