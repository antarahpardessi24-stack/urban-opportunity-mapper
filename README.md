# urban-opportunity-mapper
A geospatial data science platform that analyzes population, demographics, amenities, and public transport accessibility across Pune to identify underserved wards and urban development opportunities using GIS, machine learning, and interactive maps.

# 🗺️ Urban Opportunity Mapper

### Geospatial Intelligence Platform for Identifying Urban Opportunities in Pune, India

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Website-00CFE8?style=for-the-badge)](https://urban-opportunity-mapper.vercel.app)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel)](https://urban-opportunity-mapper.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge)](https://urban-opportunity-mapper.onrender.com)
[![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-TypeScript-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)

**Urban Opportunity Mapper** is a geospatial data science project that analyzes population distribution, public amenities, transportation accessibility, and neighborhood-level indicators to identify potential urban service gaps and opportunities.

The platform provides an interactive map of Pune's **58 analytical wards**, helping users explore spatial patterns and compare neighborhoods through data-driven indicators.

🔗 **Live Application:** https://urban-opportunity-mapper.vercel.app

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Objectives](#-objectives)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Data Sources](#-data-sources)
- [Project Architecture](#-project-architecture)
- [Data Processing Workflow](#-data-processing-workflow)
- [API Documentation](#-api-documentation)
- [Installation and Setup](#-installation-and-setup)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Future Enhancements](#-future-enhancements)
- [Author](#-author)

---

## 🌍 Overview

Urban planning decisions often require combining information about population, transportation, and the availability of essential services. When these datasets are analyzed independently, it can be difficult to identify neighborhoods that may need better infrastructure or service coverage.

Urban Opportunity Mapper brings these spatial datasets together in an interactive geospatial analytics platform.

The project focuses on Pune, Maharashtra, and provides ward-level exploration of:

- Population distribution
- Public amenities and points of interest
- Public transportation stops
- Neighborhood-level opportunity indicators
- Spatial patterns and potential service gaps

The platform is designed as a portfolio project demonstrating geospatial data processing, API development, interactive mapping, and data-driven urban analysis.

## 🎯 Problem Statement

**How can geospatial data be used to identify neighborhoods with potential gaps in urban services and accessibility?**

The project combines geographic boundaries, population estimates, points of interest, and public transportation data to support exploratory analysis of urban opportunities.

The resulting indicators are intended to support further investigation and should not be interpreted as definitive planning decisions without additional validation.

## 🎯 Objectives

- Integrate multiple geospatial datasets into a unified analytical workflow.
- Clean and process ward boundaries, amenities, and transportation data.
- Analyze the spatial distribution of urban facilities.
- Calculate and visualize ward-level opportunity indicators.
- Enable interactive exploration and comparison of neighborhoods.
- Develop a deployable full-stack geospatial analytics application.

## ✨ Key Features

### 🗺️ Interactive Geospatial Map
- Explore Pune's 58 analytical wards.
- View ward boundaries on an interactive map.
- Visualize opportunity scores using a spatial color scale.
- Navigate and zoom across the mapped region.

### 📊 Opportunity Analysis
- Explore ward-level opportunity indicators.
- Compare neighborhood-level patterns.
- Investigate potential gaps in service availability.
- Examine spatial differences across wards.

### 🏥 Amenity and Infrastructure Data
- Analyze points of interest such as healthcare facilities, restaurants, and other mapped amenities.
- Explore public transportation stop locations.
- Examine the distribution of services across neighborhoods.

### 🔎 Interactive Exploration
- Filter wards by available opportunity levels and categories.
- Change the visualization metric where supported.
- Use opportunity discovery and ward comparison controls.
- Reset the map filters to explore different scenarios.

### 📈 Analytics Dashboard
The application includes a separate analytics section for exploring available ward-level indicators and spatial statistics.

*Note: The exact analyses displayed depend on the current implementation and available data.*

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Programming Language | Python, TypeScript, JavaScript |
| Geospatial Processing | GeoPandas, Shapely, PyProj, Pyogrio |
| Data Analysis | Pandas, NumPy |
| Machine Learning | Scikit-learn |
| Backend API | FastAPI, Uvicorn |
| Frontend | React, TypeScript, Vite |
| Interactive Maps | MapLibre GL JS |
| Data Visualization | Recharts |
| API Communication | Axios, REST API |
| Version Control | Git, GitHub |
| Backend Deployment | Render |
| Frontend Deployment | Vercel |

---

## 🗂️ Data Sources

The project uses processed geospatial datasets prepared for the Pune study area.

| Dataset | Purpose |
|---|---|
| Pune Ward Boundaries | Defines the geographic boundaries of analytical wards |
| WorldPop Population Data | Provides population estimates |
| OpenStreetMap Points of Interest | Represents mapped amenities and facilities |
| PMPML Transportation Data | Represents public transportation stops |

### Data Preparation

The processed datasets include:

- `wards_clean.geojson`
- `pois_clean.geojson`
- `pmpml_stops_clean.geojson`
- `urban_opportunity_clusters.geojson`
- `opportunity_scores.geojson`
- `ward_features.geojson`
- `ward_population.geojson`

The processed ward dataset contains **58 wards**, and the cleaned POI dataset contains **4,444 records**. The transportation dataset contains **6,713 stops in total**, with **2,193 stops within the mapped ward boundaries**.

These counts describe the current processed datasets and may change as the data pipeline is updated.

**Data considerations:** Population values are estimates, and OpenStreetMap coverage may vary by location. Dataset dates, licensing, completeness, and spatial coverage should be reviewed before using the results for real-world planning.

---

## 🏗️ Project Architecture

The application follows a separated frontend-backend architecture.

```text
                    USER
                      |
                      v
             React + TypeScript
                  (Vercel)
                      |
                 REST API
                      |
                      v
                FastAPI Backend
                   (Render)
                      |
                      v
             Geospatial Data Layer
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
       Ward        Amenities   Transport
     Boundaries      (POIs)      Stops
          |           |           |
          +-----------+-----------+
                      |
                      v
           Ward-Level Indicators
                      |
                      v
             Interactive Map
```

### Architecture Components

**Frontend**
- Renders the user interface and interactive maps.
- Provides filters and ward exploration controls.
- Requests data from the backend API.

**Backend**
- Exposes REST endpoints using FastAPI.
- Loads processed geospatial datasets.
- Returns ward, amenity, and transportation data.

**Geospatial Data Layer**
- Stores the processed GeoJSON files used by the application.
- Supports spatial analysis and ward-level exploration.

**Deployment**
- Frontend hosted on Vercel.
- Backend hosted on Render.
- Source code maintained in GitHub.

---

## 🔄 Data Processing Workflow

The project workflow consists of the following stages:

1. **Data collection:** Obtain ward boundaries, population estimates, points of interest, and transportation data.
2. **Data inspection:** Examine dataset structure, coordinate reference systems, missing values, and spatial coverage.
3. **Data cleaning:** Remove duplicate POIs, standardize relevant fields, and prepare valid geometries.
4. **Spatial processing:** Use appropriate coordinate reference systems for area calculations and spatial operations.
5. **Feature preparation:** Combine available ward-level indicators into analytical datasets.
6. **Opportunity analysis:** Generate ward-level scores and clustering outputs.
7. **API development:** Expose processed data through FastAPI endpoints.
8. **Visualization:** Display geographic boundaries and available indicators through an interactive web interface.
9. **Deployment:** Host the frontend and backend as separate services.

---

## 🔌 API Documentation

The backend provides REST endpoints for retrieving ward and infrastructure data.

**Base URL:**  
https://urban-opportunity-mapper.onrender.com

**Interactive API Documentation:**  
https://urban-opportunity-mapper.onrender.com/docs

### Available Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Returns basic application information |
| GET | `/health` | Checks backend health |
| GET | `/api/wards` | Retrieves all ward features |
| GET | `/api/wards/pois/all` | Retrieves all available POIs |
| GET | `/api/wards/{ward_id}` | Retrieves a specific ward |
| GET | `/api/wards/{ward_id}/pois` | Retrieves POIs associated with a ward |
| GET | `/api/wards/{ward_id}/stops` | Retrieves transportation stops associated with a ward |

### Example Health Check

Request:

```http
GET /health
```

Response:

```json
{
  "status": "healthy"
}
```

You can test the endpoints interactively using the Swagger documentation linked above.

---

## 💻 Installation and Setup

### Prerequisites

- Python
- Node.js and npm
- Git
- A code editor such as Visual Studio Code

### 1. Clone the Repository

```bash
git clone https://github.com/antarahpardessi24-stack/urban-opportunity-mapper.git
cd urban-opportunity-mapper
```

### 2. Set Up the Python Environment

Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

### 3. Run the Backend

From the project root:

```bash
python -m uvicorn backend.main:app --reload
```

Backend URLs:

- Application: http://127.0.0.1:8000
- API documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

### 4. Set Up the Frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Create a frontend environment file named `.env.local` containing:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend development server:

```bash
npm run dev
```

Open the local URL printed by Vite in the terminal.

### 5. Build the Frontend

To verify the production build:

```bash
npm run build
```

The generated production files are placed in the `frontend/dist` directory.

### Important Notes

- The backend expects the processed GeoJSON datasets to be available at their configured project paths.
- Raw source data is not necessarily included in the repository.
- If any required processed files are missing, prepare the datasets using the project's data-processing scripts before running the backend.
- Keep local environment files and secrets out of version control.

---

## 🚀 Deployment

### Frontend — Vercel

The React and Vite frontend is deployed on Vercel.

**Live Website:**  
https://urban-opportunity-mapper.vercel.app

The frontend uses the environment variable:

```env
VITE_API_BASE_URL=https://urban-opportunity-mapper.onrender.com
```

Configure this variable in the Vercel project settings for the appropriate deployment environments.

### Backend — Render

The FastAPI backend is deployed on Render.

**Backend URL:**  
https://urban-opportunity-mapper.onrender.com

**Health Check:**  
https://urban-opportunity-mapper.onrender.com/health

The free Render service may spin down after inactivity, causing a delay on the first request.

---

## 📁 Project Structure

```text
urban-opportunity-mapper/
│
├── backend/
│   ├── main.py
│   └── routers/
│       └── wards.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── data/
│   ├── raw/
│   └── processed/
│
├── src/
│   ├── inspect_data.py
│   └── clean_data.py
│
├── requirements.txt
├── .gitignore
└── README.md
```

*The tree is representative; additional files and scripts may exist in the repository.*

---

## 🔮 Future Enhancements

Potential improvements include:

- Incorporating more detailed demographic and socioeconomic indicators.
- Adding temporal comparisons to study changes in population and service coverage.
- Improving accessibility analysis using walking and public transportation travel times.
- Validating opportunity scores against additional datasets and planning criteria.
- Adding richer ward-level reports and downloadable analysis summaries.
- Improving data provenance, refresh schedules, and data quality checks.
- Optimizing large geospatial responses for performance and lower memory usage.

These are planned opportunities for further development, not claims about existing functionality.

---

## 👩‍💻 Author

**Antarah Pardessi**

B.Sc. Data Science | Geospatial Analytics | Machine Learning | Data Visualization

- **GitHub:** [antarahpardessi24-stack](https://github.com/antarahpardessi24-stack)
- **Project Repository:** [Urban Opportunity Mapper](https://github.com/antarahpardessi24-stack/urban-opportunity-mapper)
- **Live Demo:** [Urban Opportunity Mapper](https://urban-opportunity-mapper.vercel.app)

---

## 📄 License

No license is specified here. Add a `LICENSE` file if you intend to publish the project under a particular open-source license.

---

*Built as a geospatial data science portfolio project to explore how spatial data can support urban analysis and opportunity discovery.*

