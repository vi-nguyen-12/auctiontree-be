const router = require("express").Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const docusign = require("docusign-esign");

// const consentURI =
//   "https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=54bc1507-9cbe-4119-916f-ec1073bf7b48&redirect_uri=http://localhost:3000/";

const getUserInfo = async (access_token) => {
  const response = await axios.get(
    "https://account-d.docusign.com/oauth/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  return response.data;
};
const makeEnvelope = (args) => {
  // Create the envelope definition
  let env = new docusign.EnvelopeDefinition();
  env.templateId = args.templateId;

  let signer1 = docusign.TemplateRole.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    clientUserId: "100abc",
    roleName: "signer",
  });
  env.templateRoles = [signer1];
  env.status = "sent"; // We want the envelope to be sent;
  return env;
};

const makeRecipientViewRequest = (args) => {
  let viewRequest = new docusign.RecipientViewRequest();
  viewRequest.returnUrl = args.returnUrl + "?state=123";
  viewRequest.authenticationMethod = "none";
  viewRequest.email = args.signerEmail;
  viewRequest.userName = args.signerName;
  // viewRequest.clientUserId = args.signerClientId;
  // viewRequest.pingFrequency = 600;

  return viewRequest;
};
const getAccessToken = async () => {
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
  let now = new Date();
  let iat = now.getTime();
  let exp = now.setHours(now.getHours() + 1);
  const token = jwt.sign(
    {
      iss: "54bc1507-9cbe-4119-916f-ec1073bf7b48",
      sub: "d723cffd-8517-4977-9441-0ed3710626fa",
      aud: "account-d.docusign.com",
      iat,
      exp,
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
  return access_token;
};
router.get("/uiviews/envelopes/buyerSellerContract", async (req, res) => {
  const accessToken = await getAccessToken();
  const envelopeArgs = {
    templateId: "bd152cb4-2387-466a-a080-e74e37864be7",
    signerEmail: "nguyen.vi.1292@gmail.com",
    signerName: "Tri Pham",
    signerClientId: "100abc",
  };
  const apiArgs = {
    basePath: "https://demo.docusign.net/restapi",
    accessToken,
    accountId: "96fc7fb1-87e8-4e1a-914d-47e66a4f4ad0",
  };
  const recipientViewArgs = {
    returnUrl: "http://localhost:3000/",
    signerEmail: "nguyen.vi.1292@gmail.com",
    signerName: " Tri Pham",
    signerClientId: "100abc",
  };
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader(
    "Authorization",
    "Bearer " + apiArgs.accessToken
  );
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    envelopeResult = null;

  let envelope = makeEnvelope(envelopeArgs);
  envelopeResult = await envelopesApi.createEnvelope(apiArgs.accountId, {
    envelopeDefinition: envelope,
  });
  let envelopeId = envelopeResult.envelopeId;
  let viewRequest = makeRecipientViewRequest(recipientViewArgs),
    viewResult = null;
  viewResult = await envelopesApi.createRecipientView(
    apiArgs.accountId,
    envelopeId,
    { recipientViewRequest: viewRequest }
  );

  const recipientsResult = await envelopesApi.listRecipients(
    apiArgs.accountId,
    envelopeId,
    null
  );
  console.log(recipientsResult);
  res.status(200).send({ envelopeId, redirectUrl: viewResult.url });
});
//question: docusign: sign with us (Auction10X) or sign with seller
//assume with us: show on FE ->user sign -> save that documents where? -> show in the future.
//https://stackoverflow.com/questions/57358821/display-particular-signed-contract-in-docusign
//assume with seller: we send to buyer for sign -> we send that contract to seller to sign
module.exports = router;
