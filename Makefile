.PHONY: help venv install install-dev test frontend-install frontend-build frontend-test frontend-typecheck frontend-lint pre-commit-install pre-commit-run ci clean

VENV_DIR := .venv
PYTHON_BIN := $(shell command -v python3.13 >/dev/null 2>&1 && echo python3.13 || echo python3)
PYTHON := $(VENV_DIR)/bin/python
PIP := $(VENV_DIR)/bin/pip

help:
	@echo "Targets:"
	@echo "  venv            Create local .venv"
	@echo "  install         Install Python requirements into .venv"
	@echo "  install-dev     Install Python dev requirements into .venv"
	@echo "  test            Run Python tests"
	@echo "  frontend-install Install frontend deps (requires Node.js)"
	@echo "  frontend-build  Run frontend build (requires Node.js)"
	@echo "  frontend-test   Run frontend tests (requires Node.js)"
	@echo "  frontend-typecheck Run frontend typecheck (requires Node.js)"
	@echo "  frontend-lint   Run frontend lint (requires Node.js)"
	@echo "  pre-commit-install Install git hooks (requires pre-commit)"
	@echo "  pre-commit-run  Run all pre-commit hooks"
	@echo "  ci              Run full local CI (pre-commit hooks)"
	@echo "  clean           Remove .venv"

venv:
	$(PYTHON_BIN) -m venv $(VENV_DIR)

install: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

install-dev: install
	$(PIP) install -r requirements-dev.txt

test: install-dev
	$(VENV_DIR)/bin/pytest -v --cov=custom_components --cov-report=term-missing

frontend-install:
	cd frontend && npm install

frontend-build:
	cd frontend && npm run build

frontend-test:
	cd frontend && npm run test

frontend-typecheck:
	cd frontend && npm run typecheck

frontend-lint:
	cd frontend && npm run lint

pre-commit-install: install-dev
	$(VENV_DIR)/bin/pre-commit install

pre-commit-run: install-dev
	$(VENV_DIR)/bin/pre-commit run --all-files

ci: pre-commit-run

clean:
	rm -rf $(VENV_DIR)
