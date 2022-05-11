const router = require("express").Router();
const {
  addSubscription,
  removeSubscription,
} = require("../controller/subscriptionController");

router.post("/", addSubscription);
router.delete("/", removeSubscription);

module.exports = router;
