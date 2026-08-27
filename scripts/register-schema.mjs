import {
  createPublicClient,
  createWalletClient,
  encodePacked,
  http,
  keccak256,
  zeroAddress,
  zeroHash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';

const CHAIN_ID = 421614;
const SCHEMA_REGISTRY_ADDRESS = '0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475';
const SCHEMA = 'bytes32 contentHash';
const RESOLVER = zeroAddress;
const REVOCABLE = false;
const EXPECTED_SCHEMA_UID = '0x5c5b8b295ff43c8e442be11d569e94a4cd5476f5e23df0f71bdd408df6b9649c';
const CHECK_ONLY = process.argv.includes('--check');

const schemaRegistryAbi = [
  {
    type: 'function',
    name: 'getSchema',
    stateMutability: 'view',
    inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'uid', type: 'bytes32' },
          { name: 'resolver', type: 'address' },
          { name: 'revocable', type: 'bool' },
          { name: 'schema', type: 'string' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'register',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'schema', type: 'string' },
      { name: 'resolver', type: 'address' },
      { name: 'revocable', type: 'bool' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
];

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function normalizeAddress(address) {
  return address.toLowerCase();
}

const derivedSchemaUid = keccak256(encodePacked(['string', 'address', 'bool'], [SCHEMA, RESOLVER, REVOCABLE]));

if (derivedSchemaUid !== EXPECTED_SCHEMA_UID) {
  fail(`derived schema UID ${derivedSchemaUid} does not match pinned UID ${EXPECTED_SCHEMA_UID}`);
}

const rpcUrl = process.env.ARBITRUM_SEPOLIA_RPC_URL?.trim();
const transport = rpcUrl ? http(rpcUrl) : http();
const publicClient = createPublicClient({ chain: arbitrumSepolia, transport });

const connectedChainId = await publicClient.getChainId();
if (connectedChainId !== CHAIN_ID) {
  fail(`RPC is connected to chain ${connectedChainId}; expected Arbitrum Sepolia (${CHAIN_ID})`);
}

console.log(`Network: Arbitrum Sepolia (${CHAIN_ID})`);
console.log(`SchemaRegistry: ${SCHEMA_REGISTRY_ADDRESS}`);
console.log(`Schema: ${SCHEMA}`);
console.log(`Resolver: ${RESOLVER}`);
console.log(`Revocable: ${REVOCABLE}`);
console.log(`Expected UID: ${EXPECTED_SCHEMA_UID}`);

const existing = await publicClient.readContract({
  address: SCHEMA_REGISTRY_ADDRESS,
  abi: schemaRegistryAbi,
  functionName: 'getSchema',
  args: [EXPECTED_SCHEMA_UID],
});

if (existing.uid !== zeroHash) {
  if (
    existing.uid !== EXPECTED_SCHEMA_UID ||
    existing.schema !== SCHEMA ||
    normalizeAddress(existing.resolver) !== normalizeAddress(RESOLVER) ||
    existing.revocable !== REVOCABLE
  ) {
    fail('a record exists at the expected UID but its schema fields do not match the pinned ProofStamp definition');
  }

  console.log('Schema is already registered and matches the pinned ProofStamp definition.');
  process.exit(0);
}

if (CHECK_ONLY) {
  console.log('Schema is not registered yet. No transaction was sent.');
  process.exit(0);
}

const privateKey = process.env.PROOFSTAMP_MAINTAINER_PRIVATE_KEY?.trim();
if (!privateKey || !/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
  fail(
    'set PROOFSTAMP_MAINTAINER_PRIVATE_KEY to a funded Arbitrum Sepolia maintainer wallet private key; never put this key in a VITE_* variable or commit it to the repository',
  );
}

const account = privateKeyToAccount(privateKey);
const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport });

console.log(`Registerer: ${account.address}`);

const { request } = await publicClient.simulateContract({
  account,
  address: SCHEMA_REGISTRY_ADDRESS,
  abi: schemaRegistryAbi,
  functionName: 'register',
  args: [SCHEMA, RESOLVER, REVOCABLE],
});

const transactionHash = await walletClient.writeContract(request);
console.log(`Transaction submitted: ${transactionHash}`);
console.log(`Explorer: https://sepolia.arbiscan.io/tx/${transactionHash}`);

const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });
if (receipt.status !== 'success') {
  fail(`schema registration transaction failed: ${transactionHash}`);
}

const registered = await publicClient.readContract({
  address: SCHEMA_REGISTRY_ADDRESS,
  abi: schemaRegistryAbi,
  functionName: 'getSchema',
  args: [EXPECTED_SCHEMA_UID],
});

if (
  registered.uid !== EXPECTED_SCHEMA_UID ||
  registered.schema !== SCHEMA ||
  normalizeAddress(registered.resolver) !== normalizeAddress(RESOLVER) ||
  registered.revocable !== REVOCABLE
) {
  fail('transaction succeeded but the registered schema does not match the pinned ProofStamp definition');
}

console.log(`Registered in block: ${receipt.blockNumber}`);
console.log('Schema registration verified on-chain.');
