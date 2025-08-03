# 🛰️ DRIFT — Neural Mouse Tracking for Cognitive Health

## 📌 Overview
Drift is a browser extension and interactive simulation that analyzes **mouse movements and clicks** to surface **ADHD-like behavioral patterns**. By tracking metrics such as reaction time, path efficiency, and motion variability, Drift applies a **machine learning model trained on real ADHD datasets** to provide a **probability score** of ADHD-like signals.

⚠️ **Disclaimer**: Drift is a research prototype — not a medical diagnosis tool.

---

## ✨ Features
- 🖱️ **Mouse Tracking**: Captures cursor paths, velocities, accelerations, and click events.
- 🧠 **Behavioral Analytics**: Calculates metrics like reaction time, path deviation, and movement variability.
- 🤖 **Machine Learning Integration**: Sends data to a Flask API serving a logistic regression model trained on ADHD research datasets.
- 📊 **Visualization**: Live dashboard with performance metrics + probability bar for ADHD likelihood.
- 🎮 **Interactive Simulation**: A cyberpunk‑styled click‑to‑target game designed to reveal attention patterns.

---

## ⚙️ How It Works
1. Install the Drift Chrome extension and launch the simulation interface.  
2. Play the **click‑to‑target game** or browse normally — mouse and click data are collected.  
3. Extracted features are sent to the **Flask backend API**.  
4. The trained model returns a **probability score** (Low / Moderate / High ADHD‑like signals).  
5. Results are displayed on the dashboard with a **dynamic progress bar**.  

---

## 🛠 Tech Stack
- **Frontend**: HTML, CSS, Vanilla JavaScript  
- **Extension**: Chrome Extension APIs  
- **Backend**: Python (Flask + scikit‑learn + joblib)  
- **Datasets**:  
  - The Attentive Cursor Dataset  
  - ADHD Mouse Tracking Dataset (PLOS One, 2019)  

---

## 🚀 Installation
### 1. Extension
- Clone this repo  
- Go to `chrome://extensions/` in Chrome  
- Enable **Developer Mode**  
- Click **Load unpacked** → select the Drift project folder  
- Launch Drift from the Chrome extensions bar  

### 2. Backend Model API
- Install Python requirements:
  ```bash
  pip install flask flask-cors scikit-learn joblib
