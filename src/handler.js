"use strict";

const AWS = require("aws-sdk");
const dns = require("dns");
const { LambdaApiClient } = require("./lambda");

const internalDomainsApi = new LambdaApiClient({
  callerName: "domain_validator",
  functionName: "domains-api",
  AWS,
});

const DOMAIN_STATES = {
  PENDING_VALIDATION: "PENDING",
  VALIDATED: "VALID",
  INVALID: "INVALID",
};

const getDomainsPendingValidation = async () => {
  return await internalDomainsApi.invoke("getDomainsPendingValidation", {});
};

const setDomainValidationState = async (domainRecord, state) => {
  return await internalDomainsApi.invoke("setDomainValidationState", {
    organisationId: domainRecord.OrganisationId,
    domainName: domainRecord.DomainName,
    validationState: state,
  });
};

const resolveCname = async (cname) => {
  return new Promise((resolve, reject) => {
    dns.resolveCname(cname, (err, addresses) => {
      if (err) {
        reject(err);
      } else {
        resolve(addresses.length > 0 ? addresses[0] : null);
      }
    });
  });
};

const hasValidationExpired = (domain) => {
  const expirationDate = new Date(domain.ValidationExpirationDate);
  return expirationDate < new Date();
};

class Handler {
  constructor(event, callback) {
    this.callback = callback;
    this.event = event;
  }

  async handle(isPreview) {
    const domains = await getDomainsPendingValidation();
    for (const domain of domains.Items) {
      await this.validateDomain(domain, isPreview);
    }
  }

  async validateDomain(domain, isPreview) {
    try {
      const initialState = domain.ValidationState;
      let newState = DOMAIN_STATES.PENDING_VALIDATION;
      if (hasValidationExpired(domain)) {
        newState = DOMAIN_STATES.INVALID;
      } else {
        let cnameValue = null;
        try {
          cnameValue = await resolveCname(domain.ValidationRecordName);
        } catch (err) {
          cnameValue = "N/A";
        }

        if (isPreview) {
          console.log(`Searching for CNAME results. Value: ${cnameValue}.`);
          console.log(
            `Is the same as required: ${
              cnameValue == domain.ValidationRecordValue
            }`
          );
          console.log(
            `Has validation expired: ${hasValidationExpired(domain)}`
          );
        }

        if (cnameValue != null && cnameValue == domain.ValidationRecordValue) {
          newState = DOMAIN_STATES.VALIDATED;
        } else if (hasValidationExpired(domain)) {
          newState = DOMAIN_STATES.INVALID;
        } else {
          newState = DOMAIN_STATES.PENDING_VALIDATION;
        }
      }
      if (initialState !== newState && !isPreview) {
        await setDomainValidationState(domain, newState);
      }

      if (isPreview) {
        console.log(`Domain ${domain.DomainName} new state is ${newState}`);
      }
      this.callback(null, "Success");
    } catch (err) {
      console.log(err);
      this.callback(err, null);
    }
  }
}

exports.Handler = Handler;
