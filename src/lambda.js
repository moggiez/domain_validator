class LambdaApiClient {
  constructor({ callerName, functionName, AWS }) {
    this.callerName = callerName;
    this.functionName = functionName;
    this.lambdaClient = new AWS.Lambda();
  }

  invoke(action, parameters) {
    const payload = {
      meta: {
        called_from: this.callerName,
        date: new Date().toISOString(),
      },
      isInternal: true,
      action,
      parameters,
    };
    const params = {
      FunctionName: this.functionName, // the lambda function we are going to invoke
      InvocationType: "RequestResponse",
      LogType: "Tail",
      Payload: JSON.stringify(payload),
    };

    return new Promise((resolve, reject) => {
      this.lambdaClient.invoke(params, (err, data) => {
        if (err) {
          console.log("Lambda error", err);
          reject(err);
        } else {
          if (data.StatusCode === 200) {
            resolve(JSON.parse(data.Payload));
          } else {
            reject(`Call to internal api ${this.functionName} failed.`);
          }
        }
      });
    });
  }
}

exports.LambdaApiClient = LambdaApiClient;
