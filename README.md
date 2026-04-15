# 🧪 A/B Test Statistical Significance Calculator


A robust, web-based utility designed to calculate the statistical significance of A/B tests. This tool allows product managers, marketers, and data analysts to input visitor and conversion data for a Control and Variant group to instantly determine if a change yielded a statistically significant improvement.

## 🚀 Features

* **Instant Calculation:** Calculates Conversion Rate, Uplift, P-Value, and Statistical Significance.
* **Rigorous Testing Suite:** Built with a strong emphasis on Software Quality Assurance (QA). Includes comprehensive unit testing and property-based testing using **Jest** to ensure calculations are accurate across all edge cases.
* **Clean UI:** A simple, intuitive, and responsive frontend built with vanilla HTML, CSS, and JavaScript.

## 🧮 The Math Behind the Code

The calculator uses a two-proportion Z-test to determine statistical significance. The Z-score is calculated using the following formula:

$Z = \frac{p_1 - p_2}{\sqrt{p(1-p)(\frac{1}{n_1} + \frac{1}{n_2})}}$

Where:
* $p_1$ and $p_2$ are the sample proportions (conversion rates) of the control and variant.
* $n_1$ and $n_2$ are the sample sizes (total visitors).
* $p$ is the pooled sample proportion.

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3, Vanilla JavaScript
* **Testing:** Jest (Unit & Property-Based Testing)

## 💻 Local Setup & Installation

To run this project and execute the test suite locally, follow these steps:

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/Deekshithaa-Y-M/ab-test-calculator.git](https://github.com/Deekshithaa-Y-M/ab-test-calculator.git)
   cd ab-test-calculator
