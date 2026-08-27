export type Bytes32Hex = `0x${string}`;

const BYTES32_HEX_PATTERN = /^0x[0-9a-fA-F]{64}$/;

export function isBytes32Hex(value: string): value is Bytes32Hex {
  return BYTES32_HEX_PATTERN.test(value);
}

export function assertBytes32Hex(value: string, label = 'value'): asserts value is Bytes32Hex {
  if (!isBytes32Hex(value)) {
    throw new Error(`${label} must be exactly 32 bytes encoded as 0x + 64 hexadecimal characters.`);
  }
}
