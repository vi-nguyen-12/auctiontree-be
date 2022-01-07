const router = require("express").Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const docusign = require("docusign-esign");

router.get("/", async (req, res) => {
  const consentURI =
    "https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=54bc1507-9cbe-4119-916f-ec1073bf7b48&redirect_uri=http://localhost:3000/";
  const privateKey =
    "-----BEGIN RSA PRIVATE KEY-----" +
    "\n" +
    "MIIEpAIBAAKCAQEAkLXEWbv7S4/9RWhSCx8NC70WltO4bO/OFqICOXQdjiNn/2F9" +
    "\n" +
    "2vdwirIQEOhbWnJyRJ7J52Pi4OGiSpwR2lQz1u465wZbGOjKTR2qg1s+uhaqfw9T" +
    "\n" +
    "aDl/eV3EvJZ13BvcakqxA0PCM/BMXIIXZDpAr25FUYUrhjIJ36OYP2hc4cOqP4Mk" +
    "\n" +
    "3Z4krxjIM/8IM6BtTQmebt7JcQiVnBx3vP+oYl9XWWAFRqwg3Yp4dfkQBQHWrWsA" +
    "\n" +
    "nw2gcFppMJYFlXhYXqoe+Hq81uUwpJJ6ipxp0MRAx3e6oQ/qGuxI31vTSkwJkLH8" +
    "\n" +
    "So/C8nOwbfMBUpfSB/KNuIRqwrsUCOb9+++pHwIDAQABAoIBAA6oOoEURzm6Fd8n" +
    "\n" +
    "19eEh5++wUD5pN5z0537Ptpu5md1Mp1tVIAPO/jwXCw6PLaGjQhiRPUI6vv4HqYL" +
    "\n" +
    "9Mr2aGHGs3Se8i8ttP/ml1TCszHKBe7ksIAIAt9aHgkz/DAVKlghxJgeDteP6Uwd" +
    "\n" +
    "aR0fwVmDg8XkBSqMeu+J9GvHuFCth1ywh3gUFLq6NtJLfiEZeJaBtOZiLtIhCJUo" +
    "\n" +
    "AQi46jAD68+RpMQBaJLhxDyO/74l/lol0cnbewAu8CmOH05s90F7CefLKksZE6Tg" +
    "\n" +
    "jgpXlvRjWAI86HfwfyFanxt2ruHOJIZVKl36AvifAvshBdajXCk8a0JyCTzgk7ei" +
    "\n" +
    "xsjAmdECgYEA4ffserdfhDtZiRKiCDSnP+wvV5hThvtsBiyCfti01+4ZiooGS+Nx" +
    "\n" +
    "nsyYddB7iZZ6IfqgDD3kqrcWtheqix8g1c4uxjEzNZT2Hv4tM9KCbqo2vakspTy3" +
    "\n" +
    "79qLdB86+eXglVtD6WL0QWpwQTF0f7dpPxCV+wBvHh8d8oKDKQcghIsCgYEAo/E0" +
    "\n" +
    "jAtrkDkq8Jc1VoPPOszTW5U/s4W82dxVoFEMw+xJC9igmGOHxYuSUu2Pj/OrZgTG" +
    "\n" +
    "8jt4htJB6YiEtKzwyG2vIDV1kpX0XMcrPOOKd1VcNbG70qPwqDBr65QEX9BdU3yO" +
    "\n" +
    "rG4IiJpfFRBf7MFQ3epN0mWAmgtJMFN2ykDOvD0CgYEAnDhGaOB1THmrgLQ9COc9" +
    "\n" +
    "6Vdjs28/78XJ/MqwvPkcrVuSlNCvYa+wUVSo4mprvccmUG9wToZLnCpPrTvXT68J" +
    "\n" +
    "iEau154UBSsirHKU1YrnWZKbnatjjijYER5J4tHkd/eQuDEMVkFvE/p9+NQz8kfe" +
    "\n" +
    "nxbcWVcHew+QKKRKAQdIV9kCgYBx+Mj4JyRTMnsYoXZSO/ZAQY8aVyre6jW9G4Fn" +
    "\n" +
    "n5EJT+YEV0hmSKNmAT7raf3pLJRWqzGHyzJiQB/Uc7UWSjhmjmI2ORQQoTEtosT7" +
    "\n" +
    "YpCrn2soZPRXXuN6eZc9Qjy8Q4Xt+WTSmPhTx0YcxbJ6THakoDQT9b6u2PO7pfqq" +
    "\n" +
    "Zt2SXQKBgQDCIr8qdTVsGZC2bdQTchvUMtzcsRq1iO0Zz7denMw+QCKf1DIpRAov" +
    "\n" +
    "TE3BGeLFMsX7+Q7Qcwllm77c5m22e0/KLueGKMfxxiO50DxOSOV7xVL7zAlgYXU6" +
    "\n" +
    "LbFg9/h+/NyJRtQb3mmQ/dx7/WHlfL1I6Vo+MznCZwFafQcjDnEdqA==" +
    "\n" +
    "-----END RSA PRIVATE KEY-----";
  const token = jwt.sign(
    {
      iss: "54bc1507-9cbe-4119-916f-ec1073bf7b48",
      sub: "d723cffd-8517-4977-9441-0ed3710626fa",
      aud: "account-d.docusign.com",
      iat: 1641531692851,
      exp: 1673068440,
      scope: "signature",
    },
    privateKey,
    { algorithm: "RS256" }
  );
  const getAccessToken = async () => {
    const response = await axios.post(
      "https://account-d.docusign.com/oauth/token",
      {
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: token,
      }
    );
    return response.data.access_token;
  };

  const access_token = await getAccessToken();
  const getUserInfo = async () => {
    const response = await axios.get(
      "https://account-d.docusign.com/oauth/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );
    return response.data;
  };
  const userInfo = await getUserInfo();

  //send envelope to signer email
  const envelopeArgs = {
    basePath: "https://demo.docusign.net/restapi",
    accessToken: access_token,
    accountId: "96fc7fb1-87e8-4e1a-914d-47e66a4f4ad0",
    envelopeArgs: {
      signerEmail: "tri.pham@labs196.com",
      signerName: "Tri",
      // signerClientId: "8f84e86f-d56b-4221-8818-1cd5c3b8d42d",
      // dsReturnUrl: dsReturnUrl,
      // dsPingUrl: dsPingUrl
    },
  };
  // await createEnvelopeNode(envelopeArgs);

  //create view request
  const viewArgs = {
    basePath: "https://demo.docusign.net/restapi",
    accessToken: access_token,
    accountId: "96fc7fb1-87e8-4e1a-914d-47e66a4f4ad0",
    viewArgs: {
      startingView: "envelope",
      envelopeId: "82d115ca-40c9-4541-9271-b0e8c437642c",
    },
  };

  const response = await embeddedConsoleViewRequest(viewArgs);
  console.log(response);

  res.status(200).send("done");
});

const makeEnvelope = async () => {
  // Create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.templateId = "bd152cb4-2387-466a-a080-e74e37864be7";

  let signer1 = docusign.TemplateRole.constructFromObject({
    email: "tri.pham@labs196.com",
    name: "Tri",
    roleName: "signer",
  });
  env.templateRoles = [signer1];
  env.status = "sent"; // We want the envelope to be sent;
  return env;
};
const createEnvelopeNode = async (args) => {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + args.accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    results = null;

  let envelope = await makeEnvelope(args.envelopeArgs);

  results = await envelopesApi.createEnvelope(args.accountId, {
    envelopeDefinition: envelope,
  });

  let envelopeId = results.envelopeId;
  console.log(`Envelope was created. EnvelopeId ${envelopeId}`);

  const recipientsResult = await envelopesApi.listRecipients(
    args.accountId,
    envelopeId,
    null
  );
  const recipients = recipientsResult.signers;
  console.log(recipients);

  let viewRequest = makeRecipientViewRequest(args.envelopeArgs);
  const viewResult = await envelopesApi.createRecipientView(
    args.accountId,
    envelopeId,
    {
      recipientViewRequest: viewRequest,
    }
  );

  return { envelopeId: envelopeId, redirectUrl: results.url };
};

const embeddedConsoleViewRequest = async (args) => {
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(args.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + args.accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  let viewRequest = makeConsoleViewRequest(args.viewArgs);

  let results = await envelopesApi.createConsoleView(args.accountId, {
    consoleViewRequest: viewRequest,
  });
  let url = results.url;
  return { redirectUrl: url };
};

function makeConsoleViewRequest(args) {
  let viewRequest = new docusign.ConsoleViewRequest();
  viewRequest.returnUrl = "http://localhost:3000";
  if (args.startingView == "envelope" && args.envelopeId) {
    viewRequest.envelopeId = args.envelopeId;
  }
  return viewRequest;
}

function makeRecipientViewRequest(args) {
  let viewRequest = new docusign.RecipientViewRequest();
  viewRequest.returnUrl = "http://localhost:3000/" + "?state=123";
  viewRequest.authenticationMethod = "none";
  viewRequest.email = args.signerEmail;
  viewRequest.userName = args.signerName;
  // viewRequest.clientUserId = args.signerClientId;

  // viewRequest.pingFrequency = 600;

  return viewRequest;
}

module.exports = router;
