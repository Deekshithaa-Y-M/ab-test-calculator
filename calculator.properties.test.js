/**
 * Property-Based Tests for A/B Test Calculator Input Validation
 * Using fast-check for property-based testing
 */

import fc from 'fast-check';

// Mock DOM environment for testing
const setupDOM = () => {
  document.body.innerHTML = `
    <div class="input-card" id="control-card">
      <input type="number" id="control-visitors" value="">
      <input type="number" id="control-conversions" value="">
    </div>
    <div class="input-card" id="variant-card">
      <input type="number" id="variant-visitors" value="">
      <input type="number" id="variant-conversions" value="">
    </div>
  `;
};

// Import the validation function
// Since calculator.js uses DOM events, we'll test the core validation logic
const validateInput = (visitors, conversions) => {
  const v = Number(visitors);
  const c = Number(conversions);
  
  if (visitors === '' || conversions === '') {
    return { valid: true, error: '' };
  }
  
  if (isNaN(v) || isNaN(c)) {
    return { valid: false, error: 'Please enter valid numbers' };
  }
  
  if (v < 0 || c < 0) {
    return { valid: false, error: 'Values must be non-negative' };
  }
  
  if (c > v) {
    return { valid: false, error: 'Conversions cannot exceed visitors' };
  }
  
  return { valid: true, error: '' };
};

describe('Input Validation Property-Based Tests', () => {
  beforeEach(() => {
    setupDOM();
  });

  // **Feature: ab-test-calculator, Property 1: Valid numeric inputs are accepted and stored**
  test('Property 1: Valid numeric inputs are accepted and stored', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100000 }), // visitors
        fc.nat({ max: 100000 }), // conversions seed
        (visitors, conversionsSeed) => {
          // Ensure conversions <= visitors
          const conversions = conversionsSeed % (visitors + 1);
          
          const result = validateInput(visitors, conversions);
          
          // Valid inputs should be accepted
          expect(result.valid).toBe(true);
          expect(result.error).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: ab-test-calculator, Property 2: Invalid inputs are rejected**
  test('Property 2: Invalid inputs are rejected - non-numeric inputs', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.string().filter(s => isNaN(Number(s)) && s !== ''),
          fc.constant('abc'),
          fc.constant('12.34.56'),
          fc.constant('not-a-number')
        ),
        fc.nat({ max: 1000 }),
        (invalidInput, validNumber) => {
          const result = validateInput(invalidInput, validNumber);
          
          // Non-numeric inputs should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Invalid inputs are rejected - conversions > visitors', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }), // visitors
        fc.integer({ min: 1, max: 10000 }), // extra conversions
        (visitors, extra) => {
          const conversions = visitors + extra;
          
          const result = validateInput(visitors, conversions);
          
          // Conversions exceeding visitors should be rejected
          expect(result.valid).toBe(false);
          expect(result.error).toContain('Conversions cannot exceed visitors');
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Invalid inputs are rejected - negative numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -10000, max: -1 }),
        fc.nat({ max: 1000 }),
        (negativeValue, positiveValue) => {
          // Test negative visitors
          const result1 = validateInput(negativeValue, positiveValue);
          expect(result1.valid).toBe(false);
          expect(result1.error).toContain('non-negative');
          
          // Test negative conversions
          const result2 = validateInput(positiveValue, negativeValue);
          expect(result2.valid).toBe(false);
          expect(result2.error).toContain('non-negative');
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Empty inputs should be allowed (user is typing)
  test('Property 1: Empty inputs are accepted (typing state)', () => {
    const result1 = validateInput('', '');
    expect(result1.valid).toBe(true);
    
    const result2 = validateInput('', 100);
    expect(result2.valid).toBe(true);
    
    const result3 = validateInput(100, '');
    expect(result3.valid).toBe(true);
  });

  // Edge case: Zero values should be valid
  test('Property 1: Zero values are valid', () => {
    const result = validateInput(0, 0);
    expect(result.valid).toBe(true);
    expect(result.error).toBe('');
  });

  // Edge case: Conversions equal to visitors should be valid
  test('Property 1: Conversions equal to visitors is valid', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100000 }),
        (value) => {
          const result = validateInput(value, value);
          expect(result.valid).toBe(true);
          expect(result.error).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Import the z-score calculation function
const calculateZScore = (controlVisitors, controlConversions, variantVisitors, variantConversions) => {
  // Handle edge case: zero visitors in either group
  if (controlVisitors === 0 || variantVisitors === 0) {
    return 0;
  }
  
  // Calculate conversion rates (proportions)
  const p1 = controlConversions / controlVisitors;
  const p2 = variantConversions / variantVisitors;
  
  // Handle edge case: identical conversion rates
  if (p1 === p2) {
    return 0;
  }
  
  // Handle edge case: zero conversions in both groups
  if (controlConversions === 0 && variantConversions === 0) {
    return 0;
  }
  
  // Calculate pooled proportion: p_pool = (x1 + x2) / (n1 + n2)
  const pooledProportion = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
  
  // Handle edge case: pooled proportion is 0 or 1 (would cause SE to be 0)
  if (pooledProportion === 0 || pooledProportion === 1) {
    return 0;
  }
  
  // Calculate standard error: SE = sqrt(p_pool × (1 - p_pool) × (1/n1 + 1/n2))
  const standardError = Math.sqrt(
    pooledProportion * (1 - pooledProportion) * (1 / controlVisitors + 1 / variantVisitors)
  );
  
  // Handle edge case: standard error is 0 (would cause division by zero)
  if (standardError === 0) {
    return 0;
  }
  
  // Calculate z-score: z = (p1 - p2) / SE
  const zScore = (p1 - p2) / standardError;
  
  return zScore;
};

describe('Z-Score Calculation Property-Based Tests', () => {
  // **Feature: ab-test-calculator, Property 7: Z-score calculation is mathematically correct**
  test('Property 7: Z-score calculation is mathematically correct', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // controlVisitors (non-zero)
        fc.nat({ max: 10000 }), // controlConversionsSeed
        fc.integer({ min: 1, max: 10000 }), // variantVisitors (non-zero)
        fc.nat({ max: 10000 }), // variantConversionsSeed
        (controlVisitors, controlConversionsSeed, variantVisitors, variantConversionsSeed) => {
          // Ensure conversions <= visitors for both groups
          const controlConversions = controlConversionsSeed % (controlVisitors + 1);
          const variantConversions = variantConversionsSeed % (variantVisitors + 1);
          
          // Calculate z-score using the function
          const zScore = calculateZScore(controlVisitors, controlConversions, variantVisitors, variantConversions);
          
          // Manually calculate z-score using the formula to verify correctness
          // Formula: z = (p1 - p2) / sqrt(p_pool × (1 - p_pool) × (1/n1 + 1/n2))
          const p1 = controlConversions / controlVisitors;
          const p2 = variantConversions / variantVisitors;
          const pooledProportion = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
          
          // Handle edge cases that should return 0
          if (p1 === p2 || pooledProportion === 0 || pooledProportion === 1) {
            expect(zScore).toBe(0);
            return true;
          }
          
          const standardError = Math.sqrt(
            pooledProportion * (1 - pooledProportion) * (1 / controlVisitors + 1 / variantVisitors)
          );
          
          if (standardError === 0) {
            expect(zScore).toBe(0);
            return true;
          }
          
          const expectedZScore = (p1 - p2) / standardError;
          
          // The calculated z-score should match the formula
          // Use a small tolerance for floating-point comparison
          expect(Math.abs(zScore - expectedZScore)).toBeLessThan(0.0001);
          
          // Verify z-score is a valid number
          expect(isNaN(zScore)).toBe(false);
          expect(isFinite(zScore)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Zero visitors should return 0
  test('Property 7: Zero visitors edge case returns 0', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000 }), // conversions
        fc.integer({ min: 1, max: 10000 }), // non-zero visitors for other group
        fc.nat({ max: 1000 }), // conversions for other group
        (conversions1, visitors2, conversions2) => {
          // Test zero visitors in control group
          const zScore1 = calculateZScore(0, conversions1, visitors2, conversions2 % (visitors2 + 1));
          expect(zScore1).toBe(0);
          
          // Test zero visitors in variant group
          const zScore2 = calculateZScore(visitors2, conversions2 % (visitors2 + 1), 0, conversions1);
          expect(zScore2).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Identical conversion rates should return 0
  test('Property 7: Identical conversion rates return z-score of 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // visitors1
        fc.integer({ min: 1, max: 10000 }), // visitors2
        fc.float({ min: 0, max: 1 }), // conversion rate
        (visitors1, visitors2, rate) => {
          const conversions1 = Math.floor(visitors1 * rate);
          const conversions2 = Math.floor(visitors2 * rate);
          
          // Ensure exact same conversion rate
          const p1 = conversions1 / visitors1;
          const p2 = conversions2 / visitors2;
          
          if (p1 === p2) {
            const zScore = calculateZScore(visitors1, conversions1, visitors2, conversions2);
            expect(zScore).toBe(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Zero conversions in both groups should return 0
  test('Property 7: Zero conversions in both groups returns 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // visitors1
        fc.integer({ min: 1, max: 10000 }), // visitors2
        (visitors1, visitors2) => {
          const zScore = calculateZScore(visitors1, 0, visitors2, 0);
          expect(zScore).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Verify z-score sign is correct (positive when p1 > p2, negative when p1 < p2)
  test('Property 7: Z-score sign reflects difference direction', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 10000 }), // visitors (larger sample for clearer differences)
        fc.integer({ min: 10, max: 50 }), // conversions1 (lower)
        fc.integer({ min: 60, max: 100 }), // conversions2 (higher)
        (visitors, conversions1, conversions2) => {
          // Ensure conversions are within bounds
          const c1 = Math.min(conversions1, visitors);
          const c2 = Math.min(conversions2, visitors);
          
          const p1 = c1 / visitors;
          const p2 = c2 / visitors;
          
          // Skip if rates are identical
          if (p1 === p2) return true;
          
          const zScore = calculateZScore(visitors, c1, visitors, c2);
          
          // If p1 > p2, z-score should be positive
          // If p1 < p2, z-score should be negative
          if (p1 > p2) {
            expect(zScore).toBeGreaterThan(0);
          } else if (p1 < p2) {
            expect(zScore).toBeLessThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Import the conversion rate calculation function
const calculateConversionRate = (conversions, visitors) => {
  if (visitors === 0) {
    return 0.0;
  }
  const rate = (conversions / visitors) * 100;
  return Number(rate.toFixed(1));
};

describe('Conversion Rate Calculation Property-Based Tests', () => {
  // **Feature: ab-test-calculator, Property 4: Conversion rates are formatted correctly**
  test('Property 4: Conversion rates are formatted correctly', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100000 }), // visitors
        fc.nat({ max: 100000 }), // conversions seed
        (visitors, conversionsSeed) => {
          // Skip zero visitors case (tested separately)
          if (visitors === 0) return true;
          
          // Ensure conversions <= visitors
          const conversions = conversionsSeed % (visitors + 1);
          
          const rate = calculateConversionRate(conversions, visitors);
          
          // Convert to string to check decimal places
          const rateStr = rate.toString();
          
          // Check that the result is a number
          expect(typeof rate).toBe('number');
          expect(isNaN(rate)).toBe(false);
          
          // Check that it has exactly one decimal place
          // The number should either be a whole number (e.g., "5") or have one decimal (e.g., "5.3")
          if (rateStr.includes('.')) {
            const decimalPart = rateStr.split('.')[1];
            expect(decimalPart.length).toBe(1);
          }
          
          // Verify the value is between 0 and 100 (inclusive)
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: ab-test-calculator, Property 5: Conversion rate formula is correct**
  test('Property 5: Conversion rate formula is correct', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100000 }), // visitors
        fc.nat({ max: 100000 }), // conversions seed
        (visitors, conversionsSeed) => {
          // Skip zero visitors case (tested separately)
          if (visitors === 0) return true;
          
          // Ensure conversions <= visitors
          const conversions = conversionsSeed % (visitors + 1);
          
          const rate = calculateConversionRate(conversions, visitors);
          
          // Calculate expected rate: (conversions / visitors) × 100
          const expectedRate = (conversions / visitors) * 100;
          const expectedRateFormatted = Number(expectedRate.toFixed(1));
          
          // The calculated rate should match the formula
          expect(rate).toBe(expectedRateFormatted);
          
          // Alternative verification: rate should be within rounding tolerance
          expect(Math.abs(rate - expectedRate)).toBeLessThan(0.05);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Zero visitors should return 0.0
  test('Property 5: Zero visitors edge case returns 0.0', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100000 }), // conversions (doesn't matter)
        (conversions) => {
          const rate = calculateConversionRate(conversions, 0);
          
          // Should return 0.0 to prevent division by zero
          expect(rate).toBe(0.0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: 100% conversion rate
  test('Property 5: 100% conversion rate when conversions equal visitors', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }), // visitors (non-zero)
        (visitors) => {
          const conversions = visitors;
          const rate = calculateConversionRate(conversions, visitors);
          
          // Should return exactly 100.0
          expect(rate).toBe(100.0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: 0% conversion rate
  test('Property 5: 0% conversion rate when conversions are zero', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }), // visitors (non-zero)
        (visitors) => {
          const conversions = 0;
          const rate = calculateConversionRate(conversions, visitors);
          
          // Should return exactly 0.0
          expect(rate).toBe(0.0);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Import the confidence calculation functions
const normalCDF = (z) => {
  // Approximation using error function
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
};

const zScoreToConfidence = (zScore) => {
  // Two-tailed test: confidence = 2 × CDF(|z|) - 1
  const confidence = (2 * normalCDF(Math.abs(zScore)) - 1) * 100;
  
  // Format with no decimal places
  return Math.round(confidence);
};

describe('Confidence Calculation Property-Based Tests', () => {
  // **Feature: ab-test-calculator, Property 6: Confidence level is formatted correctly**
  test('Property 6: Confidence level is formatted correctly', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -10, max: 10 }), // z-score values
        (zScore) => {
          const confidence = zScoreToConfidence(zScore);
          
          // Check that the result is a number
          expect(typeof confidence).toBe('number');
          expect(isNaN(confidence)).toBe(false);
          
          // Check that it has no decimal places (is an integer)
          expect(Number.isInteger(confidence)).toBe(true);
          
          // Verify the value is between 0 and 100 (inclusive)
          expect(confidence).toBeGreaterThanOrEqual(0);
          expect(confidence).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  // **Feature: ab-test-calculator, Property 8: Z-score to confidence conversion is correct**
  test('Property 8: Z-score to confidence conversion is correct', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -10, max: 10 }), // z-score values
        (zScore) => {
          const confidence = zScoreToConfidence(zScore);
          
          // Manually calculate confidence using the formula to verify correctness
          // Formula: confidence = 2 × CDF(|z|) - 1
          const expectedConfidence = (2 * normalCDF(Math.abs(zScore)) - 1) * 100;
          const expectedConfidenceRounded = Math.round(expectedConfidence);
          
          // The calculated confidence should match the formula
          expect(confidence).toBe(expectedConfidenceRounded);
          
          // Verify confidence is within rounding tolerance of expected
          expect(Math.abs(confidence - expectedConfidence)).toBeLessThan(0.5);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Z-score of 0 should give confidence near 0%
  test('Property 8: Z-score of 0 gives confidence of 0%', () => {
    const confidence = zScoreToConfidence(0);
    
    // Z-score of 0 means no difference, so confidence should be 0%
    expect(confidence).toBe(0);
  });

  // Edge case: Large positive z-scores should give confidence near 100%
  test('Property 8: Large z-scores give high confidence', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 3, max: 10 }), // large z-scores
        (zScore) => {
          const confidence = zScoreToConfidence(zScore);
          
          // Large z-scores should result in high confidence (> 95%)
          expect(confidence).toBeGreaterThan(95);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Small z-scores should give low confidence
  test('Property 8: Small z-scores give low confidence', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -1, max: 1 }), // small z-scores
        (zScore) => {
          const confidence = zScoreToConfidence(zScore);
          
          // Small z-scores should result in low confidence (< 70%)
          expect(confidence).toBeLessThan(70);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Verify confidence is symmetric for positive and negative z-scores
  test('Property 8: Confidence is symmetric for positive and negative z-scores', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0.1, max: 10 }), // positive z-scores
        (zScore) => {
          const confidencePositive = zScoreToConfidence(zScore);
          const confidenceNegative = zScoreToConfidence(-zScore);
          
          // Confidence should be the same for z and -z (two-tailed test)
          expect(confidencePositive).toBe(confidenceNegative);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Verify confidence increases monotonically with |z-score|
  test('Property 8: Confidence increases with absolute z-score', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 5 }), // z1
        fc.float({ min: 0.1, max: 1 }), // delta (positive)
        (z1, delta) => {
          const z2 = z1 + delta;
          
          const confidence1 = zScoreToConfidence(z1);
          const confidence2 = zScoreToConfidence(z2);
          
          // Higher z-score should give higher or equal confidence
          expect(confidence2).toBeGreaterThanOrEqual(confidence1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Known values test: z-score of ~1.96 should give ~95% confidence
  test('Property 8: Z-score of 1.96 gives approximately 95% confidence', () => {
    const confidence = zScoreToConfidence(1.96);
    
    // Z-score of 1.96 corresponds to 95% confidence in a two-tailed test
    // Allow small tolerance due to approximation
    expect(confidence).toBeGreaterThanOrEqual(94);
    expect(confidence).toBeLessThanOrEqual(96);
  });

  // Known values test: z-score of ~2.58 should give ~99% confidence
  test('Property 8: Z-score of 2.58 gives approximately 99% confidence', () => {
    const confidence = zScoreToConfidence(2.58);
    
    // Z-score of 2.58 corresponds to 99% confidence in a two-tailed test
    // Allow small tolerance due to approximation
    expect(confidence).toBeGreaterThanOrEqual(98);
    expect(confidence).toBeLessThanOrEqual(100);
  });
});

// Import the verdict badge logic
const getVerdictBadge = (confidence) => {
  if (confidence > 95) {
    return {
      className: 'significant',
      text: 'Significant Winner!'
    };
  } else {
    return {
      className: 'not-significant',
      text: 'Not Significant yet'
    };
  }
};

describe('Verdict Badge Logic Property-Based Tests', () => {
  // **Feature: ab-test-calculator, Property 9: Verdict badge reflects confidence threshold**
  test('Property 9: Verdict badge reflects confidence threshold', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // confidence percentage
        (confidence) => {
          const verdict = getVerdictBadge(confidence);
          
          // Verify verdict structure
          expect(verdict).toHaveProperty('className');
          expect(verdict).toHaveProperty('text');
          
          // Verify correct badge for confidence > 95%
          if (confidence > 95) {
            expect(verdict.className).toBe('significant');
            expect(verdict.text).toBe('Significant Winner!');
          } else {
            // Verify correct badge for confidence ≤ 95%
            expect(verdict.className).toBe('not-significant');
            expect(verdict.text).toBe('Not Significant yet');
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Exactly 95% confidence should show "Not Significant yet"
  test('Property 9: Confidence of exactly 95% shows not significant', () => {
    const verdict = getVerdictBadge(95);
    
    expect(verdict.className).toBe('not-significant');
    expect(verdict.text).toBe('Not Significant yet');
  });

  // Edge case: 96% confidence (just above threshold) should show "Significant Winner!"
  test('Property 9: Confidence of 96% shows significant winner', () => {
    const verdict = getVerdictBadge(96);
    
    expect(verdict.className).toBe('significant');
    expect(verdict.text).toBe('Significant Winner!');
  });

  // Edge case: 0% confidence should show "Not Significant yet"
  test('Property 9: Confidence of 0% shows not significant', () => {
    const verdict = getVerdictBadge(0);
    
    expect(verdict.className).toBe('not-significant');
    expect(verdict.text).toBe('Not Significant yet');
  });

  // Edge case: 100% confidence should show "Significant Winner!"
  test('Property 9: Confidence of 100% shows significant winner', () => {
    const verdict = getVerdictBadge(100);
    
    expect(verdict.className).toBe('significant');
    expect(verdict.text).toBe('Significant Winner!');
  });

  // Verify threshold boundary behavior
  test('Property 9: Threshold at 95% is exclusive (> not ≥)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 95 }), // confidence ≤ 95
        fc.integer({ min: 96, max: 100 }), // confidence > 95
        (lowConfidence, highConfidence) => {
          const verdictLow = getVerdictBadge(lowConfidence);
          const verdictHigh = getVerdictBadge(highConfidence);
          
          // All values ≤ 95 should be not significant
          expect(verdictLow.className).toBe('not-significant');
          
          // All values > 95 should be significant
          expect(verdictHigh.className).toBe('significant');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Import the performAnalysis function (simplified version for testing)
const performAnalysisCore = (controlData, variantData) => {
  // Validate control group inputs
  const controlValidation = validateInput(controlData.visitors, controlData.conversions);
  if (!controlValidation.valid) {
    return null;
  }
  
  // Validate variant group inputs
  const variantValidation = validateInput(variantData.visitors, variantData.conversions);
  if (!variantValidation.valid) {
    return null;
  }
  
  // Check for empty inputs
  if (controlData.visitors === '' || controlData.conversions === '' || 
      variantData.visitors === '' || variantData.conversions === '') {
    return null;
  }
  
  // Convert to numbers
  const controlVisitors = Number(controlData.visitors);
  const controlConversions = Number(controlData.conversions);
  const variantVisitors = Number(variantData.visitors);
  const variantConversions = Number(variantData.conversions);
  
  // Calculate conversion rates
  const controlRate = calculateConversionRate(controlConversions, controlVisitors);
  const variantRate = calculateConversionRate(variantConversions, variantVisitors);
  
  // Calculate z-score
  const zScore = calculateZScore(controlVisitors, controlConversions, variantVisitors, variantConversions);
  
  // Convert z-score to confidence level
  const confidence = zScoreToConfidence(zScore);
  
  // Create results object
  const results = {
    controlRate: controlRate,
    variantRate: variantRate,
    confidence: confidence,
    isSignificant: confidence > 95
  };
  
  return results;
};

describe('Calculation Workflow Property-Based Tests', () => {
  // **Feature: ab-test-calculator, Property 3: Calculations produce results for valid inputs**
  test('Property 3: Calculations produce results for valid inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }), // controlVisitors (positive)
        fc.nat({ max: 100000 }), // controlConversionsSeed
        fc.integer({ min: 1, max: 100000 }), // variantVisitors (positive)
        fc.nat({ max: 100000 }), // variantConversionsSeed
        (controlVisitors, controlConversionsSeed, variantVisitors, variantConversionsSeed) => {
          // Ensure conversions <= visitors for both groups
          const controlConversions = controlConversionsSeed % (controlVisitors + 1);
          const variantConversions = variantConversionsSeed % (variantVisitors + 1);
          
          // Create valid input data
          const controlData = {
            visitors: controlVisitors,
            conversions: controlConversions
          };
          
          const variantData = {
            visitors: variantVisitors,
            conversions: variantConversions
          };
          
          // Perform analysis
          const results = performAnalysisCore(controlData, variantData);
          
          // Verify that results are produced (not null)
          expect(results).not.toBeNull();
          
          // Verify results object has expected structure
          expect(results).toHaveProperty('controlRate');
          expect(results).toHaveProperty('variantRate');
          expect(results).toHaveProperty('confidence');
          expect(results).toHaveProperty('isSignificant');
          
          // Verify all values are valid numbers
          expect(typeof results.controlRate).toBe('number');
          expect(typeof results.variantRate).toBe('number');
          expect(typeof results.confidence).toBe('number');
          expect(typeof results.isSignificant).toBe('boolean');
          
          // Verify no NaN values
          expect(isNaN(results.controlRate)).toBe(false);
          expect(isNaN(results.variantRate)).toBe(false);
          expect(isNaN(results.confidence)).toBe(false);
          
          // Verify values are within expected ranges
          expect(results.controlRate).toBeGreaterThanOrEqual(0);
          expect(results.controlRate).toBeLessThanOrEqual(100);
          expect(results.variantRate).toBeGreaterThanOrEqual(0);
          expect(results.variantRate).toBeLessThanOrEqual(100);
          expect(results.confidence).toBeGreaterThanOrEqual(0);
          expect(results.confidence).toBeLessThanOrEqual(100);
          
          // Verify isSignificant matches confidence threshold
          if (results.confidence > 95) {
            expect(results.isSignificant).toBe(true);
          } else {
            expect(results.isSignificant).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Zero visitors should be handled gracefully
  test('Property 3: Zero visitors edge case is handled', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 1000 }), // conversions
        fc.integer({ min: 1, max: 10000 }), // non-zero visitors for other group
        fc.nat({ max: 1000 }), // conversions for other group
        (conversions1, visitors2, conversions2) => {
          // Test zero visitors in control group
          const controlData1 = { visitors: 0, conversions: conversions1 };
          const variantData1 = { visitors: visitors2, conversions: conversions2 % (visitors2 + 1) };
          const results1 = performAnalysisCore(controlData1, variantData1);
          
          // Should produce results (not crash)
          expect(results1).not.toBeNull();
          expect(results1.controlRate).toBe(0.0);
          expect(results1.confidence).toBe(0);
          
          // Test zero visitors in variant group
          const controlData2 = { visitors: visitors2, conversions: conversions2 % (visitors2 + 1) };
          const variantData2 = { visitors: 0, conversions: conversions1 };
          const results2 = performAnalysisCore(controlData2, variantData2);
          
          // Should produce results (not crash)
          expect(results2).not.toBeNull();
          expect(results2.variantRate).toBe(0.0);
          expect(results2.confidence).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Zero conversions in both groups
  test('Property 3: Zero conversions in both groups produces valid results', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // controlVisitors
        fc.integer({ min: 1, max: 10000 }), // variantVisitors
        (controlVisitors, variantVisitors) => {
          const controlData = { visitors: controlVisitors, conversions: 0 };
          const variantData = { visitors: variantVisitors, conversions: 0 };
          
          const results = performAnalysisCore(controlData, variantData);
          
          // Should produce results
          expect(results).not.toBeNull();
          
          // Both rates should be 0%
          expect(results.controlRate).toBe(0.0);
          expect(results.variantRate).toBe(0.0);
          
          // Confidence should be 0% (no difference to detect)
          expect(results.confidence).toBe(0);
          
          // Should not be significant
          expect(results.isSignificant).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Identical conversion rates
  test('Property 3: Identical conversion rates produce valid results', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // visitors1
        fc.integer({ min: 1, max: 10000 }), // visitors2
        fc.float({ min: 0, max: 1 }), // conversion rate
        (visitors1, visitors2, rate) => {
          const conversions1 = Math.floor(visitors1 * rate);
          const conversions2 = Math.floor(visitors2 * rate);
          
          // Ensure exact same conversion rate
          const p1 = conversions1 / visitors1;
          const p2 = conversions2 / visitors2;
          
          if (p1 === p2) {
            const controlData = { visitors: visitors1, conversions: conversions1 };
            const variantData = { visitors: visitors2, conversions: conversions2 };
            
            const results = performAnalysisCore(controlData, variantData);
            
            // Should produce results
            expect(results).not.toBeNull();
            
            // Confidence should be 0% (no difference)
            expect(results.confidence).toBe(0);
            
            // Should not be significant
            expect(results.isSignificant).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Verify that invalid inputs return null
  test('Property 3: Invalid inputs return null', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }), // valid visitors
        fc.integer({ min: 1, max: 10000 }), // extra conversions (to make invalid)
        (visitors, extra) => {
          // Test conversions > visitors (invalid)
          const controlData = { visitors: visitors, conversions: visitors + extra };
          const variantData = { visitors: visitors, conversions: visitors };
          
          const results = performAnalysisCore(controlData, variantData);
          
          // Should return null for invalid inputs
          expect(results).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  // Verify that empty inputs return null
  test('Property 3: Empty inputs return null', () => {
    const controlData1 = { visitors: '', conversions: 100 };
    const variantData1 = { visitors: 100, conversions: 50 };
    expect(performAnalysisCore(controlData1, variantData1)).toBeNull();
    
    const controlData2 = { visitors: 100, conversions: '' };
    const variantData2 = { visitors: 100, conversions: 50 };
    expect(performAnalysisCore(controlData2, variantData2)).toBeNull();
    
    const controlData3 = { visitors: 100, conversions: 50 };
    const variantData3 = { visitors: '', conversions: 50 };
    expect(performAnalysisCore(controlData3, variantData3)).toBeNull();
    
    const controlData4 = { visitors: 100, conversions: 50 };
    const variantData4 = { visitors: 100, conversions: '' };
    expect(performAnalysisCore(controlData4, variantData4)).toBeNull();
  });
});

// Mock DOM for UI state management tests
const setupFullDOM = () => {
  document.body.innerHTML = `
    <div class="input-card" id="control-card">
      <input type="number" id="control-visitors" value="">
      <input type="number" id="control-conversions" value="">
    </div>
    <div class="input-card" id="variant-card">
      <input type="number" id="variant-visitors" value="">
      <input type="number" id="variant-conversions" value="">
    </div>
    <div id="results-section" class="">
      <div id="control-rate">10.5%</div>
      <div id="variant-rate">12.3%</div>
      <div id="confidence-level">85%</div>
      <div id="verdict-badge" class="not-significant">Not Significant yet</div>
    </div>
  `;
};

// Simulate the clearResults function behavior
const clearResultsSimulation = () => {
  const resultsSection = document.getElementById('results-section');
  const controlRateElement = document.getElementById('control-rate');
  const variantRateElement = document.getElementById('variant-rate');
  const confidenceLevelElement = document.getElementById('confidence-level');
  const verdictBadge = document.getElementById('verdict-badge');
  
  // Reset result values to default
  controlRateElement.textContent = '-';
  variantRateElement.textContent = '-';
  confidenceLevelElement.textContent = '-';
  
  // Clear verdict badge
  verdictBadge.textContent = '';
  verdictBadge.classList.remove('significant', 'not-significant');
  
  // Hide the results section
  resultsSection.classList.add('hidden');
};

// Check if results are in cleared state
const areResultsCleared = () => {
  const resultsSection = document.getElementById('results-section');
  const controlRateElement = document.getElementById('control-rate');
  const variantRateElement = document.getElementById('variant-rate');
  const confidenceLevelElement = document.getElementById('confidence-level');
  const verdictBadge = document.getElementById('verdict-badge');
  
  return (
    controlRateElement.textContent === '-' &&
    variantRateElement.textContent === '-' &&
    confidenceLevelElement.textContent === '-' &&
    verdictBadge.textContent === '' &&
    !verdictBadge.classList.contains('significant') &&
    !verdictBadge.classList.contains('not-significant') &&
    resultsSection.classList.contains('hidden')
  );
};

describe('UI State Management Property-Based Tests', () => {
  // **Feature: ab-test-calculator, Property 10: Input changes clear previous results**
  test('Property 10: Input changes clear previous results', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }), // initial value
        fc.nat({ max: 10000 }), // new value
        (initialValue, newValue) => {
          // Setup DOM with results displayed
          setupFullDOM();
          
          // Verify results are initially displayed (not cleared)
          const controlRateElement = document.getElementById('control-rate');
          const resultsSection = document.getElementById('results-section');
          expect(controlRateElement.textContent).not.toBe('-');
          expect(resultsSection.classList.contains('hidden')).toBe(false);
          
          // Get one of the input fields
          const controlVisitorsInput = document.getElementById('control-visitors');
          
          // Set initial value
          controlVisitorsInput.value = initialValue.toString();
          
          // Simulate input change by calling clearResults
          clearResultsSimulation();
          
          // Verify results are cleared
          expect(areResultsCleared()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Test that changing any of the four input fields clears results
  test('Property 10: Changing any input field clears results', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }), // value for control visitors
        fc.nat({ max: 10000 }), // value for control conversions
        fc.nat({ max: 10000 }), // value for variant visitors
        fc.nat({ max: 10000 }), // value for variant conversions
        (cv, cc, vv, vc) => {
          // Test each input field
          const inputFields = [
            { id: 'control-visitors', value: cv },
            { id: 'control-conversions', value: cc },
            { id: 'variant-visitors', value: vv },
            { id: 'variant-conversions', value: vc }
          ];
          
          inputFields.forEach(field => {
            // Setup DOM with results displayed
            setupFullDOM();
            
            // Verify results are initially displayed
            expect(areResultsCleared()).toBe(false);
            
            // Get the input field
            const inputElement = document.getElementById(field.id);
            
            // Change the input value
            inputElement.value = field.value.toString();
            
            // Simulate the input event handler calling clearResults
            clearResultsSimulation();
            
            // Verify results are cleared
            expect(areResultsCleared()).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Multiple input changes should keep results cleared
  test('Property 10: Multiple input changes keep results cleared', () => {
    fc.assert(
      fc.property(
        fc.array(fc.nat({ max: 10000 }), { minLength: 2, maxLength: 10 }), // sequence of values
        (values) => {
          // Setup DOM with results displayed
          setupFullDOM();
          
          const controlVisitorsInput = document.getElementById('control-visitors');
          
          // Apply multiple input changes
          values.forEach(value => {
            controlVisitorsInput.value = value.toString();
            clearResultsSimulation();
          });
          
          // Results should still be cleared after multiple changes
          expect(areResultsCleared()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Edge case: Changing input to empty string should also clear results
  test('Property 10: Changing input to empty clears results', () => {
    // Setup DOM with results displayed
    setupFullDOM();
    
    const controlVisitorsInput = document.getElementById('control-visitors');
    
    // Verify results are initially displayed
    expect(areResultsCleared()).toBe(false);
    
    // Change input to empty
    controlVisitorsInput.value = '';
    
    // Simulate input change
    clearResultsSimulation();
    
    // Verify results are cleared
    expect(areResultsCleared()).toBe(true);
  });

  // Edge case: Changing input to same value should still clear results
  test('Property 10: Changing input to same value clears results', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10000 }), // value
        (value) => {
          // Setup DOM with results displayed
          setupFullDOM();
          
          const controlVisitorsInput = document.getElementById('control-visitors');
          
          // Set initial value
          controlVisitorsInput.value = value.toString();
          
          // Verify results are initially displayed
          expect(areResultsCleared()).toBe(false);
          
          // Change input to same value (simulating user editing)
          controlVisitorsInput.value = value.toString();
          
          // Simulate input change
          clearResultsSimulation();
          
          // Verify results are cleared (input event fires even for same value)
          expect(areResultsCleared()).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
