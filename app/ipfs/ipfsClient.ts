import * as Signer from "@ucanto/principal/ed25519";
import { StoreMemory } from "@web3-storage/w3up-client/stores/memory";
import * as Client from "@web3-storage/w3up-client";
import { importDAG } from "@ucanto/core/delegation";
import { CarReader } from "@ipld/car";
import { Buffer } from "buffer";
import type { IpfsClient } from "../lib/types";

// Ensure Buffer is available globally
if (typeof window !== "undefined") {
  window.Buffer = Buffer;
}

export async function createIpfsClient(
  agentKey: string,
  proof: string
): Promise<IpfsClient> {
  console.log("Creating IPFS client with agentKey:", agentKey);
  const principal = Signer.parse(agentKey);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });
  console.log("IPFS client created:", client);
  // Parse and add the proof
  const parsedProof = await parseProof(proof);
  const space = await client.addSpace(parsedProof);
  await client.setCurrentSpace(space.did());
  console.log("Space added and current space set:", space.did());

  // Cast to our extended interface
  return Object.assign(client, {
    isInitialized: true,
  }) as IpfsClient;
}

async function parseProof(data: string) {
  const blocks = [];
  const reader = await CarReader.fromBytes(Buffer.from(data, "base64"));
  for await (const block of reader.blocks()) {
    blocks.push(block);
  }
  const v1Blocks = blocks.filter(
    (block) => block.cid && block.cid.version === 1
  );
  return importDAG(v1Blocks as Iterable<any>);
}
