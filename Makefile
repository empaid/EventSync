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
	FLASK_RUN_PORT=8000 \
	$(FLASK) run --debug

run-studio-ws-server:
	@cd $(STUDIO_SERVICE) && ../../${PYTHON} -m app.main


db-init:
	@cd $(STUDIO_SERVICE)/app && FLASK_APP=../../../$(FLASK_APP) ../../../$(FLASK) db init

db-migrate:
	@cd $(STUDIO_SERVICE)/app && FLASK_APP=../../../$(FLASK_APP) ../../../$(FLASK) db migrate -m "${m}"

db-upgrade:
	@cd $(STUDIO_SERVICE)/app && FLASK_APP=../../../$(FLASK_APP) ../../../$(FLASK) db upgrade


#s3
s3-configuration:
	@cd $(STUDIO_SERVICE)/app/storage && awslocal s3api put-bucket-policy --bucket eventsync-asset  --policy file://bucket-policy.json && awslocal s3api put-bucket-cors --bucket eventsync-asset --cors-configuration file://bucket-cors.json


# Webapp
WEBAPP=apps/web
run-webapp:
	@cd $(WEBAPP) && npm run dev