# Property-Based Testing for A/B Test Calculator

This document describes the property-based tests for input validation, conversion rate calculation, z-score calculation, and confidence calculation.

## Test Files

- `calculator.properties.test.js` - Jest/fast-check tests (requires Node.js and npm)
- `test-runner.html` - Browser-based test runner for input validation (no dependencies required)
- `test-confidence.html` - Browser-based test runner for confidence calculation (no dependencies required)
- `run-tests.js` - Standalone Node.js test runner (no npm packages required)

## Running Tests

### Option 1: Browser-Based Tests (Recommended - No Installation Required)

Simply open the test HTML files in any modern web browser. The tests will run automatically and display results.

- `test-runner.html` - Tests for input validation (Properties 1 & 2)
- `test-confidence.html` - Tests for confidence calculation (Properties 6 & 8)

### Option 2: Node.js (if available)

```bash
node run-tests.js
```

### Option 3: Jest with fast-check (requires npm)

```bash
npm install
npm test
```

## Test Coverage

### Property 1: Valid numeric inputs are accepted and stored
**Validates: Requirements 1.3**

Tests that valid numeric inputs (where conversions ≤ visitors) are accepted by the validation function.
- Runs 100 iterations with random valid inputs
- Ensures all valid combinations are accepted

### Property 2: Invalid inputs are rejected
**Validates: Requirements 1.4, 1.5**

Tests that invalid inputs are properly rejected:
- Non-numeric inputs (strings like "abc", "not-a-number")
- Conversions exceeding visitors
- Negative numbers for visitors or conversions

Each sub-test runs 100 iterations with randomly generated invalid inputs.

### Property 4: Conversion rates are formatted correctly
**Validates: Requirements 3.1, 3.2**

Tests that conversion rates are displayed as percentages with exactly one decimal place.
- Runs 100 iterations with random valid inputs
- Verifies formatting is consistent

### Property 5: Conversion rate formula is correct
**Validates: Requirements 3.3**

Tests that conversion rates are calculated using the correct formula: (conversions / visitors) × 100.
- Runs 100 iterations with random valid inputs
- Verifies mathematical correctness

### Property 6: Confidence level is formatted correctly
**Validates: Requirements 4.1**

Tests that confidence levels are displayed as percentages with no decimal places (integers).
- Runs 100 iterations with random z-score values
- Verifies the result is an integer between 0 and 100

### Property 7: Z-score calculation is mathematically correct
**Validates: Requirements 4.2**

Tests that z-scores are calculated using the correct two-proportion z-test formula.
- Runs 100 iterations with random valid inputs
- Verifies mathematical correctness against the formula

### Property 8: Z-score to confidence conversion is correct
**Validates: Requirements 4.3**

Tests that z-scores are correctly converted to confidence percentages using the standard normal distribution CDF.
- Runs 100 iterations with random z-score values
- Verifies the conversion formula is correct
- Tests symmetry (positive and negative z-scores give same confidence)
- Tests monotonicity (higher z-scores give higher confidence)
- Tests known values (z=1.96 ≈ 95%, z=2.58 ≈ 99%)

### Property 9: Verdict badge reflects confidence threshold
**Validates: Requirements 5.1, 5.2**

Tests that the verdict badge correctly displays based on the confidence threshold.
- Runs 100 iterations with random confidence values (0-100%)
- Verifies that confidence > 95% shows "Significant Winner!" with 'significant' class
- Verifies that confidence ≤ 95% shows "Not Significant yet" with 'not-significant' class
- Tests boundary conditions (exactly 95%, 96%, 0%, 100%)
- Verifies threshold is exclusive (> not ≥)

## Edge Cases Tested

1. **Empty inputs** - Should be accepted (user is typing)
2. **Zero values** - Should be valid
3. **Conversions equal to visitors** - Should be valid (100% conversion rate)

## Test Results

All tests should pass. If any test fails, it indicates a bug in the validation logic that needs to be fixed.
