# Arabic Obfuscation Tool

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python Version](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)

A specialized text and code obfuscation utility leveraging the unique characteristics of the Arabic script and Unicode presentation forms. This tool is designed for red-teaming, security research, filter evasion testing, and text encoding experimentation.

---

## 🚀 Overview

Many modern Large Language Models (LLMs), Content Moderation Systems, and Keyword Filters rely heavily on byte-level or keyword-based matching. By utilizing specific Arabic script anomalies, this tool allows you to obfuscate text so that it remains **human-readable** (and understandable by advanced Arabic-capable AI models) while successfully **bypassing traditional substring and regex filters**.

### Key Obfuscation Strategies

* **Arabic Presentation Forms (`U+FB50–FDFF`, `U+FE70–FEFF`):** Maps standard Arabic characters to their alternative presentation form codepoints (isolated, initial, medial, or final shapes). This is the Arabic script equivalent of a *Homoglyph Attack*.
* **Tatweel & Diacritic Insertion (`U+0640` / Combining Marks):** Dynamically injects Arabic elongation characters (*Tatweel*) and vowel marks (*Harakat*) that break string-matching patterns without degrading readability.
* **Zero-Width & Invisible Character Insertion:** Inserts non-printing characters inside standard words to disrupt signature-based detection mechanisms.

---

## 🛠 Features

- **Multiple Obfuscation Modes:** Choose between presentation forms, tatweel stretching, or a combined hybrid approach.
- **Deterministic Transforms:** Static (single-turn) encoding that requires no remote inference or API calls.
- **Reversible (De-obfuscation):** Easily restore the obfuscated text back to standard UTF-8 Arabic script.
- **Lightweight & High Performance:** Written in pure Python with minimal dependencies, making it perfect for integration into automated red-teaming pipelines.

---

## 📦 Installation

Clone the repository and navigate into the project directory:

```bash
git clone [https://github.com/mxiofc/Arabic-Obfuscation.git](https://github.com/mxiofc/Arabic-Obfuscation.git)
cd Arabic-Obfuscation
