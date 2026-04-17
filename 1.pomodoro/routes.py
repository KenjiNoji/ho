from flask import Blueprint, render_template


pomodoro_bp = Blueprint("pomodoro", __name__)


@pomodoro_bp.get("/")
def index() -> str:
    return render_template("index.html")