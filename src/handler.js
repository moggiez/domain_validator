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

  async handle() {
    const domains = await getDomainsPendingValidation();
    for (const domain of domains.Items) {
      await this.validateDomain(domain);
    }
  }

  async validateDomain(domain) {
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
        if (cnameValue != null) {
          newState =
            cnameValue == domain.ValidationRecordValue
              ? DOMAIN_STATES.VALIDATED
              : hasValidationExpired(domain)
              ? DOMAIN_STATES.PENDING_VALIDATION
              : DOMAIN_STATES.INVALID;
        }
      }
      if (initialState !== newState) {
        await setDomainValidationState(domain, newState);
      }
      this.callback(null, "Success");
    } catch (err) {
      console.log(err);
      this.callback(err, null);
    }
  }
}

exports.Handler = Handler;
