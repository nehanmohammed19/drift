from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import pandas as pd
from sklearn.feature_selection import RFECV
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, roc_curve
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"


def load_data() -> pd.DataFrame:
    """Load experiment data and create ADHD labels."""
    exp1 = pd.read_csv(DATA_DIR / "exp1_mouse.csv")
    exp2 = pd.read_csv(DATA_DIR / "exp2_mouse.csv")
    exp1["experiment"] = "preset_SSD"
    exp2["experiment"] = "staircase_SSD"
    df = pd.concat([exp1, exp2], ignore_index=True)
    threshold = df["H"].quantile(0.8)
    df["ADHD_label"] = (df["H"] >= threshold).astype(int)
    return df


def build_dataset(df: pd.DataFrame):
    features = [
        "vel_max_nogo10coh",
        "acc_max_nogo10coh",
        "total_dist_nogo10coh",
        "vel_max_nogo50coh",
        "acc_max_nogo50coh",
        "total_dist_nogo50coh",
        "vel_max_nogo80coh",
        "acc_max_nogo80coh",
        "total_dist_nogo80coh",
        "ssrt_integ",
        "IN",
        "vol",
        "go_acc",
        "meanmt",
    ]
    X = df[features + ["experiment"]].copy()
    X = pd.get_dummies(X, columns=["experiment"], drop_first=True)
    y = df["ADHD_label"]
    return X, y


def train_model(X: pd.DataFrame, y: pd.Series) -> GridSearchCV:
    cv_outer = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    pipe = Pipeline(
        [
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
            (
                "rfecv",
                RFECV(
                    estimator=LogisticRegression(penalty="l2", solver="liblinear"),
                    step=1,
                    cv=5,
                    scoring="roc_auc",
                    min_features_to_select=5,
                ),
            ),
            (
                "logreg",
                LogisticRegression(
                    penalty="l2", solver="liblinear", max_iter=1000, random_state=42
                ),
            ),
        ]
    )
    param_grid = {"logreg__C": [0.01, 0.05, 0.1, 0.5, 1, 5, 10, 20, 100]}
    grid = GridSearchCV(
        estimator=pipe,
        param_grid=param_grid,
        cv=cv_outer,
        scoring="roc_auc",
        n_jobs=-1,
        verbose=2,
    )
    grid.fit(X, y)
    return grid


def save_model(model) -> None:
    MODEL_DIR.mkdir(exist_ok=True)
    joblib.dump(model, MODEL_DIR / "logreg_pipeline.pkl")


def plot_roc(model, X, y) -> None:
    y_prob = model.predict_proba(X)[:, 1]
    fpr, tpr, _ = roc_curve(y, y_prob)
    auc = roc_auc_score(y, y_prob)
    plt.figure()
    plt.plot(fpr, tpr, label=f"LogReg (AUC = {auc:.2f})")
    plt.plot([0, 1], [0, 1], "k--", label="Chance")
    plt.xlabel("False Positive Rate")
    plt.ylabel("True Positive Rate")
    plt.title("ROC Curve – Logistic Regression")
    plt.legend(loc="lower right")
    plt.show()


if __name__ == "__main__":
    data = load_data()
    X, y = build_dataset(data)
    grid = train_model(X, y)
    print("Best CV AUC (LogReg):", grid.best_score_)
    print("Best C:", grid.best_params_["logreg__C"])
    best_lr = grid.best_estimator_
    save_model(best_lr)
    plot_roc(best_lr, X, y)
