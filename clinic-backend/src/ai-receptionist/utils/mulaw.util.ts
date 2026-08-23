/**
 * G.711 mu-law encoder and decoder for Twilio Media Streams audio processing.
 * Converts 8kHz mu-law audio packets to 16-bit linear PCM WAV and vice-versa.
 */

// mu-law to linear PCM 16-bit lookup table
const MU_LAW_TO_LINEAR = new Int16Array(256);
for (let i = 0; i < 256; i++) {
  let input = ~i;
  const sign = input & 0x80;
  const exponent = (input >> 4) & 0x07;
  const mantissa = input & 0x0f;
  let sample = ((mantissa << 3) + 132) << exponent;
  sample -= 132;
  if (sign !== 0) sample = -sample;
  MU_LAW_TO_LINEAR[i] = sample;
}

/**
 * Decodes a mu-law buffer into 16-bit PCM buffer.
 */
export function decodeMuLaw(muLawBuffer: Buffer): Buffer {
  const pcmBuffer = Buffer.alloc(muLawBuffer.length * 2);
  for (let i = 0; i < muLawBuffer.length; i++) {
    const sample = MU_LAW_TO_LINEAR[muLawBuffer[i]];
    pcmBuffer.writeInt16LE(sample, i * 2);
  }
  return pcmBuffer;
}

/**
 * Encodes a 16-bit linear PCM buffer into an 8-bit mu-law buffer.
 */
export function encodeMuLaw(pcmBuffer: Buffer): Buffer {
  const muLawBuffer = Buffer.alloc(Math.floor(pcmBuffer.length / 2));
  for (let i = 0; i < muLawBuffer.length; i++) {
    const sample = pcmBuffer.readInt16LE(i * 2);
    muLawBuffer[i] = linearToMuLawSample(sample);
  }
  return muLawBuffer;
}

function linearToMuLawSample(pcmVal: number): number {
  const BIAS = 0x84;
  const CLIP = 32635;

  let sign = 0;
  if (pcmVal < 0) {
    pcmVal = -pcmVal;
    sign = 0x80;
  }
  if (pcmVal > CLIP) pcmVal = CLIP;
  pcmVal += BIAS;

  let exponent = 7;
  for (let expMask = 0x4000; (pcmVal & expMask) === 0 && exponent > 0; expMask >>= 1) {
    exponent--;
  }

  const mantissa = (pcmVal >> (exponent + 3)) & 0x0f;
  const muLawByte = ~(sign | (exponent << 4) | mantissa);
  return muLawByte & 0xff;
}

/**
 * Wraps raw 16-bit PCM audio in a valid canonical WAV container header (8kHz or 16kHz, mono).
 */
export function createWavContainer(pcmData: Buffer, sampleRate = 8000, numChannels = 1): Buffer {
  const header = Buffer.alloc(44);
  const totalDataLen = pcmData.length;
  const totalFileLen = totalDataLen + 36;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;

  // RIFF identifier
  header.write('RIFF', 0);
  header.writeUInt32LE(totalFileLen, 4);
  header.write('WAVE', 8);

  // fmt sub-chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // sub-chunk size (16 for PCM)
  header.writeUInt16LE(1, 20); // audio format (1 = PCM)
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // bits per sample

  // data sub-chunk
  header.write('data', 36);
  header.writeUInt32LE(totalDataLen, 40);

  return Buffer.concat([header, pcmData]);
}
