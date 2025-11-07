/**
 * Example: x402 Stealth Payment
 * 
 * Demonstrates creating and verifying private, untraceable transactions
 */

import {
  X402StealthPayment,
  FieldElement,
  SHADOW_PRIME
} from '@shadowos/core';

function main() {
  console.log('=== ShadowOS x402 Stealth Payment Example ===\n');

  // Initialize stealth payment system
  const stealthPayment = new X402StealthPayment();

  // Create a stealth address (in production, this would be generated from a key pair)
  const stealthAddress = new Uint8Array(32);
  crypto.getRandomValues(stealthAddress);

  // Create a stealth payment
  console.log('Creating stealth payment...');
  const amount = 1000000n; // 1 USDC (6 decimals)
  const payment = stealthPayment.createPayment(stealthAddress, amount);

  console.log(`✓ Payment created`);
  console.log(`  - Commitment: ${Array.from(payment.commitment.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}...`);
  console.log(`  - Amount: ${amount}`);
  console.log(`  - Timestamp: ${payment.timestamp}\n`);

  // Generate zero-knowledge proof
  console.log('Generating zero-knowledge proof...');
  const publicInput: FieldElement[] = [
    new FieldElement(amount, SHADOW_PRIME),
    new FieldElement(payment.timestamp, SHADOW_PRIME)
  ];

  const proof = stealthPayment.generateProof(0, publicInput);
  console.log(`✓ Proof generated`);
  console.log(`  - Commitment: ${Array.from(proof.commitment.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}...`);
  console.log(`  - Public inputs: ${publicInput.length}\n`);

  // Verify proof
  console.log('Verifying proof...');
  const root = stealthPayment.getRoot();
  if (!root) {
    console.error('Failed to get Merkle root');
    return;
  }

  const isValid = stealthPayment.verifyProof(proof, root);
  console.log(`✓ Proof is ${isValid ? 'valid' : 'invalid'}\n`);

  // Create multiple payments
  console.log('Creating multiple stealth payments...');
  for (let i = 0; i < 5; i++) {
    const addr = new Uint8Array(32);
    crypto.getRandomValues(addr);
    stealthPayment.createPayment(addr, BigInt(1000000 + i * 100000));
  }

  console.log(`✓ Created ${stealthPayment.getPaymentCount()} total payments`);
  console.log(`  - Merkle root: ${Array.from(stealthPayment.getRoot()!.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}...\n`);

  console.log('=== Example Complete ===');
}

main();

