from flask import Flask

from routes import pomodoro_bp


def create_app(config: dict | None = None) -> Flask:
	app = Flask(__name__)

	if config:
		app.config.update(config)

	app.register_blueprint(pomodoro_bp)
	return app


app = create_app()


if __name__ == "__main__":
	app.run(debug=False)
