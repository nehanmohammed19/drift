#!/usr/bin/env python3
"""Helper script to start the FastAPI model server for the Drift extension."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MODEL_DIR = ROOT / "models"


def check_dependencies() -> bool:
    """Check if required packages are installed."""
    required_packages = ["fastapi", "uvicorn", "joblib", "numpy", "pydantic"]
    missing_packages = []

    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)

    if missing_packages:
        print(f"❌ Missing required packages: {', '.join(missing_packages)}")
        print("Install them with: pip install " + " ".join(missing_packages))
        return False

    print("✅ All required packages are installed")
    return True


def check_model_files() -> bool:
    """Check if model files exist."""
    model_file = MODEL_DIR / "logreg_pipeline.pkl"
    if not model_file.exists():
        print("❌ Model file 'logreg_pipeline.pkl' not found!")
        print("Make sure you have trained your model and saved it as 'logreg_pipeline.pkl'")
        return False

    print("✅ Model file found")
    return True


def start_server() -> None:
    """Start the FastAPI server."""
    print("🚀 Starting Drift Model Server...")
    print("📍 Server will be available at: http://127.0.0.1:8000")
    print("📊 API endpoint: http://127.0.0.1:8000/predict")
    print("📖 API docs: http://127.0.0.1:8000/docs")
    print("\n" + "=" * 50)
    print("Press Ctrl+C to stop the server")
    print("=" * 50 + "\n")

    try:
        subprocess.run(
            [
                sys.executable,
                "-m",
                "uvicorn",
                "server.app:app",
                "--host",
                "127.0.0.1",
                "--port",
                "8000",
                "--reload",
            ]
        )
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")


def main() -> None:
    """Main function."""
    print("🔧 Drift Model Server Setup")
    print("=" * 30)

    if not check_dependencies():
        sys.exit(1)

    if not check_model_files():
        sys.exit(1)

    start_server()


if __name__ == "__main__":
    main()
