from app import create_app


def test_create_app_applies_config() -> None:
    app = create_app({"TESTING": True, "CUSTOM_FLAG": "enabled"})

    assert app.testing is True
    assert app.config["CUSTOM_FLAG"] == "enabled"


def test_create_app_registers_index_route() -> None:
    app = create_app({"TESTING": True})

    rules = {rule.rule for rule in app.url_map.iter_rules()}

    assert "/" in rules


def test_index_page_renders_successfully() -> None:
    app = create_app({"TESTING": True})
    client = app.test_client()

    response = client.get("/")

    assert response.status_code == 200
    html = response.get_data(as_text=True)
    assert "Pomodoro Timer" in html
    assert "Stage 4 Interactive Controls" in html


def test_index_page_includes_core_static_sections() -> None:
    app = create_app({"TESTING": True})
    client = app.test_client()

    response = client.get("/")

    html = response.get_data(as_text=True)

    assert 'data-testid="app-shell"' in html
    assert 'data-testid="mode-switcher"' in html
    assert 'data-testid="timer-panel"' in html
    assert 'data-testid="settings-panel"' in html
    assert 'data-testid="progress-strip"' in html


def test_index_page_includes_static_controls_and_settings() -> None:
    app = create_app({"TESTING": True})
    client = app.test_client()

    response = client.get("/")

    html = response.get_data(as_text=True)

    assert "Start" in html
    assert "Pause" in html
    assert "Reset" in html
    assert "Focus minutes" in html
    assert "Short break" in html
    assert "Long break interval" in html


def test_index_page_contains_interactive_hooks_for_stage_4() -> None:
    app = create_app({"TESTING": True})
    client = app.test_client()

    response = client.get("/")

    html = response.get_data(as_text=True)

    assert 'data-action="start"' in html
    assert 'data-action="pause"' in html
    assert 'data-action="reset"' in html
    assert 'data-mode="focus"' in html
    assert 'data-mode="shortBreak"' in html
    assert 'data-mode="longBreak"' in html
    assert 'type="module"' in html
    assert 'data-testid="current-cycle"' in html