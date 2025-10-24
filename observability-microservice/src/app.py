
# src/app.py
import os
import logging
from pathlib import Path
from flask import Flask, render_template
from flask_cors import CORS
from src import db, auth
from src.api import bp
from src.collector import Collector

# --- Setup and globals ---
PROJECT_ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = PROJECT_ROOT / "frontend"     # frontend directory root
TEMPLATES_DIR = FRONTEND_DIR / "templates"
STATIC_DIR = FRONTEND_DIR / "static"
DATA_DIR = PROJECT_ROOT / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

collector = None


# --- Factory ---
def create_app():
    app = Flask(
        __name__,
        static_folder=str(STATIC_DIR),
        template_folder=str(TEMPLATES_DIR)
    )
    CORS(app)
    app.register_blueprint(bp, url_prefix="/api")

    # configure basic logging
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.DEBUG)

    return app


app = create_app()


# --- Routes ---
@app.route("/")
def index():
    """Serve the main dashboard page (frontend/templates/dashboard.html)."""
    return render_template("dashboard.html")


# --- Collector startup ---
def start_collector_once(interval=10, cpu_threshold=80.0, mem_threshold=80.0):
    """
    Start the background collector exactly once.
    Important: Flask debug mode spawns a reloader process;
    WERKZEUG_RUN_MAIN helps ensure we only start the collector
    in the child process that serves requests.
    """
    global collector
    if collector is not None and collector.is_alive():
        app.logger.debug("Collector already running")
        return

    if app.debug and os.environ.get("WERKZEUG_RUN_MAIN") != "true":
        app.logger.debug("Skipping collector start in reloader parent process")
        return

    collector = Collector(interval=interval, cpu_threshold=cpu_threshold, mem_threshold=mem_threshold)
    collector.start()
    app.collector = collector
    app.logger.info(
        "Collector started (interval=%s, cpu_threshold=%s, mem_threshold=%s)",
        interval, cpu_threshold, mem_threshold
    )


# --- Main ---
if __name__ == "__main__":
    app.debug = True
    start_collector_once(interval=10, cpu_threshold=80.0, mem_threshold=80.0)
    app.run(host="0.0.0.0", port=5000, debug=True)
