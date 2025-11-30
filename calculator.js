// A/B Test Significance Calculator

// State management - store previous valid values
const state = {
    controlVisitors: '',
    controlConversions: '',
    variantVisitors: '',
    variantConversions: ''
};

/**
 * Validates input values for visitors and conversions
 * @param {string|number} visitors - Number of visitors
 * @param {string|number} conversions - Number of conversions
 * @returns {{valid: boolean, error: string}} Validation result
 */
function validateInput(visitors, conversions) {
    // Convert to numbers
    const v = Number(visitors);
    const c = Number(conversions);
    
    // Check if inputs are valid numbers
    if (visitors === '' || conversions === '') {
        return { valid: true, error: '' }; // Empty inputs are allowed (user is typing)
    }
    
    if (isNaN(v) || isNaN(c)) {
        return { valid: false, error: 'Please enter valid numbers' };
    }
    
    // Check for non-negative numbers
    if (v < 0 || c < 0) {
        return { valid: false, error: 'Values must be non-negative' };
    }
    
    // Check that conversions <= visitors
    if (c > v) {
        return { valid: false, error: 'Conversions cannot exceed visitors' };
    }
    
    return { valid: true, error: '' };
}

/**
 * Calculates conversion rate as a percentage
 * @param {number} conversions - Number of conversions
 * @param {number} visitors - Number of visitors
 * @returns {number} Conversion rate as percentage with one decimal place, or 0 if visitors is 0
 */
function calculateConversionRate(conversions, visitors) {
    // Handle edge case where visitors = 0 to prevent division by zero
    if (visitors === 0) {
        return 0.0;
    }
    
    // Calculate conversion rate: (conversions / visitors) × 100
    const rate = (conversions / visitors) * 100;
    
    // Format to exactly one decimal place
    return Number(rate.toFixed(1));
}

/**
 * Calculates z-score using two-proportion z-test formula
 * @param {number} controlVisitors - Number of visitors in control group (n1)
 * @param {number} controlConversions - Number of conversions in control group (x1)
 * @param {number} variantVisitors - Number of visitors in variant group (n2)
 * @param {number} variantConversions - Number of conversions in variant group (x2)
 * @returns {number} Z-score value, or 0 for edge cases
 */
function calculateZScore(controlVisitors, controlConversions, variantVisitors, variantConversions) {
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
}

/**
 * Approximates the cumulative distribution function of the standard normal distribution
 * Uses the Abramowitz and Stegun approximation
 * @param {number} z - Z-score value
 * @returns {number} Cumulative probability for the given z-score
 */
function normalCDF(z) {
    // Approximation using error function
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp(-z * z / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1 - prob : prob;
}

/**
 * Converts z-score to confidence percentage
 * Uses two-tailed test: confidence = 2 × CDF(|z|) - 1
 * @param {number} zScore - Z-score value from two-proportion z-test
 * @returns {number} Confidence level as percentage with no decimal places
 */
function zScoreToConfidence(zScore) {
    // Two-tailed test: confidence = 2 × CDF(|z|) - 1
    const confidence = (2 * normalCDF(Math.abs(zScore)) - 1) * 100;
    
    // Format with no decimal places
    return Math.round(confidence);
}

/**
 * Handles input validation and updates state
 * @param {HTMLInputElement} visitorsInput - Visitors input element
 * @param {HTMLInputElement} conversionsInput - Conversions input element
 * @param {string} groupType - 'control' or 'variant'
 */
function handleInputValidation(visitorsInput, conversionsInput, groupType) {
    const visitors = visitorsInput.value;
    const conversions = conversionsInput.value;
    
    const validation = validateInput(visitors, conversions);
    
    if (validation.valid) {
        // Store valid values in state
        if (groupType === 'control') {
            state.controlVisitors = visitors;
            state.controlConversions = conversions;
        } else {
            state.variantVisitors = visitors;
            state.variantConversions = conversions;
        }
        
        // Remove error styling
        visitorsInput.classList.remove('input-error');
        conversionsInput.classList.remove('input-error');
        
        // Remove error message if exists
        const errorMsg = visitorsInput.parentElement.parentElement.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.remove();
        }
    } else {
        // Restore previous valid values
        if (groupType === 'control') {
            visitorsInput.value = state.controlVisitors;
            conversionsInput.value = state.controlConversions;
        } else {
            visitorsInput.value = state.variantVisitors;
            conversionsInput.value = state.variantConversions;
        }
        
        // Add error styling
        visitorsInput.classList.add('input-error');
        conversionsInput.classList.add('input-error');
        
        // Show error message
        showInputError(visitorsInput.parentElement.parentElement, validation.error);
    }
}

/**
 * Displays error message in the input card
 * @param {HTMLElement} cardElement - The input card element
 * @param {string} message - Error message to display
 */
function showInputError(cardElement, message) {
    // Remove existing error message
    const existingError = cardElement.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Create and append new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    cardElement.appendChild(errorDiv);
}

/**
 * Displays calculation results in the DOM
 * Updates conversion rates and confidence level in the results section
 * @param {Object} results - Results object containing controlRate, variantRate, and confidence
 * @param {number} results.controlRate - Control group conversion rate (percentage with 1 decimal)
 * @param {number} results.variantRate - Variant group conversion rate (percentage with 1 decimal)
 * @param {number} results.confidence - Confidence level (percentage with 0 decimals)
 */
function displayResults(results) {
    // Get result elements
    const controlRateElement = document.getElementById('control-rate');
    const variantRateElement = document.getElementById('variant-rate');
    const confidenceLevelElement = document.getElementById('confidence-level');
    const resultsSection = document.getElementById('results-section');
    
    // Update DOM with conversion rates (formatted with 1 decimal place)
    controlRateElement.textContent = `${results.controlRate.toFixed(1)}%`;
    variantRateElement.textContent = `${results.variantRate.toFixed(1)}%`;
    
    // Update DOM with confidence level (formatted with no decimal places)
    confidenceLevelElement.textContent = `${results.confidence}%`;
    
    // Show the results section
    resultsSection.classList.remove('hidden');
    
    // Display verdict badge
    showVerdict(results.confidence);
}

/**
 * Displays appropriate verdict badge based on confidence threshold
 * Green badge for confidence > 95%, grey badge for confidence ≤ 95%
 * @param {number} confidence - Confidence level as percentage
 */
function showVerdict(confidence) {
    const verdictBadge = document.getElementById('verdict-badge');
    
    // Clear existing classes
    verdictBadge.classList.remove('significant', 'not-significant');
    
    // Apply appropriate styling and text based on confidence threshold
    if (confidence > 95) {
        // Green badge for significant results
        verdictBadge.classList.add('significant');
        verdictBadge.textContent = 'Significant Winner!';
    } else {
        // Grey badge for non-significant results
        verdictBadge.classList.add('not-significant');
        verdictBadge.textContent = 'Not Significant yet';
    }
}

/**
 * Clears the results section and hides it
 * Resets all result values to default state
 */
function clearResults() {
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
}

/**
 * Displays error message in the results section
 * @param {string} message - Error message to display
 */
function showError(message) {
    const resultsSection = document.getElementById('results-section');
    const resultsContent = resultsSection.querySelector('.results-content');
    
    // Clear any existing content
    resultsContent.innerHTML = '';
    
    // Create error message element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    resultsContent.appendChild(errorDiv);
    
    // Show the results section
    resultsSection.classList.remove('hidden');
}

/**
 * Orchestrates all calculations and updates the UI with results
 * Validates inputs, performs statistical analysis, and displays results
 * @param {Object} controlData - Control group data
 * @param {number} controlData.visitors - Number of visitors in control group
 * @param {number} controlData.conversions - Number of conversions in control group
 * @param {Object} variantData - Variant group data
 * @param {number} variantData.visitors - Number of visitors in variant group
 * @param {number} variantData.conversions - Number of conversions in variant group
 * @returns {Object|null} Results object or null if validation fails
 */
function performAnalysis(controlData, variantData) {
    // Validate control group inputs
    const controlValidation = validateInput(controlData.visitors, controlData.conversions);
    if (!controlValidation.valid) {
        showError(`Control Group Error: ${controlValidation.error}`);
        return null;
    }
    
    // Validate variant group inputs
    const variantValidation = validateInput(variantData.visitors, variantData.conversions);
    if (!variantValidation.valid) {
        showError(`Variant Group Error: ${variantValidation.error}`);
        return null;
    }
    
    // Check for empty inputs
    if (controlData.visitors === '' || controlData.conversions === '' || 
        variantData.visitors === '' || variantData.conversions === '') {
        showError('Please enter values for all fields');
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
    
    // Display results
    displayResults(results);
    
    return results;
}

// Initialize event listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Get input elements
    const controlVisitorsInput = document.getElementById('control-visitors');
    const controlConversionsInput = document.getElementById('control-conversions');
    const variantVisitorsInput = document.getElementById('variant-visitors');
    const variantConversionsInput = document.getElementById('variant-conversions');
    const calculateButton = document.getElementById('calculate-btn');
    
    // Add event listeners for Control group
    controlVisitorsInput.addEventListener('input', function() {
        handleInputValidation(controlVisitorsInput, controlConversionsInput, 'control');
        clearResults(); // Clear results when input changes
    });
    
    controlConversionsInput.addEventListener('input', function() {
        handleInputValidation(controlVisitorsInput, controlConversionsInput, 'control');
        clearResults(); // Clear results when input changes
    });
    
    // Add event listeners for Variant group
    variantVisitorsInput.addEventListener('input', function() {
        handleInputValidation(variantVisitorsInput, variantConversionsInput, 'variant');
        clearResults(); // Clear results when input changes
    });
    
    variantConversionsInput.addEventListener('input', function() {
        handleInputValidation(variantVisitorsInput, variantConversionsInput, 'variant');
        clearResults(); // Clear results when input changes
    });
    
    // Add click event listener to calculate button
    calculateButton.addEventListener('click', function() {
        // Get current input values
        const controlData = {
            visitors: controlVisitorsInput.value,
            conversions: controlConversionsInput.value
        };
        
        const variantData = {
            visitors: variantVisitorsInput.value,
            conversions: variantConversionsInput.value
        };
        
        // Perform analysis and display results
        performAnalysis(controlData, variantData);
    });
    
    console.log('A/B Test Calculator loaded - Input validation and calculate button active');
});
