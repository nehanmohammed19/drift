# Drift ADHD Model and Extension

This repository contains:

- **Data** for training ADHD classification models (`data/`)
- **Training scripts** (`scripts/`)
- **Saved models** (`models/`)
- **FastAPI application** (`server/app.py`)
- **Browser extension** used to collect mouse tracking data (`extension/`)

## Setup

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Training

Train the logistic regression model and save it to `models/`:

```bash
python scripts/train_logistic_regression.py
```

## Serving the Model

Start the FastAPI server (requires a trained model in `models/logreg_pipeline.pkl`):

```bash
python scripts/start_model_server.py
```

The API will be available at `http://127.0.0.1:8000` with docs at `/docs`.

## Browser Extension

Load the `extension/` directory as an unpacked extension in your browser's developer mode to start collecting mouse data.
