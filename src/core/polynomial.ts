/**
 * Polynomial Operations
 *
 * Essential for zero-knowledge proof generation
 */

import { FieldElement, SHADOW_PRIME } from "./field";

export class Polynomial {
  constructor(public readonly coefficients: FieldElement[]) {
    // Remove leading zeros
    while (
      this.coefficients.length > 0 &&
      this.coefficients[this.coefficients.length - 1].isZero()
    ) {
      this.coefficients.pop();
    }
  }

  degree(): number {
    return this.coefficients.length - 1;
  }

  evaluate(x: FieldElement): FieldElement {
    let result = FieldElement.zero(x.modulus);
    let power = FieldElement.one(x.modulus);

    for (const coeff of this.coefficients) {
      result = result.add(coeff.mul(power));
      power = power.mul(x);
    }

    return result;
  }

  add(other: Polynomial): Polynomial {
    const maxLen = Math.max(
      this.coefficients.length,
      other.coefficients.length
    );
    const result: FieldElement[] = [];
    const modulus = this.coefficients[0]?.modulus || SHADOW_PRIME;

    for (let i = 0; i < maxLen; i++) {
      const a = this.coefficients[i] || FieldElement.zero(modulus);
      const b = other.coefficients[i] || FieldElement.zero(modulus);
      result.push(a.add(b));
    }

    return new Polynomial(result);
  }

  sub(other: Polynomial): Polynomial {
    const maxLen = Math.max(
      this.coefficients.length,
      other.coefficients.length
    );
    const result: FieldElement[] = [];
    const modulus = this.coefficients[0]?.modulus || SHADOW_PRIME;

    for (let i = 0; i < maxLen; i++) {
      const a = this.coefficients[i] || FieldElement.zero(modulus);
      const b = other.coefficients[i] || FieldElement.zero(modulus);
      result.push(a.sub(b));
    }

    return new Polynomial(result);
  }

  mul(other: Polynomial): Polynomial {
    const result: FieldElement[] = [];
    const modulus = this.coefficients[0]?.modulus || SHADOW_PRIME;
    const degree = this.degree() + other.degree();

    for (let i = 0; i <= degree; i++) {
      let coeff = FieldElement.zero(modulus);
      for (let j = 0; j <= i; j++) {
        const a = this.coefficients[j] || FieldElement.zero(modulus);
        const b = other.coefficients[i - j] || FieldElement.zero(modulus);
        coeff = coeff.add(a.mul(b));
      }
      result.push(coeff);
    }

    return new Polynomial(result);
  }

  static interpolate(points: [FieldElement, FieldElement][]): Polynomial {
    if (points.length === 0) {
      throw new Error("Cannot interpolate empty set of points");
    }

    const modulus = points[0][0].modulus;
    let result = Polynomial.zero(modulus);

    for (let i = 0; i < points.length; i++) {
      const [xi, yi] = points[i];
      let basis = Polynomial.one(modulus);

      for (let j = 0; j < points.length; j++) {
        if (i !== j) {
          const [xj] = points[j];
          const denominator = xi.sub(xj);
          const numerator = new Polynomial([
            xj.neg(),
            FieldElement.one(modulus),
          ]);
          basis = basis
            .mul(numerator)
            .mul(new Polynomial([denominator.inverse()]));
        }
      }

      result = result.add(basis.mul(new Polynomial([yi])));
    }

    return result;
  }

  static zero(modulus: bigint = SHADOW_PRIME): Polynomial {
    return new Polynomial([FieldElement.zero(modulus)]);
  }

  static one(modulus: bigint = SHADOW_PRIME): Polynomial {
    return new Polynomial([FieldElement.one(modulus)]);
  }
}
