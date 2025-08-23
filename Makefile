# Admin Service
ADMIN_SERVICE_DIR=services/admin
PYTHON=$(ADMIN_SERVICE_DIR)/env/bin/python
PIP=$(ADMIN_SERVICE_DIR)/env/bin/pip

create-python-env:
	@python -m venv $(ADMIN_SERVICE_DIR)/env

install-packages:
	$(PIP) install -r $(ADMIN_SERVICE_DIR)/requirements.txt

run-studio-server:
	$(PYTHON) $(ADMIN_SERVICE_DIR)/main.py
