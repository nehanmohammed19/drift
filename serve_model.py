from pathlib import Path

import joblib
import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

ROOT = Path(__file__).resolve().parent
model = joblib.load(ROOT / "logreg_pipeline.pkl")


class Features(BaseModel):
    vel_max_nogo10coh: float
    acc_max_nogo10coh: float
    total_dist_nogo10coh: float
    vel_max_nogo50coh: float
    acc_max_nogo50coh: float
    total_dist_nogo50coh: float
    vel_max_nogo80coh: float
    acc_max_nogo80coh: float
    total_dist_nogo80coh: float
    ssrt_integ: float
    IN: float
    vol: float
    go_acc: float
    meanmt: float
    experiment_staircase_SSD: int  # 0 or 1


@app.post("/predict")
def predict(feat: Features):
    x = np.array([
        [
            feat.vel_max_nogo10coh,
            feat.acc_max_nogo10coh,
            feat.total_dist_nogo10coh,
            feat.vel_max_nogo50coh,
            feat.acc_max_nogo50coh,
            feat.total_dist_nogo50coh,
            feat.vel_max_nogo80coh,
            feat.acc_max_nogo80coh,
            feat.total_dist_nogo80coh,
            feat.ssrt_integ,
            feat.IN,
            feat.vol,
            feat.go_acc,
            feat.meanmt,
            feat.experiment_staircase_SSD,
        ]
    ])
    proba = model.predict_proba(x)[0, 1]
    return {"adhd_probability": proba}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
