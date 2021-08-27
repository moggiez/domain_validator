# INFRASTRUCTURE
VAR_FILE=default.tfvars

modules-cleanup:
	cd infra && rm -rf .terraform/modules

infra-fmt:
	cd infra && terraform fmt -recursive

infra-init:
	cd infra && terraform init -force-copy -backend-config=./tf_backend.cfg

infra-debug: build modules-cleanup infra-init
	cd infra && TF_LOG=DEBUG terraform apply -auto-approve -var-file="${VAR_FILE}" infra

infra-deploy: build modules-cleanup infra-init
	cd infra && terraform init && terraform apply -auto-approve -var-file="${VAR_FILE}"

infra-preview: build modules-cleanup infra-init
	cd infra && terraform init && terraform plan -var-file="${VAR_FILE}"

infra-destroy: infra-init
	cd infra && terraform init && terraform destroy

# CODE
build-cleanup:
	rm -rf ./dist/* & mkdir -p dist && rm -rf ./src/node_modules

build: build-cleanup
	cd src && npm i --only=prod && zip -r ../dist/domain_validator-scheduled.zip ./

build-dev: build-cleanup
	cd src && npm i

lint:
	npm run lint

format:
	npm run format

test:
	npm run test

update-lambda-fn: build
	aws lambda update-function-code --function-name domain_validator-scheduled --zip-file fileb://$(shell pwd)/dist/domain_validator-scheduled.zip --publish | jq .FunctionArn

# NPM COMMANDS
install:
	npm i && cd src && npm i

npm-auth:
	./scripts/npm_auth.sh