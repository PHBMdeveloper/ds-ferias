## 2026-03-21 - [Formula Injection in CSV Exports]
**Vulnerability:** Reports generated via CSV were inserting user-controlled inputs (like names, emails, departments) directly into cells without escaping leading characters that trigger formulas.
**Learning:** Malicious inputs starting with '=', '+', '-', '@', '	', or '' could lead to formula execution when opened in Excel or Calc, posing a risk in a corporate environment.
**Prevention:** Apply a utility function (`escapeCsvFormulas`) to prepend a single quote (`'`) to any string fields that start with these characters before outputting them in the CSV row generation logic.
