# Design Document

## Overview

The A/B Test Significance Calculator is a single-page web application built with vanilla HTML, CSS, and JavaScript. The application provides a clean, intuitive interface for marketers to input A/B test data and receive immediate statistical analysis. The system uses the two-proportion z-test to determine statistical significance and presents results with clear visual indicators.

The application follows a simple architecture with no external dependencies beyond the Inter font from Google Fonts. All calculations are performed client-side using standard JavaScript math operations.

## Architecture

The application follows a simple client-side architecture with three main layers:

1. **Presentation Layer (HTML/CSS)**: Defines the structure and styling of the user interface
2. **Business Logic Layer (JavaScript)**: Handles calculations, validation, and state management
3. **DOM Manipulation Layer (JavaScript)**: Updates the UI based on user interactions and calculation results

The application uses an event-driven model where user interactions trigger calculations and UI updates. No server-side processing or data persistence is required.

## Components and Interfaces

### HTML Structure

- **Container**: Main wrapper with centered layout
- **Header**: Title section
- **Input Section**: Two-column grid containing input cards
  - Control Card (Group A)
  - Variant Card (Group B)
- **Calculate Button**: Primary action button
- **Results Section**: Display area for calculated metrics and verdict

### CSS Styling

- **Typography**: Inter font family from Google Fonts
- **Color Scheme**:
  - Background: Light gray (#f5f5f5 or similar)
  - Cards: White (#ffffff)
  - Primary button: Blue accent color
  - Success badge: Green (#10b981 or similar)
  - Neutral badge: Gray (#6b7280 or similar)
- **Layout**: Flexbox and CSS Grid for responsive positioning
- **Spacing**: Consistent padding and margins following 8px grid system

### JavaScript Modules

#### Input Validation Module
- `validateInput(visitors, conversions)`: Validates that inputs are non-negative numbers and conversions ≤ visitors
- Returns: `{valid: boolean, error: string}`

#### Statistical Calculation Module
- `calculateConversionRate(conversions, visitors)`: Computes conversion rate as percentage
- `calculateZScore(controlVisitors, controlConversions, variantVisitors, variantConversions)`: Computes two-proportion z-score
- `zScoreToConfidence(zScore)`: Converts z-score to confidence percentage using normal distribution
- `performAnalysis(controlData, variantData)`: Orchestrates all calculations

#### UI Update Module
- `displayResults(results)`: Updates DOM with calculated values
- `showVerdict(confidence)`: Displays appropriate badge based on confidence level
- `clearResults()`: Resets results section
- `showError(message)`: Displays error messages to user

## Data Models

### Input Data Structure
```javascript
{
  control: {
    visitors: number,
    conversions: number
  },
  variant: {
    visitors: number,
    conversions: number
  }
}
```

### Results Data Structure
```javascript
{
  controlRate: number,      // Percentage with 1 decimal
  variantRate: number,      // Percentage with 1 decimal
  confidence: number,       // Percentage with 0 decimals
  isSignificant: boolean    // true if confidence > 95
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Valid numeric inputs are accepted and stored
*For any* valid numeric values for visitors and conversions (where conversions ≤ visitors), entering these values into the input fields should result in the values being stored and available for calculation.
**Validates: Requirements 1.3**

### Property 2: Invalid inputs are rejected
*For any* non-numeric input or conversion count greater than visitor count, the system should reject the input and maintain the previous valid state.
**Validates: Requirements 1.4, 1.5**

### Property 3: Calculations produce results for valid inputs
*For any* valid input data (positive visitors, conversions ≤ visitors), clicking the calculate button should compute and display conversion rates, z-score, and confidence level without errors.
**Validates: Requirements 2.2**

### Property 4: Conversion rates are formatted correctly
*For any* calculated conversion rate, the displayed value should be formatted as a percentage with exactly one decimal place.
**Validates: Requirements 3.1, 3.2**

### Property 5: Conversion rate formula is correct
*For any* group with visitors and conversions, the conversion rate should equal (conversions / visitors) × 100.
**Validates: Requirements 3.3**

### Property 6: Confidence level is formatted correctly
*For any* calculated confidence level, the displayed value should be formatted as a percentage with no decimal places.
**Validates: Requirements 4.1**

### Property 7: Z-score calculation is mathematically correct
*For any* two groups with valid data, the z-score should be calculated using the standard two-proportion z-test formula: z = (p1 - p2) / sqrt(p_pool × (1 - p_pool) × (1/n1 + 1/n2)), where p_pool = (x1 + x2) / (n1 + n2).
**Validates: Requirements 4.2**

### Property 8: Z-score to confidence conversion is correct
*For any* z-score value, the confidence percentage should be calculated using the cumulative distribution function of the standard normal distribution.
**Validates: Requirements 4.3**

### Property 9: Verdict badge reflects confidence threshold
*For any* calculated confidence level, if confidence > 95% the system should display a green "Significant Winner!" badge, otherwise it should display a grey "Not Significant yet" badge.
**Validates: Requirements 5.1, 5.2**

### Property 10: Input changes clear previous results
*For any* displayed results, when any input value changes, the results section should be cleared until the calculate button is clicked again.
**Validates: Requirements 7.3**

## Error Handling

The application must handle several edge cases gracefully:

1. **Zero Visitors**: When either group has zero visitors, prevent division by zero by:
   - Displaying a user-friendly message
   - Setting conversion rate to 0% or showing "N/A"
   - Disabling calculation or showing confidence as 0%

2. **Zero Conversions**: When both groups have zero conversions:
   - Display 0.0% conversion rate for both
   - Set confidence to 0% (no difference to detect)

3. **Identical Rates**: When both groups have identical conversion rates:
   - Calculate z-score as 0
   - Display confidence near 0% (no significant difference)

4. **Invalid Inputs**: When users enter invalid data:
   - Prevent form submission
   - Show inline validation messages
   - Highlight problematic fields

5. **NaN Prevention**: All mathematical operations must check for potential NaN results and handle them explicitly.

## Testing Strategy

The application will use a dual testing approach combining unit tests and property-based tests.

### Unit Testing

Unit tests will verify:
- Specific UI elements exist on page load (input cards, calculate button, title)
- Specific styling is applied (Inter font, white cards, light gray background)
- Edge cases like zero visitors and identical conversion rates
- Error message display for invalid inputs

Unit tests will use a simple testing framework or manual browser testing, as this is a small application.

### Property-Based Testing

Property-based tests will verify universal properties using **fast-check** (a JavaScript property-based testing library). Each test will run a minimum of 100 iterations with randomly generated inputs.

Property tests will verify:
- Input validation works correctly across all valid and invalid input combinations
- Conversion rate calculations are mathematically correct for all input values
- Z-score calculations follow the correct formula for all input combinations
- Confidence level conversions are accurate for all z-score values
- Badge display logic correctly reflects confidence thresholds for all confidence values
- UI state management (clearing results on input change) works consistently

Each property-based test will be tagged with a comment in this format:
```javascript
// **Feature: ab-test-calculator, Property 1: Valid numeric inputs are accepted and stored**
```

This ensures traceability between the design document's correctness properties and the implemented tests.

### Test Organization

- Unit tests: `ab-test-calculator.test.js` or inline in HTML for manual testing
- Property-based tests: `ab-test-calculator.properties.test.js`
- Test utilities: Helper functions for DOM manipulation and assertion

## Implementation Notes

### Two-Proportion Z-Test Formula

The z-score calculation follows this formula:

```
p1 = conversions1 / visitors1
p2 = conversions2 / visitors2
p_pool = (conversions1 + conversions2) / (visitors1 + visitors2)
SE = sqrt(p_pool × (1 - p_pool) × (1/visitors1 + 1/visitors2))
z = (p1 - p2) / SE
```

### Normal Distribution Approximation

For converting z-score to confidence percentage, use the error function (erf) approximation or a lookup table for the cumulative distribution function. JavaScript implementation:

```javascript
function normalCDF(z) {
  // Approximation using error function
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1 - prob : prob;
}

function zScoreToConfidence(z) {
  // Two-tailed test: confidence = 2 × CDF(|z|) - 1
  return (2 * normalCDF(Math.abs(z)) - 1) * 100;
}
```

### Responsive Design Considerations

While not explicitly required, the design should gracefully adapt to different screen sizes:
- Stack input cards vertically on mobile devices
- Maintain readability at all viewport sizes
- Ensure touch-friendly button sizes

## File Structure

```
ab-test-calculator/
├── index.html           # Main HTML structure
├── styles.css           # All styling
├── calculator.js        # Core calculation logic
└── tests/
    ├── unit.test.js     # Unit tests
    └── properties.test.js # Property-based tests
```

All files can be served statically without a build process or server-side logic.
