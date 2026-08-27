import { useLoginPasskey, useRegisterPasskey } from '@zerodev/wallet-react';
import { useState } from 'react';
import { parseEventLogs, zeroAddress, type Hex } from 'viem';
import { useAccount, useSendTransaction } from 'wagmi';
import { WalletProviders } from './WalletProviders';
import { ARBITRUM_SEPOLIA_CHAIN_ID } from './config/arbitrum';
import { createArbitrumSepoliaPublicClient, readEasAttestation, readProofStampSchema } from './lib/eas/client';
import {
  decodeProofStampData,
  PROOFSTAMP_SCHEMA,
  PROOFSTAMP_SCHEMA_RESOLVER,
  PROOFSTAMP_SCHEMA_REVOCABLE,
  PROOFSTAMP_SCHEMA_UID,
} from './lib/eas/schema';
import {
  createProofStampAttestCalldata,
  EAS_ATTESTED_EVENT_ABI,
  EAS_CONTRACT_ADDRESS,
} from './lib/eas/write';
import type { Sha256Hex } from './lib/hash';
import { ARBITRUM_SEPOLIA_RPC_URL } from './wagmi';

export interface BlockchainProofResult {
  uid: `0x${string}`;
  transactionHash: Hex;
  blockNumber: bigint;
  recordedAt: string;
}

interface BlockchainFlowProps {
  hash: Sha256Hex;
  onProof: (proof: BlockchainProofResult) => void;
  onError: (message: string) => void;
}

async function assertProofStampSchemaReady(): Promise<void> {
  const schema = await readProofStampSchema(ARBITRUM_SEPOLIA_RPC_URL);

  if (
    schema.uid.toLowerCase() !== PROOFSTAMP_SCHEMA_UID.toLowerCase() ||
    schema.schema !== PROOFSTAMP_SCHEMA ||
    schema.resolver.toLowerCase() !== PROOFSTAMP_SCHEMA_RESOLVER.toLowerCase() ||
    schema.revocable !== PROOFSTAMP_SCHEMA_REVOCABLE
  ) {
    throw new Error('The selected EAS Content Hash schema is not registered on Arbitrum Sepolia.');
  }
}

function BlockchainFlowInner({ hash, onProof, onError }: BlockchainFlowProps) {
  const [isRecording, setIsRecording] = useState(false);
  const { address, isConnected } = useAccount();
  const registerPasskey = useRegisterPasskey();
  const loginPasskey = useLoginPasskey();
  const sendTransaction = useSendTransaction();

  const isAuthenticating = registerPasskey.isPending || loginPasskey.isPending;

  async function handlePasskey(mode: 'register' | 'login'): Promise<void> {
    onError('');

    try {
      if (mode === 'register') {
        await registerPasskey.mutateAsync();
      } else {
        await loginPasskey.mutateAsync();
      }
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Unable to continue with this passkey.');
    }
  }

  async function handleRecord(): Promise<void> {
    if (!isConnected) return;

    onError('');
    setIsRecording(true);

    try {
      await assertProofStampSchemaReady();

      const transactionHash = await sendTransaction.sendTransactionAsync({
        chainId: ARBITRUM_SEPOLIA_CHAIN_ID,
        to: EAS_CONTRACT_ADDRESS,
        data: createProofStampAttestCalldata(hash),
        value: 0n,
      });

      const publicClient = createArbitrumSepoliaPublicClient(ARBITRUM_SEPOLIA_RPC_URL);
      const receipt = await publicClient.waitForTransactionReceipt({ hash: transactionHash });

      if (receipt.status !== 'success') {
        throw new Error('The blockchain transaction did not complete successfully.');
      }

      const events = parseEventLogs({
        abi: EAS_ATTESTED_EVENT_ABI,
        eventName: 'Attested',
        logs: receipt.logs,
      });
      const event = events.find(
        (candidate) => candidate.address.toLowerCase() === EAS_CONTRACT_ADDRESS.toLowerCase(),
      );
      const uid = event?.args.uid;

      if (!uid) {
        throw new Error('The ProofStamp transaction completed, but its proof ID was not found.');
      }

      const attestation = await readEasAttestation(uid, ARBITRUM_SEPOLIA_RPC_URL);
      const recordedHash = decodeProofStampData(attestation.data);

      if (
        attestation.uid.toLowerCase() !== uid.toLowerCase() ||
        attestation.schema.toLowerCase() !== PROOFSTAMP_SCHEMA_UID.toLowerCase() ||
        attestation.recipient.toLowerCase() !== zeroAddress.toLowerCase() ||
        attestation.revocable !== PROOFSTAMP_SCHEMA_REVOCABLE ||
        recordedHash.toLowerCase() !== hash.toLowerCase()
      ) {
        throw new Error('The recorded attestation did not match the prepared ProofStamp.');
      }

      onProof({
        uid,
        transactionHash,
        blockNumber: receipt.blockNumber,
        recordedAt: new Date(Number(attestation.time) * 1000).toLocaleString(),
      });
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : 'Unable to create this ProofStamp.');
    } finally {
      setIsRecording(false);
    }
  }

  return (
    <>
      {!isConnected ? (
        <div className="next-step">
          <strong>Continue securely</strong>
          <p>
            Your device will use a passkey. No seed phrase, token balance, or gas payment is required.
          </p>
          <button
            className="primary compact"
            type="button"
            disabled={isAuthenticating}
            onClick={() => void handlePasskey('register')}
          >
            {registerPasskey.isPending ? 'Creating passkey…' : 'Create a passkey'}
          </button>
          <button
            className="secondary"
            type="button"
            disabled={isAuthenticating}
            onClick={() => void handlePasskey('login')}
          >
            {loginPasskey.isPending ? 'Using passkey…' : 'I already have a passkey'}
          </button>
        </div>
      ) : (
        <div className="next-step">
          <strong>Ready to record</strong>
          <p>Only the SHA-256 fingerprint will be placed in the public attestation.</p>
          <button
            className="primary compact"
            type="button"
            disabled={isRecording || sendTransaction.isPending}
            onClick={() => void handleRecord()}
          >
            {isRecording || sendTransaction.isPending ? 'Creating ProofStamp…' : 'Create ProofStamp'}
          </button>
        </div>
      )}

      {address ? (
        <details>
          <summary>Wallet details</summary>
          <div className="result">
            <span>Attester address</span>
            <code>{address}</code>
          </div>
        </details>
      ) : null}
    </>
  );
}

export function BlockchainFlow(props: BlockchainFlowProps) {
  return (
    <WalletProviders>
      <BlockchainFlowInner {...props} />
    </WalletProviders>
  );
}
