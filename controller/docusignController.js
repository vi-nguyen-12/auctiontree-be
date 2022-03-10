const fs = require("fs");
const path = require("path");
const User = require("../model/User");
const Docusign = require("../model/Docusign");
const Property = require("../model/Property");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const docusign = require("docusign-esign");

const server_url =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_API_URL
    : process.env.DEV_API_URL;

const client_url =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_CLIENT_URL
    : process.env.DEV_CLIENT_URL;

// const consentURI =
//   "https://account-d.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=54bc1507-9cbe-4119-916f-ec1073bf7b48&redirect_uri=https://www.transenergy360.com/";

const getAccessToken = async () => {
  let privateKey = process.env.DOCUSIGN_PRIVATE_KEY.replace(/\\n/g, "\n");

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
  const getToken = async () => {
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

  const access_token = await getToken();
  return access_token;
};

let apiArgs = {
  basePath: "https://demo.docusign.net/restapi",
  accountId: "96fc7fb1-87e8-4e1a-914d-47e66a4f4ad0",
};

const returnUrlArgs = {
  dsReturnUrl: `${client_url}/docusign/callback`,
};

//request a signature by email,
//function: makeEnvelope & sendEnvelope

const makeEnvelope = (args) => {
  let doc1DocxBytes = fs.readFileSync(
    path.resolve(__dirname, "../public/test_word.docx")
  );

  let env = new docusign.EnvelopeDefinition();
  env.emailSubject = "Please sign seller agreement";

  let doc1b64 = Buffer.from(doc1DocxBytes).toString("base64");
  let doc1 = new docusign.Document.constructFromObject({
    documentBase64: doc1b64,
    name: "seller_agreement",
    fileExtension: "docx",
    documentId: "1",
  });

  env.documents = [doc1];

  // Create recipients
  let signer1 = docusign.Signer.constructFromObject({
    email: args.signer1.email,
    name: args.signer1.name,
    recipientId: "1",
    clientUserId: "1001",
    routingOrder: "1",
  });

  let cc1 = new docusign.CarbonCopy();
  cc1.email = args.cc1.email;
  cc1.name = args.cc1.name;
  cc1.routingOrder = "2";
  cc1.recipientId = "2";

  // Create tabs
  let signHere1 = docusign.SignHere.constructFromObject({
      anchorString: "Sign Here",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "60",
    }),
    signHere2 = docusign.SignHere.constructFromObject({
      anchorString: "Initial",
      anchorYOffset: "10",
      anchorUnits: "pixels",
      anchorXOffset: "60",
    });

  signer1.tabs = docusign.Tabs.constructFromObject({
    signHereTabs: [signHere1, signHere2],
  });

  // Add the recipients to the envelope object
  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer1],
    carbonCopies: [cc1],
  });
  env.recipients = recipients;

  // Envelope will be sent
  env.status = "sent";
  return env;
};

const sendEnvelope = async (req, res) => {
  const accessToken = await getAccessToken();
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  let envelopeArgs = {
    templateId: "bd152cb4-2387-466a-a080-e74e37864be7",
    signer1: { email: "nguyen.vi.1292@gmail.com", name: "Hello there" },
    cc1: { email: "nguyen.vi.1292@gmail.com", name: "tiho" },
  };
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
  // let envelope = makeEnvelope(envelopeArgs);
  let envelope = makeEnvelope(envelopeArgs);

  let results = await envelopesApi.createEnvelope(apiArgs.accountId, {
    envelopeDefinition: envelope,
  });
  return res.status(200).send({ message: "sent", results });
  // return results;
};

// @desc: Request a signature through your app
// @route: GET api/docusign/signature/sellerAgreement/uiviews?envelopeId=123
const makeRecipientViewRequest = (args) => {
  let viewRequest = new docusign.RecipientViewRequest();
  viewRequest.returnUrl = args.dsReturnUrl + "?state=signing_complete";
  viewRequest.authenticationMethod = "none";
  viewRequest.email = args.signerEmail;
  viewRequest.userName = args.signerName;
  viewRequest.recipientId = "1";
  viewRequest.clientUserId = "1001";
  // viewRequest.pingFrequency = 600;

  return viewRequest;
};

const getSellerAgreementUIViews = async (req, res) => {
  const accessToken = await getAccessToken();
  const user = await User.findById(req.user.userId);
  let envelopeId = req.query.envelopeId;
  let dcs;

  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient),
    envelopeResult = null;

  if (envelopeId) {
    dcs = await Docusign.findOne({ envelopeId });
  }

  //if dcs does not exist create a new one
  if (!dcs) {
    let envelopeArgs = {
      signer1: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        recipientId: "1",
        // clientUserId: "1001",
      },
      cc1: {
        email: "vienne@labs196.com",
        name: "Vi Nguyen",
        recipientId: "2",
        // clientUserId: "1002",
      },
    };
    let envelope = makeEnvelope(envelopeArgs);
    envelopeResult = await envelopesApi.createEnvelope(apiArgs.accountId, {
      envelopeDefinition: envelope,
    });

    const recipientsResult = await envelopesApi.listRecipients(
      apiArgs.accountId,
      (envelopeId = envelopeResult.envelopeId),
      null
    );

    envelopeId = envelopeResult.envelopeId;
    const newEnvelope = new Docusign({
      envelopeId,
      type: "seller_agreement",
      recipientId: user._id,
    });
    await newEnvelope.save();
  } else {
    envelopeId = dcs.envelopeId;
  }

  const recipientViewArgs = {
    dsReturnUrl: `${client_url}/api/docusign/callback/${envelopeId}`,
    signerEmail: user.email,
    signerName: `${user.firstName} ${user.lastName}`,
    recipientId: "1",
    clientUserId: "1001",
    // signerClientId: "100abc",
  };

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
  res.status(200).send({ envelopeId, redirectUrl: viewResult.url });
};

// @desc: callback after user has has signed
// @route: GET api/docusign/callback/:envelopeId
const callback = async (req, res) => {
  console.log("callback !!");
  try {
    const { envelopeId } = req.params;
    const { state, event } = req.query;
    console.log(envelopeId, state, event);
    const envelope = await Docusign.findOne({ envelopeId });
    envelope.status = event;
    await envelope.save();
    res.status(200).send(envelope.status);
    // res.redirect(`${process.env.CLIENT_HOST}?docusign=true&event=${event}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc: get status of envelope
// @route: GET api/docusign/envelopes/:envelopedId/status
const getEnvelopeStatus = async (req, res) => {
  try {
    const { envelopeId } = req.params;
    const dcs = await Docusign.findOne({ envelopeId });
    if (!dcs) {
      return res.status(200).send({ error: "No envelope found" });
    }
    const result = {
      _id: dcs.id,
      envelopeId: dcs.id,
      type: dcs.type,
      status: dcs.status,
    };
    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  getSellerAgreementUIViews,
  callback,
  getEnvelopeStatus,
  sendEnvelope,
};

const getUserInfo = async (access_token) => {
  const response = await axios.get(
    "https://account-d.docusign.com/oauth/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );
  return response.data;
};

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

//question: buyer docusign: sign with us (Auction10X) or sign with seller
//assume with us: show on FE ->user sign -> save that documents where? -> show in the future.
//https://stackoverflow.com/questions/57358821/display-particular-signed-contract-in-docusign
//assume with seller: we send to buyer for sign -> we send that contract to seller to sign
