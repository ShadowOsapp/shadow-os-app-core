/**
 * Example: AI-Pseudonym Reputation Proof
 * 
 * Demonstrates creating identity shadows and proving reputation
 * without revealing personal information
 */

import {
  AIReputationEngine
} from '@shadowos/core';

function main() {
  console.log('=== ShadowOS AI-Pseudonym Reputation Example ===\n');

  // Initialize reputation engine
  const reputationEngine = new AIReputationEngine();

  // Create identity shadows for different users
  console.log('Creating identity shadows...');
  const alice = reputationEngine.createIdentityShadow();
  const bob = reputationEngine.createIdentityShadow();
  const charlie = reputationEngine.createIdentityShadow();

  console.log(`✓ Created 3 identity shadows`);
  console.log(`  - Alice pseudonym: ${Array.from(alice.pseudonym.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}...`);
  console.log(`  - Initial reputation: ${alice.reputationScore}\n`);

  // Simulate on-chain interactions
  console.log('Simulating on-chain interactions...');
  
  // Alice makes several payments
  for (let i = 0; i < 5; i++) {
    reputationEngine.updateReputation(alice.pseudonym, 'payment', 1.0);
  }
  console.log(`✓ Alice made 5 payments`);

  // Alice gets verified attributes
  const verificationProof = new Uint8Array(32);
  crypto.getRandomValues(verificationProof);
  reputationEngine.addVerifiedAttribute(
    alice.pseudonym,
    'proof-of-personhood',
    verificationProof
  );
  console.log(`✓ Alice verified proof-of-personhood`);

  // Bob makes payments and gets compliance verification
  for (let i = 0; i < 3; i++) {
    reputationEngine.updateReputation(bob.pseudonym, 'payment', 1.0);
  }
  reputationEngine.updateReputation(bob.pseudonym, 'compliance', 1.0);
  console.log(`✓ Bob made 3 payments and passed compliance\n`);

  // Check current reputation scores
  const aliceUpdated = reputationEngine.getIdentity(alice.pseudonym);
  const bobUpdated = reputationEngine.getIdentity(bob.pseudonym);
  const charlieUpdated = reputationEngine.getIdentity(charlie.pseudonym);

  console.log('Current reputation scores:');
  console.log(`  - Alice: ${aliceUpdated?.reputationScore.toFixed(2)}`);
  console.log(`  - Bob: ${bobUpdated?.reputationScore.toFixed(2)}`);
  console.log(`  - Charlie: ${charlieUpdated?.reputationScore.toFixed(2)}\n`);

  // Generate reputation proofs
  console.log('Generating reputation proofs...');
  
  // Alice proves reputation >= 5.0
  const aliceProof = reputationEngine.generateReputationProof(
    alice.pseudonym,
    5.0
  );
  console.log(`✓ Alice's reputation proof generated`);
  console.log(`  - Score: ${aliceProof.reputationScore.toFixed(2)}`);
  console.log(`  - Commitment: ${Array.from(aliceProof.publicCommitment.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}...\n`);

  // Verify reputation proof
  console.log('Verifying reputation proof...');
  const isValid = reputationEngine.verifyReputationProof(aliceProof, 5.0);
  console.log(`✓ Proof is ${isValid ? 'valid' : 'invalid'}\n`);

  // Demonstrate ZK-KYC equivalence
  console.log('ZK-KYC Equivalence Demo:');
  console.log('  - Alice can prove reputation >= 5.0 without revealing exact score');
  console.log('  - Merchant can verify trustworthiness without knowing identity');
  console.log('  - Privacy preserved while maintaining verifiable trust\n');

  // Charlie tries to prove high reputation (should fail)
  try {
    const charlieProof = reputationEngine.generateReputationProof(
      charlie.pseudonym,
      5.0
    );
    console.log('Charlie proof:', charlieProof);
  } catch (error) {
    console.log(`✓ Charlie cannot prove reputation >= 5.0 (score too low)`);
  }

  console.log('\n=== Example Complete ===');
}

main();

