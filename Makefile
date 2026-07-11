ifeq ($(OS),Windows_NT)
PYTHON ?= .venv/Scripts/python.exe
else
PYTHON ?= .venv/bin/python
endif

NPM ?= npm
FRONTEND_DIR ?= frontend

.PHONY: install test lint backend-dev migrate frontend-install frontend-lint frontend-typecheck frontend-dev pre-commit-install pre-commit check

install:
	$(PYTHON) -m pip install -e ".[dev]"

test:
	$(PYTHON) -m pytest

lint:
	$(PYTHON) -m ruff check .

backend-dev:
	$(PYTHON) -m uvicorn main:app --reload --reload-dir domarion --reload-dir tests

migrate:
	$(PYTHON) -m alembic upgrade head

frontend-install:
	cd $(FRONTEND_DIR) && $(NPM) install

frontend-lint:
	cd $(FRONTEND_DIR) && $(NPM) run lint

frontend-typecheck:
	cd $(FRONTEND_DIR) && $(NPM) run typecheck

frontend-dev:
	cd $(FRONTEND_DIR) && $(NPM) run dev -- --hostname 127.0.0.1 --port 3000

pre-commit-install:
	$(PYTHON) -m pre_commit install

pre-commit:
	$(PYTHON) -m pre_commit run --all-files

check: test lint frontend-lint frontend-typecheck
