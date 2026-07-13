# Multi Medical Model Platform

Multi Medical Model Platform is a full-stack medical imaging application for running AI-assisted analysis across Chest X-ray, Brain MRI, Diabetic Retinopathy, and Face Recognition workflows. The platform combines a modern React dashboard with a Django REST backend, model inference services, history tracking, and report generation.

## Overview

The system is designed as a modular medical AI workspace where users can:

- Upload medical images and run model inference from the browser
- Review confidence scores, probabilities, thresholds, and inference time
- Browse historical predictions and inspection details
- Generate and review reports
- Access a dashboard summary of recent platform activity

## Key Capabilities

### Clinical Imaging Workflows

- Chest X-ray analysis with support for:
  - `efficientnetb0`
  - `densenet121`
  - `custom_cnn`
- Brain MRI analysis with support for:
  - `efficientnetb0_mri`
  - `vit_mri`
- Diabetic Retinopathy analysis with support for:
  - `efficientnetb0_dr`
  - `convnext_dr`
- Face Recognition workflows for:
  - enrollment
  - matching
  - listing
  - deletion

### User Experience

- Public landing page with platform navigation
- About page with product and architecture context
- Dashboard shell with responsive navigation
- Collapsible desktop sidebar
- Prediction history and scan review views
- Clean clinical-style UI with animated result cards

### Data and Reporting

- Save successful predictions to the backend
- Review previously completed scans
- Generate reports from platform data
- View dashboard statistics such as prediction totals, model breakdown, and recent activity

## Architecture

The repository is organized as a monorepo with two main applications:

- `frontend/` contains the React application
- `backend/` contains the Django API and AI services

### Frontend Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- React Router
- Axios
- Lucide React

### Backend Stack

- Django 5
- Django REST Framework
- Django REST Framework SimpleJWT
- django-cors-headers
- TensorFlow
- Keras Hub
- Pillow
- NumPy
- OpenCV headless
- InsightFace
- ONNX Runtime
- psycopg
- python-dotenv

## Project Structure

### Frontend

- `frontend/src/pages/` page-level screens
- `frontend/src/components/layout/` public and dashboard layouts
- `frontend/src/components/navigation/` navbar and sidebar
- `frontend/src/services/api/` API clients and request wrappers
- `frontend/src/routes/` route definitions and navigation data
- `frontend/src/types/` shared TypeScript types

### Backend

- `backend/config/` Django project configuration
- `backend/apps/authentication/` login and token endpoints
- `backend/apps/predictions/` prediction APIs, serializers, and dashboard stats
- `backend/apps/history/` prediction history endpoints
- `backend/apps/reports/` reporting endpoints
- `backend/apps/face_recognition/` face enrollment and matching endpoints
- `backend/services/ai/` model loading and inference logic
- `backend/services/ai/models/` local model assets

## API Endpoints

### Authentication

- `POST /api/v1/auth/login/`
- `POST /api/v1/auth/refresh/`
- `GET /api/v1/auth/me/`
- `POST /api/v1/auth/logout/`
- `POST /api/v1/auth/password-reset/`
- `POST /api/v1/auth/change-password/`

### Predictions

- `GET /api/v1/predictions/`
- `GET /api/v1/predictions/stats/`
- `POST /api/v1/predictions/create/`
- `GET /api/v1/predictions/<prediction_id>/`

### Model Inference

- `POST /api/v1/predict/chest/`
- `POST /api/v1/predict/brain-mri/`
- `POST /api/v1/predict/diabetic-retinopathy/`

### History

- `GET /api/v1/history/`
- `GET /api/v1/history/<history_id>/`

### Reports

- `GET /api/v1/reports/`
- `POST /api/v1/reports/generate/`
- `GET /api/v1/reports/<report_id>/`

### Face Recognition

- `GET /api/v1/face-recognition/`
- `POST /api/v1/face-recognition/enroll/`
- `POST /api/v1/face-recognition/match/`
- `DELETE /api/v1/face-recognition/<enrollment_id>/`

## Model Notes

- Chest X-ray models are expected in `backend/services/ai/models/`
- Brain MRI models are expected in `backend/services/ai/models/`
- Diabetic Retinopathy models are expected in `backend/services/ai/models/`
- The backend supports both `.keras` and `.h5` assets
- The UI displays low-confidence Diabetic Retinopathy results as `Cannot define` when confidence is below 50%, while still showing the class probabilities

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m pip install -r requirements.txt
python manage.py runserver
```

## Configuration

Create local environment files for each app:

- `frontend/.env`
- `backend/.env`

Use the same variable names that already exist in the project templates.

## Notes

- The dashboard includes a collapsible sidebar on desktop.
- The public navbar includes Home, Dashboard, and About navigation.
- Non-functional search controls were intentionally removed from the navigation.
- History entries are available for completed predictions.
- Saved outputs include model metadata, confidence, probability, and inference timing.

## Development Tips

- Place actual model binaries inside `backend/services/ai/models/`
- Keep the frontend and backend running together when testing the full workflow
- Rebuild the frontend after changing navigation or page components
- Restart Django after replacing model files or backend dependencies

## Troubleshooting

### Model file errors

If the backend reports a model loading error, verify that the file in `backend/services/ai/models/` is a real model artifact and not a placeholder or Git LFS pointer.

### Frontend build issues

Run the frontend build locally to confirm TypeScript and Vite compilation:

```bash
cd frontend
npm run build
```

### Backend dependency issues

Install backend dependencies with:

```bash
cd backend
python -m pip install -r requirements.txt
```
