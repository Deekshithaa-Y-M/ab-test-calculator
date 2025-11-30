# Implementation Plan

- [x] 1. Create HTML structure and basic styling




  - Create index.html with semantic structure for header, input cards, calculate button, and results section
  - Create styles.css with Inter font import, color scheme variables, and base layout styles
  - Implement two-column grid layout for input cards with responsive stacking
  - Style the calculate button as a prominent primary action
  - _Requirements: 1.1, 1.2, 2.1, 6.1, 6.2, 6.4_

- [x] 2. Implement input validation logic




  - Create validateInput function to check for non-negative numbers and conversions ≤ visitors
  - Add event listeners to input fields for real-time validation feedback
  - Implement state management to maintain previous valid values when invalid input is entered
  - _Requirements: 1.3, 1.4, 1.5_

- [x] 2.1 Write property test for input validation






  - **Property 1: Valid numeric inputs are accepted and stored**
  - **Property 2: Invalid inputs are rejected**
  - **Validates: Requirements 1.3, 1.4, 1.5**

- [x] 3. Implement conversion rate calculation





  - Create calculateConversionRate function using formula: (conversions / visitors) × 100
  - Add formatting logic to display rates with exactly one decimal place
  - Handle edge case where visitors = 0 to prevent division by zero
  - _Requirements: 3.1, 3.2, 3.3, 7.1_

- [x] 3.1 Write property test for conversion rate calculation





  - **Property 4: Conversion rates are formatted correctly**
  - **Property 5: Conversion rate formula is correct**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 4. Implement z-score calculation





  - Create calculateZScore function using two-proportion z-test formula
  - Calculate pooled proportion: p_pool = (x1 + x2) / (n1 + n2)
  - Calculate standard error: SE = sqrt(p_pool × (1 - p_pool) × (1/n1 + 1/n2))
  - Calculate z-score: z = (p1 - p2) / SE
  - Handle edge cases: zero visitors, zero conversions in both groups, identical rates
  - _Requirements: 4.2, 2.3, 2.4, 7.2_

- [x] 4.1 Write property test for z-score calculation






  - **Property 7: Z-score calculation is mathematically correct**
  - **Validates: Requirements 4.2**

- [x] 5. Implement confidence level calculation




  - Create normalCDF function to approximate cumulative distribution function of standard normal distribution
  - Create zScoreToConfidence function to convert z-score to confidence percentage
  - Format confidence level with no decimal places
  - _Requirements: 4.1, 4.3_

- [x] 5.1 Write property test for confidence calculation





  - **Property 6: Confidence level is formatted correctly**
  - **Property 8: Z-score to confidence conversion is correct**
  - **Validates: Requirements 4.1, 4.3**

- [x] 6. Implement results display and verdict logic





  - Create displayResults function to update DOM with conversion rates and confidence level
  - Create showVerdict function to display appropriate badge based on confidence threshold
  - Implement badge styling: green for confidence > 95%, grey for confidence ≤ 95%
  - Add badge text: "Significant Winner!" or "Not Significant yet"
  - _Requirements: 5.1, 5.2_

- [x] 6.1 Write property test for verdict badge logic






  - **Property 9: Verdict badge reflects confidence threshold**
  - **Validates: Requirements 5.1, 5.2**

- [x] 7. Implement calculate button functionality





  - Add click event listener to calculate button
  - Create performAnalysis function to orchestrate all calculations
  - Validate inputs before performing calculations
  - Display error messages for invalid inputs
  - Update results section with calculated values
  - _Requirements: 2.2_

- [x] 7.1 Write property test for calculation workflow






  - **Property 3: Calculations produce results for valid inputs**
  - **Validates: Requirements 2.2**

- [x] 8. Implement UI state management




  - Add input change event listeners to clear results when inputs are modified
  - Create clearResults function to reset results section
  - Ensure results only display after calculate button is clicked
  - _Requirements: 7.3_

- [x] 8.1 Write property test for state management






  - **Property 10: Input changes clear previous results**
  - **Validates: Requirements 7.3**

- [x] 9. Write unit tests for edge cases and UI elements






  - Test zero visitors edge case displays appropriate message
  - Test zero conversions in both groups shows 0% confidence
  - Test identical conversion rates show low confidence
  - Test UI elements exist on page load (cards, button, title)
  - Test styling is applied correctly (Inter font, colors)
  - _Requirements: 2.3, 2.4, 7.1, 7.2, 1.1, 1.2, 2.1, 6.1, 6.2, 6.4_

- [x] 10. Final polish and testing





  - Ensure all tests pass, ask the user if questions arise
  - Verify responsive behavior on different screen sizes
  - Test all edge cases manually in browser
  - Validate accessibility (keyboard navigation, screen reader compatibility)
  - _Requirements: All_
