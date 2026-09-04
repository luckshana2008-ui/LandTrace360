# 🌍 LandTrace360

## Intelligent Land Digital Twin, History & Risk Prediction Platform

**LandTrace360** is a web-based land intelligence platform designed to provide a centralized view of land information, ownership history, documents, legal records, mortgage information, boundary changes, fragmentation, and AI-assisted risk analysis.

The platform creates a **digital profile of a land parcel** and helps users understand its historical and current information through an interactive dashboard.

> **Note:** This project uses synthetic/demo land records for educational and demonstration purposes. It is not connected to real government land records and does not provide legal, financial, or cadastral advice.

---

## 🎯 Problem Statement

Land-related information is often distributed across different documents and sources, making it difficult for users to understand the complete history and potential risks associated with a property.

LandTrace360 aims to provide a single platform where users can explore:

* Land details
* Ownership history
* Documents
* Legal cases
* Mortgage information
* Boundary changes
* Land fragmentation
* Risk analysis
* Historical land information
* Property sale announcements

---

## 💡 Proposed Solution

LandTrace360 combines land records, historical information, document verification, risk analysis, mapping, and AI-assisted features into one platform.

Users can search for a land parcel and view its complete digital profile.

### Basic Workflow

```text
User
  ↓
Land Search
  ↓
Land Profile
  ↓
Historical & Ownership Information
  ↓
Document / Legal / Mortgage Analysis
  ↓
Boundary & Fragmentation Analysis
  ↓
Land DNA & AI Risk Analysis
  ↓
Verification Report
```

---

# 🚀 Key Features

### 🏠 Dashboard

Provides an overview of the available land records and risk information.

### 🔎 Land Search

Search land using:

* Land ID
* Survey Number
* Location

### 🏷️ Available Lands

Allows users to browse demo properties announced for sale.

### 📢 Announce Land for Sale

Sellers can create demo property listings with:

* Land details
* Area
* Land type
* Asking price
* Property description
* House information
* Well/borewell information
* Electricity
* Road access
* Boundary/fencing
* Nearby facilities
* Additional property details

### ❤️ Saved Lands

Users can save/favourite properties for later viewing.

### ⏳ Land Time Machine

Allows users to view historical land information for different years.

It can show changes in:

* Ownership
* Status
* Area
* Transactions
* Risk
* Boundary information
* Subdivisions

### 👥 Ownership History

Displays previous and current ownership information and transactions.

### 📄 Document Verification

Provides document information and AI-assisted synthetic record matching.

### ⚖️ Legal Case Information

Displays demo legal cases associated with a land parcel.

### 🏦 Mortgage Information

Displays mortgage/encumbrance information associated with the property.

### 🧬 Land DNA

Generates a digital health profile of the land using factors such as:

* Ownership stability
* Document health
* Legal safety
* Mortgage status
* Boundary stability

### 🤖 AI Risk Analysis

Provides a synthetic risk score and risk level based on stored project records.

Risk factors include:

* Document risk
* Ownership risk
* Legal risk
* Boundary risk

### 🗺️ Interactive Land Map

Displays land locations using an interactive map.

### 🔗 Relationship Graph

Visualizes relationships between:

* Land
* Owners
* Documents
* Legal cases
* Banks

### 🛰️ Boundary Change Detection

Analyzes synthetic historical and current boundary information to identify possible changes.

### 📊 Land Fragmentation Detector

Analyzes subdivision and changes in the land area.

### 🔍 Document–Record Cross Verification

Compares document information with stored land records and generates a verification score.

### 💬 Ask Your Land AI Assistant

Users can ask questions about a specific land parcel, such as:

* Who is the current owner?
* What is the risk score?
* Are there any legal cases?
* Is there an active mortgage?
* How many subdivisions does the land have?

### 🔮 What-If Risk Simulator

Allows users to simulate scenarios such as:

* Mortgage becomes active
* Legal case becomes pending
* Ownership dispute occurs
* Boundary change detected
* Document verification fails

The system calculates a synthetic risk score for the selected scenario.

### 📑 Automatic Verification Report

Generates a consolidated land verification report containing:

* Land overview
* Ownership
* Documents
* Legal cases
* Mortgages
* Boundary information
* Fragmentation
* Land DNA
* AI risk analysis
* Overall summary

The report can be printed or saved as PDF.

---

# 🛠️ Technology Stack

## Frontend

* **React.js**
* **Vite**
* **HTML5**
* **CSS3**
* **JavaScript**
* **Recharts**
* **Leaflet**
* **OpenStreetMap**

## Backend

* **Python**
* **FastAPI**
* **Uvicorn**
* **REST APIs**

## AI / Analysis

* Python-based rule and logic-driven analysis
* Synthetic risk scoring
* Document-record comparison
* Land health analysis
* What-if scenario simulation

## Data

The current project uses **synthetic/demo land data**.

The demo dataset contains:

```text
LND-1001
LND-1002
LND-1003
LND-1004
LND-1005
LND-1006
LND-1007
LND-1008
```

Each land record may contain:

* Land ID
* Survey number
* Location
* Area
* Land type
* Current owner
* Ownership history
* Transactions
* Documents
* Legal cases
* Mortgage information
* Boundary information
* Risk information
* Fragmentation information

---

# 📁 Project Structure

```text
LandTrace360/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   └── ...
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── ai/
│
├── database/
│
├── documents/
│
└── README.md
```

---

# 🔌 Major API Endpoints

The FastAPI backend provides endpoints for different land operations.

Examples:

```text
GET  /lands
GET  /lands/{survey_number}
GET  /lands/{survey_number}/history
GET  /lands/{survey_number}/owners
GET  /lands/{survey_number}/documents
GET  /lands/{survey_number}/cases
GET  /lands/{survey_number}/risk
GET  /api/lands/{land_id}/mortgages
GET  /api/lands/{land_id}/boundary-changes
GET  /api/lands/{land_id}/fragmentation-analysis
POST /api/lands/{land_id}/ask
POST /api/lands/{land_id}/what-if
GET  /api/lands/{land_id}/verification-report
```

---

# 🌐 Live Demo

**Live Website:**

https://land-trace360.vercel.app/

**Backend API:**

https://landtrace360.onrender.com/

---

# 🐙 GitHub Repository

https://github.com/luckshana2008-ui/LandTrace360

---

# ▶️ Running the Project Locally

## 1. Clone the repository

```bash
git clone https://github.com/luckshana2008-ui/LandTrace360.git
cd LandTrace360
```

## 2. Start the Backend

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

Backend will run at:

```text
http://localhost:8000
```

## 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at:

```text
http://localhost:5173
```

---

# 🔐 Data & Privacy

LandTrace360 is developed as an educational/demo project.

* No real personal land-owner information is required.
* Demo seller contact information is used.
* Land records are synthetic.
* Legal and risk results are demonstrations.
* The system should not be used as a substitute for professional legal or financial due diligence.

---

# 🎓 Project Purpose

LandTrace360 was developed as an academic project to demonstrate how modern web technologies, data analysis, mapping, and AI-assisted decision support can be combined to create an intelligent land information platform.

---

# 🔮 Future Enhancements

Possible future improvements include:

* Real government land-record API integration where legally and technically permitted
* PostgreSQL database integration
* Advanced GIS analysis
* Real satellite imagery analysis
* OCR-based document extraction
* Improved machine-learning risk prediction
* Multi-user authentication
* Cloud document storage
* Real-time notifications
* Advanced cadastral boundary analysis

---

# 👩‍💻 Project

**LandTrace360 – Intelligent Land Digital Twin, History & Risk Prediction Platform**

Built using **React + Vite + FastAPI + Python + AI-assisted analysis + Interactive Maps**.

> **Educational Project | Synthetic Data | Demo Decision Support**
