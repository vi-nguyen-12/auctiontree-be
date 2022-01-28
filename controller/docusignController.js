const router = require("express").Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const docusign = require("docusign-esign");

// const consentURI =
//   "https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=54bc1507-9cbe-4119-916f-ec1073bf7b48&redirect_uri=https://www.transenergy360.com/";

const constructConsentURI = async () => {};
const getAccessToken = async () => {
  let privateKey =
    "-----BEGIN RSA PRIVATE KEY-----" +
    "\n" +
    "MIIEowIBAAKCAQEAitik5zentkoV+dR04jbQjgD2jFHO++DNOfBe+oFoCRV1UkPI" +
    "\n" +
    "9t30lEHvnnFp79xMtF/Lbekm/HFgfAoU2p6zb7HPZ1Ziyalu1PJqoulvXaCOGW7/" +
    "\n" +
    "6KSL3gKrXd9LjkeZauxjnA91R+x6dFsXOVXYNUojQ71bf8/xC2mAllV/Ol2Oppl1" +
    "\n" +
    "gT68NxMkp6cGnuyzpT7q7g5m09IDUzMEeKh1x6umBRvM7WxODEaMqNyLJpVDYOBA" +
    "\n" +
    "miPrNbu6TvC2r4D38iNRd9ZWWdDs2dSv+HTWpoOyUu2aXcCKifbYy4JQdIo0T0Kj" +
    "\n" +
    "Rn3KXbVpA2/TryuIYZh8VjajicMGJP6SPw6fbwIDAQABAoIBABEkxte1y4N6ilQa" +
    "\n" +
    "o4P6+K1P+SFCSKhZDX4F6/RKXiog+Cd8LygsJ7LWoVuS7V2sedwbp+aeTy4EYcFv" +
    "\n" +
    "DTwhNE6qSc2coP39aa3pcLlE0XdiB6mkRvzWtF5pPfeNRqr+tDa7kWEHl5eV31jW" +
    "\n" +
    "lnuB2fxadxg6HT4e0shx8mqdi+QM0IZECGxtX/zpIh7xVN4Gul8dFYscQAWP4x8e" +
    "\n" +
    "d/Owt+yXtaSt/JqVp2Y1eRGjkAPWJClfY0j2AWjAf2JPMCG5Kv0zcpZcZrvPdwzl" +
    "\n" +
    "7j++mMEfsqeAMFDRmdDa/bUx96tTzWH8OESGGDxEYlyZcfb0oOlXdhe5uvI0/B2A" +
    "\n" +
    "LAGtLWECgYEA/z/PGgQRnqnCpJYFkJYmm+xitTHYOwSBf5pIT8REs/cXdBoqS/J5" +
    "\n" +
    "g8avulfduhEn9Mbzr35VKobJ6g85aQr1MjArwDsw4WpuSvAvPo2CL8lTrF1Dq5ni" +
    "\n" +
    "M5OyW4szlFm3uP38Mn9IC+P+wZZVmMC5kmL3dnQTTbOKIy6qvHnQ7RUCgYEAi0Ew" +
    "\n" +
    "ZNa2h6aWgpjsonjHWHRqrbGGbY5F/Vz+urXjEsMM2RIvFyu5JkYxvDL7+v0wUAI2" +
    "\n" +
    "EYpd7SPPxMVkdz9E4ojx4Sfsyxr5QbopM/2WIb9vbeDSDZwzCpPqsB3FaAnBYC4r" +
    "\n" +
    "6+H2cpm1r14MvD9aDFSq6U9aC240YlBrElOxY3MCgYEA6995cJ8l8SsLFbEU/2Hh" +
    "\n" +
    "1+D/7lVbbl5hlRtri1rh6jSCVeYABCLUK/QlW9vqqBFGjSp08k2aQixA1qyu7uUT" +
    "\n" +
    "ZQeixodsSkJiHZoK7pEyJxqy2ettp1wS7nqkLXhbd9HYt3jt33RDjclpGFfmTbx7" +
    "\n" +
    "QE14RNxLIlixZIWxfW5MpWkCgYBN7hlrFU3o9C1ewL4M3pKQyfW5ZpPYU7qPY6+a" +
    "\n" +
    "RZfiNA3InQiFaw6egMHslIu3lmGnJNWlU03lHBl2ARGMOngOXp0eZ/14XIwJYGkW" +
    "\n" +
    "k1+lW0C8uQhUXYmi7cx06vRCmNMDRFOIGliVIbgvf+6YmsuGAwvyrVmy8+WU73Q8" +
    "\n" +
    "OWIYSQKBgFK1pjbYG2G0HzMbLI1ZKyvtV84O2+hSxi2O059gQihv0gAy96JwfQuw" +
    "\n" +
    "6o728qsg5cfmenfNxSQCyDbHqG4hkUQDOBVFVzPKzqonyk2c9oAgpezWPu82Sl0X" +
    "\n" +
    "7ERQ0x4fEzfE2GqbrBcYWXtK4ImrI7bG2l4YXWb1RI3uG5u7IZLw" +
    "\n" +
    "-----END RSA PRIVATE KEY-----";

  let now = new Date();
  let iat = Math.floor(now.getTime() / 1000);
  let exp = Math.floor(now.setHours(now.getHours() + 3) / 1000);
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
    try {
      const response = await axios.post(
        "https://account-d.docusign.com/oauth/token",
        {
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: token,
        }
      );
      return response.data.access_token;
    } catch (err) {
      console.log(err.message);
    }
  };

  const access_token = await getAccessToken();
  return access_token;
};
const getUserInfo = async (access_token) => {
  const response = await axios.get(
    "https://account-d.docusign.com/oauth/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  return response.data;
};
let envelopeArgs = {
  templateId: "bd152cb4-2387-466a-a080-e74e37864be7",
  signerEmail: "nguyen.vi.1292@gmail.com",
  signerName: "Tri Pham",
  signerClientId: "100abc",
};

let apiArgs = {
  basePath: "https://demo.docusign.net/restapi",
  accountId: "96fc7fb1-87e8-4e1a-914d-47e66a4f4ad0",
};

const recipientViewArgs = {
  returnUrl: "http://localhost:3000/",
  signerEmail: "nguyen.vi.1292@gmail.com",
  signerName: " Tri Pham",
  signerClientId: "100abc",
};

const returnUrlArgs = {
  dsReturnUrl: "http://localhost:3000/docusign",
};

//request a signature by email using a template,
//function: makeEnvelope & createAndSendEnvelope
const makeEnvelope = (args) => {
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

const createAndSendEnvelope = async (args) => {
  const accessToken = await getAccessToken();
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
  let envelope = makeEnvelope(envelopeArgs);

  let results = await envelopesApi.createEnvelope(apiArgs.accountId, {
    envelopeDefinition: envelope,
  });
  return results;
};

// @desc: Request a signature through your app
// @route: GET /docusign/signature/uiviews
const makeRecipientViewRequest = (args) => {
  let viewRequest = new docusign.RecipientViewRequest();
  viewRequest.returnUrl = returnUrlArgs.dsReturnUrl + "?state=signing_complete";
  viewRequest.authenticationMethod = "none";
  viewRequest.email = recipientViewArgs.signerEmail;
  viewRequest.userName = recipientViewArgs.signerName;
  // viewRequest.clientUserId = args.signerClientId;
  // viewRequest.pingFrequency = 600;

  return viewRequest;
};

router.get("/uiviews/envelopes/buyerSellerContract", async (req, res) => {
  const accessToken = await getAccessToken();

  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    envelopeResult = null;

  let envelope = makeEnvelope(envelopeArgs);
  envelopeResult = await envelopesApi.createEnvelope(apiArgs.accountId, {
    envelopeDefinition: envelope,
  });
  let envelopeId = envelopeResult.envelopeId;
  let viewRequest = makeRecipientViewRequest(),
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

//send an envelope via your app
// function prepareEnvelope & createEnvelope & makeSenderViewRequest & sendEnvelopeViaApp
const prepareEnvelope = (args) => {
  let env = new docusign.EnvelopeDefinition();
  env.templateId = args.templateId;

  let signer1 = docusign.TemplateRole.constructFromObject({
    email: args.signerEmail,
    name: args.signerName,
    clientUserId: "100abc",
    roleName: "signer",
  });
  env.templateRoles = [signer1];
  env.status = "created"; //Make the envelope with "created" (draft) status
  return env;
};
const createEnvelope = async () => {
  const accessToken = await getAccessToken();
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  // Make the envelope request body
  let envelope = prepareEnvelope(envelopeArgs);

  // Call Envelopes::create API method
  // Exceptions will be caught by the calling function
  let results = await envelopesApi.createEnvelope(apiArgs.accountId, {
    envelopeDefinition: envelope,
  });
  return results;
};

const makeSenderViewRequest = (args) => {
  let viewRequest = new docusign.ReturnUrlRequest();
  // Data for this method
  // args.dsReturnUrl

  // Set the url where you want the recipient to go once they are done signing
  // should typically be a callback route somewhere in your app.
  viewRequest.returnUrl = args.dsReturnUrl;
  return viewRequest;
};
const sendEnvelopeViaApp = async (args) => {
  const accessToken = await getAccessToken();
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  envelopeArgs = { ...envelopeArgs, status: "created" };
  let results = await createEnvelope(),
    envelopeId = results.envelopeId;
  // Create the sender view
  let viewRequest = makeSenderViewRequest(returnUrlArgs);

  // Call the CreateSenderView API
  // Exceptions will be caught by the calling function
  results = await envelopesApi.createSenderView(apiArgs.accountId, envelopeId, {
    returnUrlRequest: viewRequest,
  });

  // Switch to Recipient and Documents view if requested by the user
  let url = results.url;
  // console.log(`startingView: ${args.startingView}`);
  // if (args.startingView === "recipient") {
  //   url = url.replace("send=1", "send=0");
  // }
  return { envelopeId: envelopeId, redirectUrl: url };
};

// Embed the DocuSign UI in your app
// makeConsoleViewRequest & embededConsole
const makeConsoleViewRequest = (args) => {
  let viewRequest = new docusign.ConsoleViewRequest();
  // Set the url where you want the recipient to go once they are done
  // with the NDSE. It is usually the case that the
  // user will never "finish" with the NDSE.
  // Assume that control will not be passed back to your app.
  viewRequest.returnUrl = returnUrlArgs.dsReturnUrl;
  if (args.startingView == "envelope" && args.envelopeId) {
    viewRequest.envelopeId = args.envelopeId;
  }
  return viewRequest;
};
const embededConsole = async (args) => {
  const accessToken = await getAccessToken();

  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
  envelopeArgs = { ...envelopeArgs, status: "created" };
  let envelope = await createEnvelope(),
    envelopeId = envelope.envelopeId;
  apiArgs = { ...apiArgs, startingView: "envelope", envelopeId };

  let viewRequest = makeConsoleViewRequest(apiArgs);
  let results = await envelopesApi.createConsoleView(apiArgs.accountId, {
    consoleViewRequest: viewRequest,
  });
  let url = results.url;
  console.log(`NDSE view URL: ${url}`);
  return { redirectUrl: url };
};

router.get("/accessToken", getAccessToken);
router.get("/send", createAndSendEnvelope);
router.get("/sendViaApp", sendEnvelopeViaApp);
router.get("/embededConsole", embededConsole);
// router.get("/requestSignatureThroughApp", requestSignatureThroughApp);

// router.get("/test1", createAndSendEnvelope);
//question: docusign: sign with us (Auction10X) or sign with seller
//assume with us: show on FE ->user sign -> save that documents where? -> show in the future.
//https://stackoverflow.com/questions/57358821/display-particular-signed-contract-in-docusign
//assume with seller: we send to buyer for sign -> we send that contract to seller to sign
module.exports = router;
