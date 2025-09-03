# Drift ADHD Model and Extension



This repository contains:

- **Data** for training ADHD classification models (`data/`)
- **Training scripts** (`scripts/`)
- **Saved models** (`models/`)
- **FastAPI application** (`server/app.py`)
- **Browser extension** used to collect mouse tracking data (`extension/`)

## Research Background

This project was inspired by the research paper:

> *Kollins SH, Garavan H, Rodriguez S, et al. (2019). **Mouse-tracking reveals an association between attentional deficit hyperactivity disorder (ADHD) and altered motor control.***  
> [PLOS ONE, 14(11): e0225437](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0225437)

The paper demonstrated how fine-grained mouse movement trajectories can provide insights into cognitive processes related to ADHD. Our work extends this idea by collecting similar mouse-tracking data through a browser extension and applying machine learning models to classify ADHD-related behavior patterns.


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
