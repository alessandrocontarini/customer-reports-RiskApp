const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

export interface ReportsCryptoContext {
  privateKey: CryptoKey;
  publicKeyJwk: JsonWebKey;
}

export const createReportsCryptoContext =
  async (): Promise<ReportsCryptoContext> => {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt'],
    );

    const publicKeyJwk = await crypto.subtle.exportKey(
      'jwk',
      keyPair.publicKey,
    );

    return {
      privateKey: keyPair.privateKey,
      publicKeyJwk,
    };
  };

export const decryptReportsSocketMessage = async (
  privateKey: CryptoKey,
  ciphertext: string,
): Promise<string> => {
  const encryptedBytes = base64ToArrayBuffer(ciphertext);

  const decryptedBytes = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encryptedBytes,
  );

  return textDecoder.decode(decryptedBytes);
};

export const encodeReportsSocketPlaintext = (message: unknown): Uint8Array =>
  textEncoder.encode(JSON.stringify(message));

const base64ToArrayBuffer = (value: string): ArrayBuffer => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
};
