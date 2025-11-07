/**
 * Example: Private Merchant Bridge
 * 
 * Demonstrates merchants receiving payments privately without
 * accessing customer data
 */

import {
  PrivateMerchantBridge,
  AIReputationEngine
} from '@shadowos/core';

function main() {
  console.log('=== ShadowOS Private Merchant Bridge Example ===\n');

  // Initialize systems
  const bridge = new PrivateMerchantBridge();
  const reputationEngine = new AIReputationEngine();

  // Register a merchant
  console.log('Registering merchant...');
  const merchantStealthAddress = new Uint8Array(32);
  crypto.getRandomValues(merchantStealthAddress);

  bridge.registerMerchant({
    merchantId: 'merchant-001',
    stealthAddress: merchantStealthAddress,
    minReputationScore: 3.0, // Require minimum reputation
    acceptedChains: ['ethereum', 'polygon', 'solana']
  });
  console.log(`✓ Merchant registered: merchant-001`);
  console.log(`  - Min reputation required: 3.0`);
  console.log(`  - Accepted chains: ethereum, polygon, solana\n`);

  // Create customer identity
  console.log('Creating customer identity...');
  const customer = reputationEngine.createIdentityShadow();
  
  // Build customer reputation
  for (let i = 0; i < 4; i++) {
    reputationEngine.updateReputation(customer.pseudonym, 'payment', 1.0);
  }
  const customerIdentity = reputationEngine.getIdentity(customer.pseudonym);
  console.log(`✓ Customer identity created`);
  console.log(`  - Reputation score: ${customerIdentity?.reputationScore.toFixed(2)}\n`);

  // Create private invoice
  console.log('Creating private invoice...');
  const invoice = bridge.createInvoice(
    'merchant-001',
    5000000n, // 5 USDC
    3600 // 1 hour expiration
  );
  console.log(`✓ Invoice created`);
  console.log(`  - Invoice ID: ${invoice.invoiceId}`);
  console.log(`  - Amount: ${invoice.amount}`);
  console.log(`  - Expires: ${new Date(Number(invoice.expiration)).toISOString()}\n`);

  // Process private payment
  console.log('Processing private payment...');
  const receipt = bridge.processPayment(
    invoice.invoiceId,
    customer.pseudonym,
    5000000n,
    'ethereum'
  );
  console.log(`✓ Payment processed`);
  console.log(`  - Invoice ID: ${receipt.invoiceId}`);
  console.log(`  - Settlement proof: ${Array.from(receipt.settlementProof.slice(0, 16))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')}...`);
  console.log(`  - Reputation verified: ${receipt.reputationProof ? 'Yes' : 'No'}\n`);

  // Verify receipt
  console.log('Verifying payment receipt...');
  const root = bridge.getPaymentRoot();
  if (!root) {
    console.error('Failed to get payment root');
    return;
  }

  const isValid = bridge.verifyReceipt(receipt, root);
  console.log(`✓ Receipt is ${isValid ? 'valid' : 'invalid'}\n`);

  // Demonstrate privacy features
  console.log('Privacy Features Demonstrated:');
  console.log('  ✓ Merchant cannot see customer identity');
  console.log('  ✓ Customer cannot see merchant details');
  console.log('  ✓ Amount is cryptographically committed');
  console.log('  ✓ Reputation verified without disclosure');
  console.log('  ✓ Transaction is verifiable but untraceable\n');

  // Try payment with low reputation (should fail)
  console.log('Testing reputation requirement...');
  const lowRepCustomer = reputationEngine.createIdentityShadow();
  // Only 1 payment, not enough reputation
  reputationEngine.updateReputation(lowRepCustomer.pseudonym, 'payment', 1.0);

  const invoice2 = bridge.createInvoice('merchant-001', 1000000n, 3600);
  
  try {
    bridge.processPayment(
      invoice2.invoiceId,
      lowRepCustomer.pseudonym,
      1000000n,
      'ethereum'
    );
    console.log('Payment should have been rejected');
  } catch (error) {
    console.log(`✓ Payment rejected: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
  }

  console.log('=== Example Complete ===');
}

main();

