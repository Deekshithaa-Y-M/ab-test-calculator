/**
 * Unit Tests for A/B Test Significance Calculator
 * Tests edge cases and UI elements
 * Requirements: 2.3, 2.4, 7.1, 7.2, 1.1, 1.2, 2.1, 6.1, 6.2, 6.4
 * 
 * @jest-environment jsdom
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load HTML and CSS for testing
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, './styles.css'), 'utf8');
const calculatorJS = fs.readFileSync(path.resolve(__dirname, './calculator.js'), 'utf8');

// Setup DOM environment
function setupDOM() {
  // Parse and set up the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  document.documentElement.innerHTML = doc.documentElement.innerHTML;
  
  // Inject CSS for styling tests
  const styleElement = document.createElement('style');
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
  
  // Execute calculator.js in the global scope
  const scriptElement = document.createElement('script');
  scriptElement.textContent = calculatorJS;
  document.body.appendChild(scriptElement);
  
  // Trigger DOMContentLoaded event to initialize the calculator
  const event = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
  document.dispatchEvent(event);
}

describe('Edge Case Tests', () => {
  beforeEach(() => {
    setupDOM();
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });
  
  // Requirement 2.3: Zero visitors edge case
  test('Zero visitors in control group displays appropriate message or default values', () => {
    const controlVisitors = document.getElementById('control-visitors');
    const controlConversions = document.getElementById('control-conversions');
    const variantVisitors = document.getElementById('variant-visitors');
    const variantConversions = document.getElementById('variant-conversions');
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Set zero visitors in control group
    controlVisitors.value = '0';
    controlConversions.value = '0';
    variantVisitors.value = '100';
    variantConversions.value = '50';
    
    // Click calculate button
    calculateBtn.click();
    
    // Check that results are displayed without NaN
    const controlRate = document.getElementById('control-rate').textContent;
    const variantRate = document.getElementById('variant-rate').textContent;
    const confidenceLevel = document.getElementById('confidence-level').textContent;
    
    // Should not contain NaN
    expect(controlRate).not.toContain('NaN');
    expect(variantRate).not.toContain('NaN');
    expect(confidenceLevel).not.toContain('NaN');
    
    // Control rate should be 0.0% (zero visitors edge case)
    expect(controlRate).toBe('0.0%');
    
    // Confidence should be 0% (can't compare with zero visitors)
    expect(confidenceLevel).toBe('0%');
  });
  
  test('Zero visitors in variant group displays appropriate message or default values', () => {
    const controlVisitors = document.getElementById('control-visitors');
    const controlConversions = document.getElementById('control-conversions');
    const variantVisitors = document.getElementById('variant-visitors');
    const variantConversions = document.getElementById('variant-conversions');
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Set zero visitors in variant group
    controlVisitors.value = '100';
    controlConversions.value = '50';
    variantVisitors.value = '0';
    variantConversions.value = '0';
    
    // Click calculate button
    calculateBtn.click();
    
    // Check that results are displayed without NaN
    const controlRate = document.getElementById('control-rate').textContent;
    const variantRate = document.getElementById('variant-rate').textContent;
    const confidenceLevel = document.getElementById('confidence-level').textContent;
    
    // Should not contain NaN
    expect(controlRate).not.toContain('NaN');
    expect(variantRate).not.toContain('NaN');
    expect(confidenceLevel).not.toContain('NaN');
    
    // Variant rate should be 0.0% (zero visitors edge case)
    expect(variantRate).toBe('0.0%');
    
    // Confidence should be 0% (can't compare with zero visitors)
    expect(confidenceLevel).toBe('0%');
  });
  
  // Requirement 2.4: Zero conversions in both groups
  test('Zero conversions in both groups shows 0% confidence', () => {
    const controlVisitors = document.getElementById('control-visitors');
    const controlConversions = document.getElementById('control-conversions');
    const variantVisitors = document.getElementById('variant-visitors');
    const variantConversions = document.getElementById('variant-conversions');
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Set zero conversions in both groups
    controlVisitors.value = '100';
    controlConversions.value = '0';
    variantVisitors.value = '100';
    variantConversions.value = '0';
    
    // Click calculate button
    calculateBtn.click();
    
    // Check conversion rates are 0.0%
    const controlRate = document.getElementById('control-rate').textContent;
    const variantRate = document.getElementById('variant-rate').textContent;
    expect(controlRate).toBe('0.0%');
    expect(variantRate).toBe('0.0%');
    
    // Check confidence level is 0%
    const confidenceLevel = document.getElementById('confidence-level').textContent;
    expect(confidenceLevel).toBe('0%');
    
    // Verify verdict badge shows "Not Significant yet"
    const verdictBadge = document.getElementById('verdict-badge');
    expect(verdictBadge.textContent).toBe('Not Significant yet');
    expect(verdictBadge.classList.contains('not-significant')).toBe(true);
  });
  
  // Requirement 7.2: Identical conversion rates
  test('Identical conversion rates show low confidence', () => {
    const controlVisitors = document.getElementById('control-visitors');
    const controlConversions = document.getElementById('control-conversions');
    const variantVisitors = document.getElementById('variant-visitors');
    const variantConversions = document.getElementById('variant-conversions');
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Set identical conversion rates (50% in both groups)
    controlVisitors.value = '100';
    controlConversions.value = '50';
    variantVisitors.value = '100';
    variantConversions.value = '50';
    
    // Click calculate button
    calculateBtn.click();
    
    // Check conversion rates are identical
    const controlRate = document.getElementById('control-rate').textContent;
    const variantRate = document.getElementById('variant-rate').textContent;
    expect(controlRate).toBe('50.0%');
    expect(variantRate).toBe('50.0%');
    
    // Check confidence level is low (should be 0% for identical rates)
    const confidenceLevel = document.getElementById('confidence-level').textContent;
    expect(confidenceLevel).toBe('0%');
    
    // Verify verdict badge shows "Not Significant yet"
    const verdictBadge = document.getElementById('verdict-badge');
    expect(verdictBadge.textContent).toBe('Not Significant yet');
    expect(verdictBadge.classList.contains('not-significant')).toBe(true);
  });
});

describe('UI Elements Tests', () => {
  beforeEach(() => {
    setupDOM();
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });
  
  // Requirement 1.1: Two input cards labeled correctly
  test('UI displays two input cards labeled "Group A (Control)" and "Group B (Variant)"', () => {
    const inputCards = document.querySelectorAll('.input-card');
    
    // Should have exactly 2 input cards
    expect(inputCards.length).toBe(2);
    
    // Check labels
    const controlCard = inputCards[0];
    const variantCard = inputCards[1];
    
    expect(controlCard.querySelector('h2').textContent).toBe('Group A (Control)');
    expect(variantCard.querySelector('h2').textContent).toBe('Group B (Variant)');
  });
  
  // Requirement 1.2: Input fields for Visitors and Conversions
  test('Each input card provides input fields for "Visitors" and "Conversions"', () => {
    const inputCards = document.querySelectorAll('.input-card');
    
    inputCards.forEach(card => {
      const labels = card.querySelectorAll('label');
      const inputs = card.querySelectorAll('input');
      
      // Should have 2 labels and 2 inputs
      expect(labels.length).toBe(2);
      expect(inputs.length).toBe(2);
      
      // Check label text
      expect(labels[0].textContent).toBe('Visitors');
      expect(labels[1].textContent).toBe('Conversions');
      
      // Check input types
      expect(inputs[0].type).toBe('number');
      expect(inputs[1].type).toBe('number');
    });
  });
  
  // Requirement 2.1: Prominent calculate button
  test('UI provides a prominent calculate button', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Button should exist
    expect(calculateBtn).not.toBeNull();
    
    // Button should have correct text
    expect(calculateBtn.textContent).toBe('Calculate Significance');
    
    // Button should have calculate-button class
    expect(calculateBtn.classList.contains('calculate-button')).toBe(true);
  });
  
  // Requirement 6.4: Title display
  test('UI displays "A/B Test Significance Calculator" prominently at the top', () => {
    const title = document.querySelector('header h1');
    
    // Title should exist
    expect(title).not.toBeNull();
    
    // Title should have correct text
    expect(title.textContent).toBe('A/B Test Significance Calculator');
  });
  
  // Requirement 6.1, 6.2: Results section structure
  test('UI has results section with conversion rates and confidence level', () => {
    const resultsSection = document.getElementById('results-section');
    
    // Results section should exist
    expect(resultsSection).not.toBeNull();
    
    // Should have result elements
    const controlRate = document.getElementById('control-rate');
    const variantRate = document.getElementById('variant-rate');
    const confidenceLevel = document.getElementById('confidence-level');
    const verdictBadge = document.getElementById('verdict-badge');
    
    expect(controlRate).not.toBeNull();
    expect(variantRate).not.toBeNull();
    expect(confidenceLevel).not.toBeNull();
    expect(verdictBadge).not.toBeNull();
  });
});

describe('Styling Tests', () => {
  beforeEach(() => {
    setupDOM();
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });
  
  // Requirement 6.1: Inter font family
  test('Application uses Inter font family', () => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    
    // Check that Inter font is specified
    const fontFamily = computedStyle.fontFamily;
    expect(fontFamily).toContain('Inter');
  });
  
  // Requirement 6.2: White cards on light gray background
  test('Input cards have white backgrounds', () => {
    const inputCards = document.querySelectorAll('.input-card');
    
    inputCards.forEach(card => {
      const computedStyle = window.getComputedStyle(card);
      const backgroundColor = computedStyle.backgroundColor;
      
      // Should be white or close to white (rgb(255, 255, 255))
      expect(backgroundColor).toMatch(/rgb\(255,\s*255,\s*255\)/);
    });
  });
  
  test('Page has light gray background', () => {
    const body = document.body;
    const computedStyle = window.getComputedStyle(body);
    const backgroundColor = computedStyle.backgroundColor;
    
    // Should be light gray (not white, not dark)
    // The CSS uses #f5f5f5 which is rgb(245, 245, 245)
    expect(backgroundColor).toMatch(/rgb\(245,\s*245,\s*245\)/);
  });
  
  // Requirement 6.3: Calculate button styling
  test('Calculate button has primary blue styling', () => {
    const calculateBtn = document.getElementById('calculate-btn');
    const computedStyle = window.getComputedStyle(calculateBtn);
    
    // Should have blue background (primary color)
    const backgroundColor = computedStyle.backgroundColor;
    // CSS uses #3b82f6 which is rgb(59, 130, 246)
    expect(backgroundColor).toMatch(/rgb\(59,\s*130,\s*246\)/);
    
    // Should have white text
    const color = computedStyle.color;
    expect(color).toMatch(/rgb\(255,\s*255,\s*255\)/);
  });
  
  // Requirement 6.3: Verdict badge colors
  test('Significant verdict badge has green styling', () => {
    const controlVisitors = document.getElementById('control-visitors');
    const controlConversions = document.getElementById('control-conversions');
    const variantVisitors = document.getElementById('variant-visitors');
    const variantConversions = document.getElementById('variant-conversions');
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Set values that will produce high confidence (>95%)
    controlVisitors.value = '1000';
    controlConversions.value = '100';
    variantVisitors.value = '1000';
    variantConversions.value = '200';
    
    // Click calculate button
    calculateBtn.click();
    
    // Check verdict badge styling
    const verdictBadge = document.getElementById('verdict-badge');
    expect(verdictBadge.classList.contains('significant')).toBe(true);
    
    const computedStyle = window.getComputedStyle(verdictBadge);
    const backgroundColor = computedStyle.backgroundColor;
    
    // Should have green background (#10b981 = rgb(16, 185, 129))
    expect(backgroundColor).toMatch(/rgb\(16,\s*185,\s*129\)/);
  });
  
  test('Not significant verdict badge has gray styling', () => {
    const controlVisitors = document.getElementById('control-visitors');
    const controlConversions = document.getElementById('control-conversions');
    const variantVisitors = document.getElementById('variant-visitors');
    const variantConversions = document.getElementById('variant-conversions');
    const calculateBtn = document.getElementById('calculate-btn');
    
    // Set values that will produce low confidence (<=95%)
    controlVisitors.value = '100';
    controlConversions.value = '50';
    variantVisitors.value = '100';
    variantConversions.value = '50';
    
    // Click calculate button
    calculateBtn.click();
    
    // Check verdict badge styling
    const verdictBadge = document.getElementById('verdict-badge');
    expect(verdictBadge.classList.contains('not-significant')).toBe(true);
    
    const computedStyle = window.getComputedStyle(verdictBadge);
    const backgroundColor = computedStyle.backgroundColor;
    
    // Should have gray background (#6b7280 = rgb(107, 114, 128))
    expect(backgroundColor).toMatch(/rgb\(107,\s*114,\s*128\)/);
  });
});
