// Standalone test runner that doesn't require npm packages
// Can be run with: node run-tests.js (if Node is available)
// Or tests can be run by opening test-runner.html in a browser

// Validation function (copied from calculator.js)
function validateInput(visitors, conversions) {
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
}

// Test utilities
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomNat(max = 100000) {
    return randomInt(0, max);
}

function randomInvalidString() {
    const options = ['abc', 'not-a-number', '12.34.56', 'xyz123abc', '!@#$'];
    return options[randomInt(0, options.length - 1)];
}

// Test results
const testResults = [];

function recordTest(name, passed, details = '') {
    testResults.push({ name, passed, details });
    const status = passed ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${name}`);
    if (details) {
        console.log(`  ${details}`);
    }
}

// **Feature: ab-test-calculator, Property 1: Valid numeric inputs are accepted and stored**
function testProperty1_ValidInputsAccepted() {
    const numRuns = 100;
    let failures = 0;
    let failureExample = '';

    for (let i = 0; i < numRuns; i++) {
        const visitors = randomNat(100000);
        const conversions = randomInt(0, visitors);
        
        const result = validateInput(visitors, conversions);
        
        if (!result.valid || result.error !== '') {
            failures++;
            if (!failureExample) {
                failureExample = `Failed with visitors=${visitors}, conversions=${conversions}`;
            }
        }
    }

    recordTest(
        'Property 1: Valid numeric inputs are accepted and stored',
        failures === 0,
        failures === 0 ? `Passed all ${numRuns} iterations` : `${failures} failures. Example: ${failureExample}`
    );
}

// **Feature: ab-test-calculator, Property 2: Invalid inputs are rejected**
function testProperty2_InvalidInputsRejected_NonNumeric() {
    const numRuns = 100;
    let failures = 0;
    let failureExample = '';

    for (let i = 0; i < numRuns; i++) {
        const invalidInput = randomInvalidString();
        const validNumber = randomNat(1000);
        
        const result = validateInput(invalidInput, validNumber);
        
        if (result.valid || !result.error) {
            failures++;
            if (!failureExample) {
                failureExample = `Failed to reject invalid input: "${invalidInput}"`;
            }
        }
    }

    recordTest(
        'Property 2: Invalid inputs are rejected - non-numeric inputs',
        failures === 0,
        failures === 0 ? `Passed all ${numRuns} iterations` : `${failures} failures. Example: ${failureExample}`
    );
}

function testProperty2_InvalidInputsRejected_ConversionsExceedVisitors() {
    const numRuns = 100;
    let failures = 0;
    let failureExample = '';

    for (let i = 0; i < numRuns; i++) {
        const visitors = randomNat(10000);
        const extra = randomInt(1, 10000);
        const conversions = visitors + extra;
        
        const result = validateInput(visitors, conversions);
        
        if (result.valid || !result.error.includes('Conversions cannot exceed visitors')) {
            failures++;
            if (!failureExample) {
                failureExample = `Failed with visitors=${visitors}, conversions=${conversions}`;
            }
        }
    }

    recordTest(
        'Property 2: Invalid inputs are rejected - conversions > visitors',
        failures === 0,
        failures === 0 ? `Passed all ${numRuns} iterations` : `${failures} failures. Example: ${failureExample}`
    );
}

function testProperty2_InvalidInputsRejected_NegativeNumbers() {
    const numRuns = 100;
    let failures = 0;
    let failureExample = '';

    for (let i = 0; i < numRuns; i++) {
        const negativeValue = randomInt(-10000, -1);
        const positiveValue = randomNat(1000);
        
        const result1 = validateInput(negativeValue, positiveValue);
        if (result1.valid || !result1.error.includes('non-negative')) {
            failures++;
            if (!failureExample) {
                failureExample = `Failed to reject negative visitors: ${negativeValue}`;
            }
        }
        
        const result2 = validateInput(positiveValue, negativeValue);
        if (result2.valid || !result2.error.includes('non-negative')) {
            failures++;
            if (!failureExample) {
                failureExample = `Failed to reject negative conversions: ${negativeValue}`;
            }
        }
    }

    recordTest(
        'Property 2: Invalid inputs are rejected - negative numbers',
        failures === 0,
        failures === 0 ? `Passed all ${numRuns} iterations` : `${failures} failures. Example: ${failureExample}`
    );
}

// Edge cases
function testEdgeCase_EmptyInputs() {
    const result1 = validateInput('', '');
    const result2 = validateInput('', 100);
    const result3 = validateInput(100, '');
    
    const passed = result1.valid && result2.valid && result3.valid;
    
    recordTest(
        'Edge Case: Empty inputs are accepted (typing state)',
        passed,
        passed ? 'Empty inputs correctly allowed' : 'Empty inputs incorrectly rejected'
    );
}

function testEdgeCase_ZeroValues() {
    const result = validateInput(0, 0);
    const passed = result.valid && result.error === '';
    
    recordTest(
        'Edge Case: Zero values are valid',
        passed,
        passed ? 'Zero values correctly accepted' : 'Zero values incorrectly rejected'
    );
}

function testEdgeCase_ConversionsEqualVisitors() {
    const numRuns = 100;
    let failures = 0;

    for (let i = 0; i < numRuns; i++) {
        const value = randomNat(100000);
        const result = validateInput(value, value);
        
        if (!result.valid || result.error !== '') {
            failures++;
        }
    }

    recordTest(
        'Edge Case: Conversions equal to visitors is valid',
        failures === 0,
        failures === 0 ? `Passed all ${numRuns} iterations` : `${failures} failures`
    );
}

// Run all tests
console.log('='.repeat(60));
console.log('Property-Based Tests for Input Validation');
console.log('='.repeat(60));
console.log('');

testProperty1_ValidInputsAccepted();
testProperty2_InvalidInputsRejected_NonNumeric();
testProperty2_InvalidInputsRejected_ConversionsExceedVisitors();
testProperty2_InvalidInputsRejected_NegativeNumbers();
testEdgeCase_EmptyInputs();
testEdgeCase_ZeroValues();
testEdgeCase_ConversionsEqualVisitors();

console.log('');
console.log('='.repeat(60));
const passCount = testResults.filter(t => t.passed).length;
const failCount = testResults.filter(t => !t.passed).length;
console.log(`Results: ${passCount} passed, ${failCount} failed out of ${testResults.length} tests`);
console.log('='.repeat(60));

// Exit with appropriate code
if (typeof process !== 'undefined') {
    process.exit(failCount > 0 ? 1 : 0);
}
