/**
 * Private Merchant Bridge
 * 
 * Enables merchants, platforms, and DAOs to receive payments privately
 * without accessing customer data
 */

import { X402StealthPayment, StealthPayment, StealthProof } from '../zk/x402';
import { AIReputationEngine, ReputationProof } from '../identity/reputation';
import { FieldElement, SHADOW_PRIME } from '../core/field';
import { sha256 } from '@noble/hashes/sha256';

export interface MerchantConfig {
  merchantId: string;
  stealthAddress: Uint8Array;
  minReputationScore?: number;
  acceptedChains: string[];
}

export interface PrivateInvoice {
  invoiceId: string;
  amount: bigint;
  stealthAddress: Uint8Array;
  merchantId: string;
  timestamp: bigint;
  expiration: bigint;
  metadata?: Uint8Array;
}

export interface PaymentReceipt {
  invoiceId: string;
  paymentProof: StealthProof;
  reputationProof?: ReputationProof;
  settlementProof: Uint8Array;
  timestamp: bigint;
}

export class PrivateMerchantBridge {
  private stealthPayment: X402StealthPayment;
  private reputationEngine: AIReputationEngine;
  private merchants: Map<string, MerchantConfig> = new Map();
  private invoices: Map<string, PrivateInvoice> = new Map();
  private receipts: Map<string, PaymentReceipt> = new Map();

  constructor() {
    this.stealthPayment = new X402StealthPayment();
    this.reputationEngine = new AIReputationEngine();
  }

  /**
   * Register a merchant
   */
  registerMerchant(config: MerchantConfig): void {
    this.merchants.set(config.merchantId, config);
  }

  /**
   * Create a private invoice
   */
  createInvoice(
    merchantId: string,
    amount: bigint,
    expirationSeconds: number = 3600
  ): PrivateInvoice {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    const timestamp = BigInt(Date.now());
    const expiration = timestamp + BigInt(expirationSeconds * 1000);
    const invoiceId = this.generateInvoiceId(merchantId, amount, timestamp);

    const invoice: PrivateInvoice = {
      invoiceId,
      amount,
      stealthAddress: merchant.stealthAddress,
      merchantId,
      timestamp,
      expiration
    };

    this.invoices.set(invoiceId, invoice);
    return invoice;
  }

  /**
   * Process a private payment
   */
  processPayment(
    invoiceId: string,
    senderPseudonym: Uint8Array,
    amount: bigint,
    chain: string
  ): PaymentReceipt {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const merchant = this.merchants.get(invoice.merchantId);
    if (!merchant) {
      throw new Error("Merchant not found");
    }

    // Check expiration
    if (BigInt(Date.now()) > invoice.expiration) {
      throw new Error("Invoice has expired");
    }

    // Check amount
    if (amount !== invoice.amount) {
      throw new Error("Payment amount does not match invoice");
    }

    // Check chain support
    if (!merchant.acceptedChains.includes(chain)) {
      throw new Error("Chain not supported by merchant");
    }

    // Check reputation if required
    let reputationProof: ReputationProof | undefined;
    if (merchant.minReputationScore !== undefined) {
      reputationProof = this.reputationEngine.generateReputationProof(
        senderPseudonym,
        merchant.minReputationScore
      );

      if (!this.reputationEngine.verifyReputationProof(
        reputationProof,
        merchant.minReputationScore
      )) {
        throw new Error("Reputation score below merchant requirement");
      }
    }

    // Create stealth payment
    const payment = this.stealthPayment.createPayment(
      invoice.stealthAddress,
      amount,
      BigInt(Date.now())
    );

    const paymentIndex = this.stealthPayment.getPaymentCount() - 1;
    const publicInput: FieldElement[] = [
      new FieldElement(amount, SHADOW_PRIME),
      new FieldElement(invoice.timestamp, SHADOW_PRIME)
    ];

    const paymentProof = this.stealthPayment.generateProof(
      paymentIndex,
      publicInput
    );

    // Generate settlement proof
    const settlementData = new Uint8Array(
      invoiceId.length + paymentProof.commitment.length + 32
    );
    const encoder = new TextEncoder();
    settlementData.set(encoder.encode(invoiceId), 0);
    settlementData.set(paymentProof.commitment, invoiceId.length);
    const amountBytes = new FieldElement(amount, SHADOW_PRIME).toBytes();
    settlementData.set(amountBytes, invoiceId.length + paymentProof.commitment.length);
    const settlementProof = sha256(settlementData);

    // Update sender reputation
    this.reputationEngine.updateReputation(senderPseudonym, 'payment', 1.0);

    const receipt: PaymentReceipt = {
      invoiceId,
      paymentProof,
      reputationProof,
      settlementProof,
      timestamp: BigInt(Date.now())
    };

    this.receipts.set(invoiceId, receipt);
    return receipt;
  }

  /**
   * Verify payment receipt
   */
  verifyReceipt(receipt: PaymentReceipt, expectedRoot: Uint8Array): boolean {
    // Verify payment proof
    if (!this.stealthPayment.verifyProof(receipt.paymentProof, expectedRoot)) {
      return false;
    }

    // Verify reputation proof if present
    if (receipt.reputationProof) {
      if (!this.reputationEngine.verifyReputationProof(receipt.reputationProof)) {
        return false;
      }
    }

    // Verify settlement proof
    const invoice = this.invoices.get(receipt.invoiceId);
    if (!invoice) {
      return false;
    }

    const settlementData = new Uint8Array(
      receipt.invoiceId.length + receipt.paymentProof.commitment.length + 32
    );
    const encoder = new TextEncoder();
    settlementData.set(encoder.encode(receipt.invoiceId), 0);
    settlementData.set(receipt.paymentProof.commitment, receipt.invoiceId.length);
    const amountBytes = new FieldElement(invoice.amount, SHADOW_PRIME).toBytes();
    settlementData.set(amountBytes, receipt.invoiceId.length + receipt.paymentProof.commitment.length);
    const expectedSettlementProof = sha256(settlementData);

    if (!this.bytesEqual(receipt.settlementProof, expectedSettlementProof)) {
      return false;
    }

    return true;
  }

  /**
   * Get payment root for verification
   */
  getPaymentRoot(): Uint8Array | undefined {
    return this.stealthPayment.getRoot();
  }

  private generateInvoiceId(
    merchantId: string,
    amount: bigint,
    timestamp: bigint
  ): string {
    const data = new Uint8Array(
      merchantId.length + 32 + 8
    );
    const encoder = new TextEncoder();
    data.set(encoder.encode(merchantId), 0);
    data.set(new FieldElement(amount, SHADOW_PRIME).toBytes(), merchantId.length);
    
    const timestampBytes = new Uint8Array(8);
    const timestampView = new DataView(timestampBytes.buffer);
    timestampView.setBigUint64(0, timestamp, false);
    data.set(timestampBytes, merchantId.length + 32);

    const hash = sha256(data);
    return Array.from(hash.slice(0, 16))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}

