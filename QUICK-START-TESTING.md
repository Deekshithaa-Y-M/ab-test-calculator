# Quick Start: Running Property-Based Tests

## Easiest Way (No Installation Required)

1. Open the test HTML files in your web browser:
   - `test-runner.html` - Input validation tests
   - `test-confidence.html` - Confidence calculation tests
2. Tests will run automatically
3. View results on the page

That's it! The test runners include all necessary code and run entirely in the browser.

## What Gets Tested

### Input Validation Tests (test-runner.html)

The tests verify that input validation works correctly across hundreds of randomly generated test cases:

#### Property 1: Valid Inputs Accepted
- Tests 100 random valid input combinations
- Ensures conversions ≤ visitors are always accepted

#### Property 2: Invalid Inputs Rejected
- Tests 100 random non-numeric inputs (strings like "abc")
- Tests 100 random cases where conversions > visitors
- Tests 100 random negative number inputs
- All should be properly rejected

#### Edge Cases
- Empty inputs (should be allowed - user is typing)
- Zero values (should be valid)
- Conversions equal to visitors (100% conversion rate - should be valid)

### Confidence Calculation Tests (test-confidence.html)

The tests verify that confidence calculations work correctly:

#### Property 6: Confidence Level Formatted Correctly
- Tests 100 random z-score values
- Ensures confidence is always an integer between 0 and 100

#### Property 8: Z-score to Confidence Conversion is Correct
- Tests 100 random z-score values
- Verifies the conversion formula is mathematically correct
- Tests symmetry (z and -z give same confidence)
- Tests monotonicity (higher |z| gives higher confidence)
- Tests known values (z=1.96 ≈ 95%, z=2.58 ≈ 99%)

#### Edge Cases
- Z-score of 0 gives 0% confidence
- Large z-scores (>3) give high confidence (>95%)
- Small z-scores (<1) give low confidence (<70%)

## Expected Output

### test-runner.html
You should see:
- ✓ 7 tests passing
- 0 tests failing
- Details showing "Passed all 100 iterations" for each property test

### test-confidence.html
You should see:
- ✓ 9 tests passing
- 0 tests failing
- Details showing "Passed all 100 iterations" for property tests

## If Tests Fail

If any test fails, it indicates a bug in the validation logic in `calculator.js` that needs to be fixed.

## Alternative: Command Line (if Node.js is installed)

```bash
node run-tests.js
```

This will run the same tests and output results to the console.
