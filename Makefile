# Admin Service
STUDIO_SERVICE=services/studio
FLASK_APP=${STUDIO_SERVICE}/app:create_app
PYTHON=$(STUDIO_SERVICE)/env/bin/python
PIP=$(STUDIO_SERVICE)/env/bin/pip
FLASK=$(STUDIO_SERVICE)/env/bin/flask

create-python-env:
	@python -m venv $(STUDIO_SERVICE)/env

install-packages:
	$(PIP) install -r $(STUDIO_SERVICE)/requirements.txt

run-studio-server:
	FLASK_APP=$(FLASK_APP) \
	FLASK_RUN_HOST=0.0.0.0 \
	FLASK_RUN_PORT=3000 \
	$(FLASK) run --debug


db-init:
	@cd $(STUDIO_SERVICE)/app && FLASK_APP=../../../$(FLASK_APP) ../../../$(FLASK) db init

db-migrate:
	@cd $(STUDIO_SERVICE)/app && FLASK_APP=../../../$(FLASK_APP) ../../../$(FLASK) db migrate -m "${m}"

db-upgrade:
	@cd $(STUDIO_SERVICE)/app && FLASK_APP=../../../$(FLASK_APP) ../../../$(FLASK) db upgrade