const fs = require("fs");
const path = require("path");
const User = require("../model/User");
const Buyer = require("../model/Buyer");
const Docusign = require("../model/Docusign");
const Property = require("../model/Property");
const Auction = require("../model/Auction");
const Document = require("../model/Document");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const docusign = require("docusign-esign");
const AWS = require("aws-sdk");
const { sendEmail } = require("../helper");

const client_url =
  process.env.NODE_ENV === "production"
    ? process.env.PROD_CLIENT_URL
    : process.env.NODE_ENV === "test"
    ? process.env.TEST_CLIENT_URL
    : process.env.DEV_CLIENT_URL;

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
  userName: "auction3x@gmail.com",
  password: "Sugarland123!",
};

const returnUrlArgs = {
  dsReturnUrl: `${client_url}/docusign/callback`,
};

// desc: make a new envelope
const createTabsAndSigners = () => {};

const makeEnvelope = async (args) => {
  let docName = args.docName;

  let env = new docusign.EnvelopeDefinition();
  let title = docName.split("_").join(" ");
  env.emailSubject = `Please sign ${title}`;

  const document = await Document.findOne({ officialName: docName }).select(
    "url"
  );
  if (!document) {
    return res.status(200).send({ error: `Document ${title} not found ` });
  }

  const s3 = new AWS.S3();
  const keyName = document.url.split("/")[4];
  const getObject = async (bucket, objectKey) => {
    try {
      const params = {
        Bucket: bucket,
        Key: `${process.env.AWS_BUCKET_FOLDER}/${objectKey}`,
      };

      const data = await s3.getObject(params).promise();

      return data.Body.toString("base64");
    } catch (e) {
      throw new Error(e);
    }
  };
  let docb64 = await getObject(process.env.AWS_BUCKET_NAME, keyName);
  let doc1 = new docusign.Document.constructFromObject({
    documentBase64: docb64,
    name: args.docName,
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
    // recipientId: args.signer1.recipientId,
    // clientUserId: args.signer1.clientUserId,
    routingOrder: "1",
  });

  let cc1 = new docusign.CarbonCopy();
  cc1.email = args.cc1.email;
  cc1.name = args.cc1.name;
  cc1.routingOrder = "2";
  cc1.recipientId = "2";

  // Create tabs
  // let property, sign1, sign2, by1, by2, date1, date2;
  if (docName === "selling_agreement") {
    let property = docusign.Text.constructFromObject({
      value: `${args.propertyAddress.formatted_street_address}, ${args.propertyAddress.city}, ${args.propertyAddress.state}, ${args.propertyAddress.zip_code}, ${args.propertyAddress.country}`,
      anchorString: "\\property\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "0",
      width: "176",
    });
    let sign1 = docusign.SignHere.constructFromObject({
      anchorString: "\\s1\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    let by1 = docusign.Text.constructFromObject({
      value: `${args.signer1.name}`,
      anchorString: "\\b1\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "50",
      width: "100",
    });
    let date1 = docusign.DateSigned.constructFromObject({
      anchorString: "\\d1\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    let sign2 = docusign.SignHere.constructFromObject({
      anchorString: "\\s2\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    let by2 = docusign.Text.constructFromObject({
      anchorString: "\\b2\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "50",
      width: "100",
    });
    let date2 = docusign.DateSigned.constructFromObject({
      anchorString: "\\d2\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    signer1.tabs = docusign.Tabs.constructFromObject({
      signHereTabs: [sign1],
      // prefillTabs: { textTabs: [property] },
      textTabs: [property, by1],
      dateSignedTabs: [date1],
    });
  }
  if (docName === "buying_agreement") {
    let sign1 = docusign.SignHere.constructFromObject({
      anchorString: "\\s1\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    let int1 = docusign.Text.constructFromObject({
      value: `${args.signer1.iniital}`,
      anchorString: "\\i1\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "80",
      width: "100",
    });
    let date1 = docusign.DateSigned.constructFromObject({
      anchorString: "\\d1\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    let sign2 = docusign.SignHere.constructFromObject({
      anchorString: "\\s2\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    let int2 = docusign.Text.constructFromObject({
      anchorString: "\\b2\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    let date2 = docusign.DateSigned.constructFromObject({
      anchorString: "\\d2\\",
      anchorYOffset: "-5",
      anchorUnits: "pixels",
      anchorXOffset: "100",
    });
    signer1.tabs = docusign.Tabs.constructFromObject({
      signHereTabs: [sign1],
      textTabs: [int1],
      dateSignedTabs: [date1],
    });
  }

  // Add the recipients to the envelope object
  let recipients = docusign.Recipients.constructFromObject({
    signers: [signer1],
    // carbonCopies: [cc1],
  });
  env.recipients = recipients;

  // Envelope will be sent
  env.status = "sent";
  return env;
};

const generateEnvelope = async (envelope) => {
  const accessToken = await getAccessToken();
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopeApi = new docusign.EnvelopesApi(dsApiClient);

  let envelopeResult = await envelopeApi.createEnvelope(apiArgs.accountId, {
    envelopeDefinition: envelope,
  });

  return envelopeResult;
};

// desc: make a recipient view request and create UI URL

const makeRecipientViewRequest = (args) => {
  let viewRequest = new docusign.RecipientViewRequest();
  viewRequest.returnUrl = args.dsReturnUrl + "?state=signing_complete";
  viewRequest.authenticationMethod = "none";
  viewRequest.email = args.signerEmail;
  viewRequest.userName = args.signerName;
  viewRequest.recipientId = "1";
  viewRequest.clientUserId = "1001";
  return viewRequest;
};

const createSellingAgreementURL = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let property = await Property.findById(req.params.propertyId)
      .populate("createdBy")
      .select("createdBy docusignId details");

    // we already have property with owner/broker information,
    //  check if owner: signer is owner, email is owner email
    // if broker has power of attorney, signer is broker, email is broker email
    // if broker doesn't have power of attorney, signer is owner_name, email is owner email

    if (!property) {
      return res.status(200).send({ error: "Property not found" });
    }

    let envelopeId;
    let signerName = `${user.firstName} ${user.lastName}`;
    let signerEmail = user.email;
    let docName = "selling_agreement";

    //if dcs does not exist create a new on to get envelopeId

    if (!property.docusignId) {
      let envelopeArgs = {
        signer1: {
          email: signerEmail,
          name: signerName,
          iniital: `${
            user.firstName.charAt(0).toUpperCase() +
            user.lastName.charAt(0).toUpperCase()
          }`,
          recipientId: "1",
          clientUserId: "1001",
        },
        cc1: {
          email: "vienne@labs196.com",
          name: "Vi Nguyen",
          recipientId: "2",
          clientUserId: "1002",
        },
        docName,
        propertyAddress: property.details.property_address,
      };

      let envelope = await makeEnvelope(envelopeArgs);
      let envelopeResult = await generateEnvelope(envelope);

      envelopeId = envelopeResult.envelopeId;
      const newDocusign = await Docusign.create({
        envelopeId,
        name: docName,
        recipientId: user._id,
      });

      property.docusignId = newDocusign._id;

      await property.save();
    } else {
      let dcs = await Docusign.findById(property.docusignId).select(
        "envelopeId"
      );

      envelopeId = dcs.envelopeId;
    }
    let viewResult = await getRecipientURL({
      envelopeId,
      signerName,
      signerEmail,
    });

    res.locals = {
      envelopeId,
      docusignId: property.docusignId,
      redirectUrl: viewResult.url,
      propertyDetails: property.details,
      //emails:
    };
    next();
  } catch (error) {
    res.status(500).send(error);
  }
};

const createBuyingAgreementURL = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let auction = await Auction.findById(req.params.auctionId).populate(
      "property"
    );

    if (!auction) {
      return res.status(200).send({ error: "Auction not found" });
    }

    let { clientName, clientEmail } = req.body;
    let clientInitial = "";
    if ((clientName && !clientEmail) || (!clientName && clientEmail)) {
      return res
        .status(200)
        .send({ error: "Missing client name or client email" });
    }
    if (clientName) {
      let words = clientName.split(" ");
      for (let word of words) {
        word = word.charAt(0).toUpperCase() + word.slice(1);
        clientInitial += word.charAt(0).toUpperCase();
      }
      clientName = words.join(" ");
    }

    let envelopeId, docusignId;
    let signerName =
      clientName ||
      `${
        user.firstName.charAt(0).toUpperCase() +
        user.firstName.toLowerCase().slice(1)
      } ${
        user.lastName.charAt(0).toUpperCase() +
        user.lastName.toLowerCase().slice(1)
      }`;
    let signerEmail = clientEmail || user.email;
    let signerInitial =
      clientInitial ||
      `${
        user.firstName.charAt(0).toUpperCase() +
        user.lastName.charAt(0).toUpperCase()
      }`;
    let recipientId = "1";
    let clientUserId = "1001";
    let docName = "buying_agreement";

    //if dcs does not exist create a new one

    let envelopeArgs = {
      signer1: {
        email: signerEmail,
        name: signerName,
        iniital: signerInitial,
        recipientId,
        clientUserId,
      },
      cc1: {
        email: "vienne@labs196.com",
        name: "Vi Nguyen",
        recipientId: "2",
        clientUserId: "1002",
      },
      docName,
    };
    let envelope = await makeEnvelope(envelopeArgs);
    let envelopeResult = await generateEnvelope(envelope);

    envelopeId = envelopeResult.envelopeId;
    const newDocusign = await Docusign.create({
      envelopeId,
      name: docName,
      recipientId: user._id,
      recipients: [
        {
          type: "signer1",
          name: signerName,
          email: signerEmail,
          recipientId,
          clientUserId,
        },
      ],
    });

    await newDocusign.save();
    docusignId = newDocusign._id;

    let viewResult = await getRecipientURL({
      envelopeId,
      signerName,
      signerEmail,
      recipientId,
      clientUserId,
    });

    res.locals = {
      docusignId,
      redirectUrl: viewResult.url,
      propertyDetails: auction.property.details,
      emails: [signerEmail],
    };
    next();
  } catch (error) {
    res.status(500).send(error);
  }
};

const createURLFromDocusignId = async (req, res, next) => {
  try {
    const docusign = await Docusign.findById(req.params.docusignId);
    if (!docusign) {
      return res.status(200)({ error: "Docusign not found" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
};

const getRecipientURL = async ({
  envelopeId,
  signerName,
  signerEmail,
  recipientId,
  clientUserId,
}) => {
  const accessToken = await getAccessToken();
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

  const recipientViewArgs = {
    dsReturnUrl: `${client_url}/docusign/callback/${envelopeId}`,
    signerEmail,
    signerName,
    recipientId,
    clientUserId,
    // signerClientId: "100abc",
  };
  let viewRequest = makeRecipientViewRequest(recipientViewArgs);

  let viewResult = await envelopesApi.createRecipientView(
    apiArgs.accountId,
    envelopeId,
    { recipientViewRequest: viewRequest }
  );

  return viewResult;
};

const sendEnvelope = async (req, res) => {
  const accessToken = await getAccessToken();
  let dsApiClient = new docusign.ApiClient();
  dsApiClient.setBasePath(apiArgs.basePath);
  dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);

  let envelopeArgs = {
    templateId: "bd152cb4-2387-466a-a080-e74e37864be7",
    signer1: { email: "vienne@labs196.com", name: "Hello there" },
    cc1: { email: "nguyen.vi.1292@gmail.com", name: "tiho" },
    docName: "selling_agreement",
  };
  let envelopesApi = new docusign.EnvelopesApi(dsApiClient);
  let envelope = makeEnvelope(envelopeArgs);

  let results = await envelopesApi.createEnvelope(apiArgs.accountId, {
    envelopeDefinition: envelope,
  });
  return res.status(200).send({ message: "sent", results });
  // return results;
};

// @desc: Send UIViews through your app
// @route: GET api/docusign/signature/:docName/:propertyId/uiviews

const sendUIViews = (req, res) => {
  try {
    return res.status(200).send({
      docusignId: res.locals.docusignId,
      redirectUrl: res.locals.redirectUrl,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

const sendBuyingAgreementURLByEmail = (req, res) => {
  try {
    sendEmail({
      to: res.locals.emails,
      subject: "Auction Tree - Request for signature of buying agreement",
      htmlText: `<p>Please click in this link to sign buying agreement with Auction Tree <a href=${res.locals.redirectUrl}> Link </a> </p>`,
    });
    return res.status(200).send({
      message: "Email sent successfully",
      docusignId: res.locals.docusignId,
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

// @desc: Send UIViews through email
// @route: GET api/docusign/signature/:docName/:propertyId/email
const sendUIURLByEmail = (req, res) => {
  try {
    if (!res.locals.propertyDetails.owner_email) {
      return res.status(500).send({ message: "No email address provided" });
    }
    sendEmail({
      to: res.locals.propertyDetails.owner_email,
      subject: "Auction Tree- Request for signature of selling agreement",
      htmlText: `<p>Please click in this link to sign selling agreement with Auction Tree <a href=${res.locals.redirectUrl}> Link </a> </p>`,
    });
    return res.status(200).send({ message: "Email sent successfully" });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

// @desc: callback after user has has signed
// @route: GET api/docusign/callback/:envelopeId
const callback = async (req, res) => {
  try {
    const { envelopeId } = req.params;
    const { state, event } = req.query;
    const envelope = await Docusign.findOne({ envelopeId });
    envelope.status = event;
    await envelope.save();
    res.status(200).send(envelope.status);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc: Get uiviews of a docusign
// @route: GET api/docusign/:id/uiviews
const getDocusignView = async (req, res) => {
  try {
    const dcs = await Docusign.findById(req.params.id);
    const envelopeId = dcs.envelopeId;
    let signerName, signerEmail, recipientId, clientUserId;

    for (let recipient of dcs.recipients) {
      if (recipient.type === "signer1") {
        signerName = recipient.name;
        signerEmail = recipient.email;
        recipientId = recipient.recipientId;
        clientUserId = recipient.clientUserId;
      }
    }

    let viewResult = await getRecipientURL({
      envelopeId,
      signerName,
      signerEmail,
      recipientId,
      clientUserId,
    });

    res.status(200).send(viewResult);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc: Get uiviews of a docusign by propertyId
// @route: GET api/docusign/propertyId/:propertyId/uiviews

const getDocusignViewByPropertyId = async (req, res) => {
  try {
    const { propertyId, buyerId } = req.query;
    let dcs, envelopeId, signerEmail, signerName, recipientId, clientUserId;

    if (!propertyId && !buyerId) {
      return res
        .status(200)
        .error({ error: "propertyId or buyerId is required" });
    }
    if (propertyId) {
      const property = await Property.findById(propertyId)
        .populate("createdBy docusignId")
        .select("createdBy docusignId");

      envelopeId = property.docusignId.envelopeId;
      for (let recipient of property.docusignId.recipients) {
        if (recipient.type === "signer1") {
          signerName = recipient.name;
          signerEmail = recipient.email;
          recipientId = recipient.recipientId;
          clientUserId = recipient.clientUserId;
        }
      }
    }

    if (buyerId) {
      const buyer = await Buyer.findById(buyerId)
        .populate("userId docusignId")
        .select("docusignId");
      envelopeId = buyer.docusignId.envelopeId;
      for (let recipient of buyer.docusignId.recipients) {
        if (recipient.type === "signer1") {
          signerName = recipient.name;
          signerEmail = recipient.email;
          recipientId = recipient.recipientId;
          clientUserId = recipient.clientUserId;
        }
      }
    }

    let viewResult = await getRecipientURL({
      envelopeId,
      signerName,
      signerEmail,
      recipientId,
      clientUserId,
    });

    res.status(200).send(viewResult);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc: get status of envelope (from docusign system)
// @route: GET api/docusign/envelopes/:envelopedId

const getEnvelopeInfo = async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    let dsApiClient = new docusign.ApiClient();
    dsApiClient.setBasePath(apiArgs.basePath);
    dsApiClient.addDefaultHeader("Authorization", "Bearer " + accessToken);
    let envelopesApi = new docusign.EnvelopesApi(dsApiClient);

    let envelopeId = req.params.id;
    results = await envelopesApi.getEnvelope(
      apiArgs.accountId,
      envelopeId,
      null
    );
    return res.status(200).send(results);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc: get docusign
// @route: GET api/docusign/:id
const getDocusign = async (req, res) => {
  try {
    const docusign = await Docusign.findById(req.params.id);
    return res.status(200).send(docusign);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createSellingAgreementURL,
  createBuyingAgreementURL,
  callback,
  getDocusignView,
  sendEnvelope,
  sendUIViews,
  sendUIURLByEmail,
  getEnvelopeInfo,
  getDocusign,
  createURLFromDocusignId,
  sendBuyingAgreementURLByEmail,
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

//question: buyer docusign: sign with us (Auction Tree) or sign with seller
//assume with us: show on FE ->user sign -> save that documents where? -> show in the future.
//https://stackoverflow.com/questions/57358821/display-particular-signed-contract-in-docusign
//assume with seller: we send to buyer for sign -> we send that contract to seller to sign
