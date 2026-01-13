.PHONY: help venv install install-dev test frontend-install frontend-build frontend-test clean

VENV_DIR := .venv
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
	@echo "  clean           Remove .venv"

venv:
	python3 -m venv $(VENV_DIR)

install: venv
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

install-dev: install
	$(PIP) install -r requirements-dev.txt

test: install-dev
	$(VENV_DIR)/bin/pytest -v

frontend-install:
	cd frontend && npm install

frontend-build:
	cd frontend && npm run build

frontend-test:
	cd frontend && npm run test

clean:
	rm -rf $(VENV_DIR)
