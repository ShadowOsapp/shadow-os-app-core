import { describe, test, expect } from "bun:test";
import { FieldElement, SHADOW_PRIME } from "../src/core/field";

describe("FieldElement", () => {
  test("should create field element with valid value", () => {
    const a = new FieldElement(5n, SHADOW_PRIME);
    expect(a.value).toBe(5n);
    expect(a.modulus).toBe(SHADOW_PRIME);
  });

  test("should normalize value greater than modulus", () => {
    const value = SHADOW_PRIME + 10n;
    const a = new FieldElement(value, SHADOW_PRIME);
    expect(a.value).toBe(10n);
  });

  test("should add two field elements", () => {
    const a = new FieldElement(5n, SHADOW_PRIME);
    const b = new FieldElement(7n, SHADOW_PRIME);
    const sum = a.add(b);
    expect(sum.value).toBe(12n);
  });

  test("should subtract two field elements", () => {
    const a = new FieldElement(10n, SHADOW_PRIME);
    const b = new FieldElement(3n, SHADOW_PRIME);
    const diff = a.sub(b);
    expect(diff.value).toBe(7n);
  });

  test("should multiply two field elements", () => {
    const a = new FieldElement(5n, SHADOW_PRIME);
    const b = new FieldElement(7n, SHADOW_PRIME);
    const product = a.mul(b);
    expect(product.value).toBe(35n);
  });

  test("should compute multiplicative inverse", () => {
    const a = new FieldElement(5n, SHADOW_PRIME);
    const inv = a.inverse();
    const product = a.mul(inv);
    expect(product.value).toBe(1n);
  });

  test("should divide two field elements", () => {
    const a = new FieldElement(10n, SHADOW_PRIME);
    const b = new FieldElement(2n, SHADOW_PRIME);
    const quotient = a.div(b);
    expect(quotient.mul(b).value).toBe(10n);
  });

  test("should compute power", () => {
    const a = new FieldElement(3n, SHADOW_PRIME);
    const power = a.pow(4n);
    expect(power.value).toBe(81n);
  });

  test("should negate field element", () => {
    const a = new FieldElement(5n, SHADOW_PRIME);
    const neg = a.neg();
    const sum = a.add(neg);
    expect(sum.isZero()).toBe(true);
  });

  test("should check equality", () => {
    const a = new FieldElement(5n, SHADOW_PRIME);
    const b = new FieldElement(5n, SHADOW_PRIME);
    const c = new FieldElement(7n, SHADOW_PRIME);
    expect(a.equals(b)).toBe(true);
    expect(a.equals(c)).toBe(false);
  });

  test("should check if zero", () => {
    const zero = FieldElement.zero(SHADOW_PRIME);
    const one = FieldElement.one(SHADOW_PRIME);
    expect(zero.isZero()).toBe(true);
    expect(one.isZero()).toBe(false);
  });

  test("should check if one", () => {
    const zero = FieldElement.zero(SHADOW_PRIME);
    const one = FieldElement.one(SHADOW_PRIME);
    expect(one.isOne()).toBe(true);
    expect(zero.isOne()).toBe(false);
  });

  test("should convert to and from bytes", () => {
    const a = new FieldElement(123456789n, SHADOW_PRIME);
    const bytes = a.toBytes();
    const restored = FieldElement.fromBytes(bytes, SHADOW_PRIME);
    expect(restored.value).toBe(a.value);
  });

  test("should generate random field element", () => {
    const random = FieldElement.random(SHADOW_PRIME);
    expect(random.value >= 0n).toBe(true);
    expect(random.value < SHADOW_PRIME).toBe(true);
  });

  test("should throw error when adding elements with different moduli", () => {
    const a = new FieldElement(5n, SHADOW_PRIME);
    const b = new FieldElement(7n, 100n);
    expect(() => a.add(b)).toThrow();
  });

  test("should throw error when inverting zero", () => {
    const zero = FieldElement.zero(SHADOW_PRIME);
    expect(() => zero.inverse()).toThrow();
  });
});

