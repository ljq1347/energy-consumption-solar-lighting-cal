# Solar Street Light Autonomy & Battery Sizing Calculator (V1.0 Beta)

This repository hosts a specialized, open-source energy balance and autonomy estimation tool tailored for the global solar PV lighting, off-grid solar street light, and integrated smart pole industries. It is designed to solve critical system under-sizing or excessive over-design problems caused by misaligned ratios of peak sun hours, PV module output, battery capacity, and luminaire power draw during preliminary project design phases.

---
 
1. Core Features & Technical Characteristics
  
1.1 Multi-Dimensional Energy Input
The system supports deep parametric configurations of the entire generation, storage, and consumption hardware stack for off-grid solar street lights:
 
- **Climate Data Input**: Supports inputting localized Peak Sun Hours (PSH) for the specific project site.
- **PV Array (Generation Side)**: Supports entering total solar panel quantity and individual module wattage (Watts).
- **Battery Bank (Storage Side)**: Supports entering total battery quantity, nominal voltage (Volts), and individual storage capacity (Watts / Wh).
- **LED Load (Consumption Side)**: Supports entering total lighting fixture quantity and individual operational power draw (Watts).
 
1.2 Multi-Scenario Autonomy Calculations
Upon execution, the underlying energy-balance computational core automatically outputs two core engineering metrics:
 
- **Max Nightly Running Hours**: Computes how many hours the accumulated daily solar energy conversion can sustain the lighting fixture running at full rated power during that specific night under standard peak sun hours.
- **Dawn to Dusk Nightly Matrix**: Tailored for the ubiquitous mandatory "Dawn to Dusk" requirements in international government tenders, the system reverse-calculates current configurations to verify whether they establish a 100% secure nightly illumination loop.

---
 
2. Disruption of Traditional Sizing Discrepancies & Analytical Efficiency
 
2.1 Verifying Discrepancies in Hardware Profiles
In traditional export and low-end street lighting markets, mismatched ratios between solar panel wattages and battery storage capacities frequently cause massive system blackouts when rainy days hit. This tool strips away the guesswork—by simply entering real physical parameters, users can instantly audited and review the actual operational days and performance thresholds of any proposed setup.
 
2.2 Eliminating Tedious Sizing Manual Workflows
Traditional Excel-based solar sizing methods are cumbersome, slow, and highly prone to formula errors. With this mobile-friendly tool, sales professionals or engineers on the field can instantly calculate and optimize the ideal hardware-to-software ratio on their phones for any client-specified solar window (e.g., 4.5 Peak Sun Hours).

---
 
3. Beta Phase & Compliance Disclaimer
 
3.1 Algorithmic Refinement and Roadmap
This is an **Open Beta (V1.0)** release. The current energy conversion matrix models an off-grid simulation based on ideal Coulombic efficiency and constant-current discharge curves. Future iterations will systematically introduce 20+ real-world environmental variables, including charge controller (MPPT/PWM) efficiency losses, battery Depth of Discharge (DOD), and seasonal temperature degradation coefficients, integrating them seamlessly into our comprehensive engineering toolkit matrix.
 
3.2 Legal & Engineering Disclaimer
Developed by the engineering division at opensolardesign.com, all calculation and simulation outputs are intended strictly for preliminary project scoping, technical pre-selection, and engineering validation. Due to variations in localized real-time weather conditions, system line losses, and physical hardware degradation over time, this tool cannot be utilized as the sole legal baseline for commercial system warranty commitments.

---
 
4. Open for Contributions
 
4.1 Global Engineering Collaboration
Off-grid energy storage and solar PV load forecasting involve intricate electrochemical and meteorological statistical dynamics. We warmly welcome solar PV engineers, microgrid specialists, lighting designers, and open-source algorithm enthusiasts globally to submit bug reports, engage in code refactoring, or propose enhancements for customized smart dimming profiles. Let's build a transparent, frictionless industrial computing ecosystem together.

---

## 🔗 Official Platform & B2B Commercial Inquiries

We have deeply cultivated our manufacturing and engineering expertise over many years across high-efficiency monocrystalline/polycrystalline solar panels, long-life Lithium Iron Phosphate (LiFePO4) battery banks, high-lumen outdoor LED street light modules, and specialized waterproof architectural systems.

If your project tenders require code-compliant **turnkey solar street light system configurations, volume-based factory-direct pricing, customized OEM/ODM engineering, or strategic component sourcing**, please visit our official platform or connect directly with our commercial division:

* 🌐 **Official Engineering Hub**: [opensolardesign.com](https://opensolardesign.com)
* 📩 **B2B Procurement & Global RFQs**: [sales@opensolardesign.com](mailto:sales@opensolardesign.com)
