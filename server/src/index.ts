/**
 * ShadowOS Backend API Server
 *
 * Serverless-compatible API server for ShadowOS core functionality
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { X402StealthPayment, FieldElement, SHADOW_PRIME } from "../../src";
import { AIReputationEngine } from "../../src";
import { PrivateMerchantBridge } from "../../src";

// Initialize services (in production, these would be stored in database)
const stealthPayment = new X402StealthPayment();
const reputationEngine = new AIReputationEngine();
const merchantBridge = new PrivateMerchantBridge();

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);
app.use("*", prettyJSON());

// Health check
app.get("/", (c) => {
  return c.json({
    name: "ShadowOS API",
    version: "0.3.0",
    status: "online",
    endpoints: {
      stealth: "/api/v1/stealth",
      reputation: "/api/v1/reputation",
      merchant: "/api/v1/merchant",
    },
  });
});

app.get("/health", (c) => {
  return c.json({ status: "healthy", timestamp: Date.now() });
});

// ==================== Stealth Payment Endpoints ====================

const stealthRoutes = new Hono();

/**
 * POST /api/v1/stealth/payment
 * Create a new stealth payment
 */
stealthRoutes.post("/payment", async (c) => {
  try {
    const body = await c.req.json();
    const { stealthAddress, amount, timestamp } = body;

    if (!stealthAddress || !amount) {
      return c.json({ error: "stealthAddress and amount are required" }, 400);
    }

    const addressBytes =
      typeof stealthAddress === "string"
        ? new Uint8Array(Buffer.from(stealthAddress, "hex"))
        : new Uint8Array(stealthAddress);

    const payment = stealthPayment.createPayment(
      addressBytes,
      BigInt(amount),
      timestamp ? BigInt(timestamp) : BigInt(Date.now())
    );

    return c.json({
      success: true,
      payment: {
        commitment: Buffer.from(payment.commitment).toString("hex"),
        amount: payment.amount.value.toString(),
        timestamp: payment.timestamp.toString(),
      },
      index: stealthPayment.getPaymentCount() - 1,
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/v1/stealth/proof
 * Generate zero-knowledge proof for a payment
 */
stealthRoutes.post("/proof", async (c) => {
  try {
    const body = await c.req.json();
    const { paymentIndex, publicInput } = body;

    if (paymentIndex === undefined || !publicInput) {
      return c.json(
        { error: "paymentIndex and publicInput are required" },
        400
      );
    }

    const publicInputFields = publicInput.map(
      (input: string | number) => new FieldElement(BigInt(input), SHADOW_PRIME)
    );

    const proof = stealthPayment.generateProof(paymentIndex, publicInputFields);
    const root = stealthPayment.getRoot();

    return c.json({
      success: true,
      proof: {
        commitment: Buffer.from(proof.commitment).toString("hex"),
        merkleProof: {
          leaf: Buffer.from(proof.merkleProof.leaf).toString("hex"),
          root: Buffer.from(proof.merkleProof.root).toString("hex"),
          index: proof.merkleProof.index,
        },
        zkProof: {
          polynomialCommitment: Buffer.from(
            proof.zkProof.polynomialCommitment
          ).toString("hex"),
          challenge: proof.zkProof.challenge.value.toString(),
        },
      },
      root: root ? Buffer.from(root).toString("hex") : null,
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/v1/stealth/verify
 * Verify a stealth payment proof
 */
stealthRoutes.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { proof, root } = body;

    if (!proof || !root) {
      return c.json({ error: "proof and root are required" }, 400);
    }

    // Reconstruct proof object from JSON
    const merkleProof = {
      leaf: new Uint8Array(Buffer.from(proof.merkleProof.leaf, "hex")),
      siblings: proof.merkleProof.siblings.map(
        (s: string) => new Uint8Array(Buffer.from(s, "hex"))
      ),
      index: proof.merkleProof.index,
      root: new Uint8Array(Buffer.from(proof.merkleProof.root, "hex")),
    };

    const zkProof = {
      polynomialCommitment: new Uint8Array(
        Buffer.from(proof.zkProof.polynomialCommitment, "hex")
      ),
      evaluationProofs: proof.zkProof.evaluationProofs.map((ep: any) => ({
        leaf: new Uint8Array(Buffer.from(ep.leaf, "hex")),
        siblings: ep.siblings.map(
          (s: string) => new Uint8Array(Buffer.from(s, "hex"))
        ),
        index: ep.index,
        root: new Uint8Array(Buffer.from(ep.root, "hex")),
      })),
      challenge: new FieldElement(
        BigInt(proof.zkProof.challenge),
        SHADOW_PRIME
      ),
      response: proof.zkProof.response.map(
        (r: string) => new FieldElement(BigInt(r), SHADOW_PRIME)
      ),
    };

    const publicInput = proof.publicInput.map(
      (input: string) => new FieldElement(BigInt(input), SHADOW_PRIME)
    );

    const stealthProof = {
      commitment: new Uint8Array(Buffer.from(proof.commitment, "hex")),
      merkleProof: merkleProof as any,
      zkProof: zkProof as any,
      publicInput,
    };

    const rootBytes = new Uint8Array(Buffer.from(root, "hex"));
    const isValid = stealthPayment.verifyProof(stealthProof as any, rootBytes);

    return c.json({
      success: true,
      valid: isValid,
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /api/v1/stealth/root
 * Get current Merkle root
 */
stealthRoutes.get("/root", (c) => {
  const root = stealthPayment.getRoot();
  return c.json({
    success: true,
    root: root ? Buffer.from(root).toString("hex") : null,
    paymentCount: stealthPayment.getPaymentCount(),
  });
});

// ==================== Reputation Endpoints ====================

const reputationRoutes = new Hono();

/**
 * POST /api/v1/reputation/identity
 * Create a new identity shadow
 */
reputationRoutes.post("/identity", async (c) => {
  try {
    const body = await c.req.json();
    const { seed } = body;

    const seedBytes = seed
      ? new Uint8Array(Buffer.from(seed, "hex"))
      : undefined;

    const identity = reputationEngine.createIdentityShadow(seedBytes);

    return c.json({
      success: true,
      identity: {
        pseudonym: Buffer.from(identity.pseudonym).toString("hex"),
        reputationScore: identity.reputationScore,
        onChainInteractions: identity.onChainInteractions,
        createdAt: identity.createdAt.toString(),
      },
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/v1/reputation/update
 * Update reputation for an identity
 */
reputationRoutes.post("/update", async (c) => {
  try {
    const body = await c.req.json();
    const { pseudonym, interactionType, weight } = body;

    if (!pseudonym || !interactionType) {
      return c.json(
        { error: "pseudonym and interactionType are required" },
        400
      );
    }

    const pseudonymBytes = new Uint8Array(Buffer.from(pseudonym, "hex"));

    reputationEngine.updateReputation(
      pseudonymBytes,
      interactionType,
      weight || 1.0
    );

    const identity = reputationEngine.getIdentity(pseudonymBytes);

    return c.json({
      success: true,
      identity: identity
        ? {
            pseudonym: Buffer.from(identity.pseudonym).toString("hex"),
            reputationScore: identity.reputationScore,
            onChainInteractions: identity.onChainInteractions,
          }
        : null,
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/v1/reputation/proof
 * Generate reputation proof
 */
reputationRoutes.post("/proof", async (c) => {
  try {
    const body = await c.req.json();
    const { pseudonym, minScore } = body;

    if (!pseudonym) {
      return c.json({ error: "pseudonym is required" }, 400);
    }

    const pseudonymBytes = new Uint8Array(Buffer.from(pseudonym, "hex"));

    const proof = reputationEngine.generateReputationProof(
      pseudonymBytes,
      minScore
    );

    return c.json({
      success: true,
      proof: {
        pseudonym: Buffer.from(proof.pseudonym).toString("hex"),
        reputationScore: proof.reputationScore,
        zkProof: Buffer.from(proof.zkProof).toString("hex"),
        publicCommitment: Buffer.from(proof.publicCommitment).toString("hex"),
      },
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/v1/reputation/verify
 * Verify reputation proof
 */
reputationRoutes.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { proof, minScore } = body;

    if (!proof) {
      return c.json({ error: "proof is required" }, 400);
    }

    const reputationProof = {
      pseudonym: new Uint8Array(Buffer.from(proof.pseudonym, "hex")),
      reputationScore: proof.reputationScore,
      zkProof: new Uint8Array(Buffer.from(proof.zkProof, "hex")),
      publicCommitment: new Uint8Array(
        Buffer.from(proof.publicCommitment, "hex")
      ),
    };

    const isValid = reputationEngine.verifyReputationProof(
      reputationProof as any,
      minScore
    );

    return c.json({
      success: true,
      valid: isValid,
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /api/v1/reputation/:pseudonym
 * Get identity information
 */
reputationRoutes.get("/:pseudonym", (c) => {
  try {
    const pseudonym = c.req.param("pseudonym");
    const pseudonymBytes = new Uint8Array(Buffer.from(pseudonym, "hex"));

    const identity = reputationEngine.getIdentity(pseudonymBytes);

    if (!identity) {
      return c.json({ error: "Identity not found" }, 404);
    }

    return c.json({
      success: true,
      identity: {
        pseudonym: Buffer.from(identity.pseudonym).toString("hex"),
        reputationScore: identity.reputationScore,
        onChainInteractions: identity.onChainInteractions,
        verifiedAttributes: identity.verifiedAttributes.map((attr) => ({
          attributeType: attr.attributeType,
          verifiedAt: attr.verifiedAt.toString(),
        })),
        createdAt: identity.createdAt.toString(),
        lastUpdated: identity.lastUpdated.toString(),
      },
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// ==================== Merchant Bridge Endpoints ====================

const merchantRoutes = new Hono();

/**
 * POST /api/v1/merchant/register
 * Register a new merchant
 */
merchantRoutes.post("/register", async (c) => {
  try {
    const body = await c.req.json();
    const { merchantId, stealthAddress, minReputationScore, acceptedChains } =
      body;

    if (!merchantId || !stealthAddress || !acceptedChains) {
      return c.json(
        {
          error: "merchantId, stealthAddress, and acceptedChains are required",
        },
        400
      );
    }

    const addressBytes =
      typeof stealthAddress === "string"
        ? new Uint8Array(Buffer.from(stealthAddress, "hex"))
        : new Uint8Array(stealthAddress);

    merchantBridge.registerMerchant({
      merchantId,
      stealthAddress: addressBytes,
      minReputationScore,
      acceptedChains,
    });

    return c.json({
      success: true,
      merchant: {
        merchantId,
        minReputationScore,
        acceptedChains,
      },
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/v1/merchant/invoice
 * Create a private invoice
 */
merchantRoutes.post("/invoice", async (c) => {
  try {
    const body = await c.req.json();
    const { merchantId, amount, expirationSeconds } = body;

    if (!merchantId || !amount) {
      return c.json({ error: "merchantId and amount are required" }, 400);
    }

    const invoice = merchantBridge.createInvoice(
      merchantId,
      BigInt(amount),
      expirationSeconds || 3600
    );

    return c.json({
      success: true,
      invoice: {
        invoiceId: invoice.invoiceId,
        amount: invoice.amount.toString(),
        merchantId: invoice.merchantId,
        timestamp: invoice.timestamp.toString(),
        expiration: invoice.expiration.toString(),
      },
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/v1/merchant/payment
 * Process a private payment
 */
merchantRoutes.post("/payment", async (c) => {
  try {
    const body = await c.req.json();
    const { invoiceId, senderPseudonym, amount, chain } = body;

    if (!invoiceId || !senderPseudonym || !amount || !chain) {
      return c.json(
        {
          error: "invoiceId, senderPseudonym, amount, and chain are required",
        },
        400
      );
    }

    const pseudonymBytes = new Uint8Array(Buffer.from(senderPseudonym, "hex"));

    const receipt = merchantBridge.processPayment(
      invoiceId,
      pseudonymBytes,
      BigInt(amount),
      chain
    );

    return c.json({
      success: true,
      receipt: {
        invoiceId: receipt.invoiceId,
        settlementProof: Buffer.from(receipt.settlementProof).toString("hex"),
        timestamp: receipt.timestamp.toString(),
        hasReputationProof: !!receipt.reputationProof,
      },
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * POST /api/v1/merchant/verify
 * Verify a payment receipt
 */
merchantRoutes.post("/verify", async (c) => {
  try {
    const body = await c.req.json();
    const { receipt, root } = body;

    if (!receipt || !root) {
      return c.json({ error: "receipt and root are required" }, 400);
    }

    // This is a simplified verification - in production, you'd reconstruct the full receipt
    const rootBytes = new Uint8Array(Buffer.from(root, "hex"));
    const expectedRoot = merchantBridge.getPaymentRoot();

    if (!expectedRoot) {
      return c.json({ error: "No payment root available" }, 400);
    }

    const isValid = Buffer.from(expectedRoot).toString("hex") === root;

    return c.json({
      success: true,
      valid: isValid,
    });
  } catch (error) {
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

/**
 * GET /api/v1/merchant/root
 * Get payment root
 */
merchantRoutes.get("/root", (c) => {
  const root = merchantBridge.getPaymentRoot();
  return c.json({
    success: true,
    root: root ? Buffer.from(root).toString("hex") : null,
  });
});

// Mount routes
app.route("/api/v1/stealth", stealthRoutes);
app.route("/api/v1/reputation", reputationRoutes);
app.route("/api/v1/merchant", merchantRoutes);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: "Internal Server Error" }, 500);
});

export default app;
