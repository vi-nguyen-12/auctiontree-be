const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  uploadS3,
  upload,
  uploadAll,
  search,
  createNewEstates,
  getRealEstates,
  getRealEstate,
  getRealEstatesUpcomingAuctions,
  getRealEstatesOngoingAuctions,
  getRealEstatesStatusBuyer,
  getRealEstatesNotApproved,
  getRealEstatesApprovedNotAuction,
  approveProperty,
  disapproveProperty,
} = require("../controller/propertyController");

router.get("/search", search);

router.post("/images/upload", auth, uploadS3.array("images"), upload);
router.post("/videos/upload", auth, uploadS3.array("videos"), upload);
router.post("/documents/upload", auth, uploadS3.array("documents"), upload);
router.post(
  "/upload",
  auth,
  uploadS3.fields([
    { name: "images" },
    { name: "videos" },
    { name: "documents" },
  ]),
  uploadAll
);

router.get("/upcomingAuctions", getRealEstatesUpcomingAuctions);
router.get("/ongoingAuctions", getRealEstatesOngoingAuctions);
router.get("/status", auth, getRealEstatesStatusBuyer);
router.get("/approved/notAuction", getRealEstatesApprovedNotAuction);
router.get("/notApproved", getRealEstatesNotApproved);
//this should be only for user is admin
router.put("/:id/approved", approveProperty);
router.put("/:id/disapproved", disapproveProperty);
router.get("/:id", getRealEstate);
router.get("/", getRealEstates);
router.post("/", auth, createNewEstates);
module.exports = router;
