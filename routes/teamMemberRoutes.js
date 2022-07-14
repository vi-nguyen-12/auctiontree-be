const router = require("express").Router();
const { auth } = require("../middleware/verifyToken");
const {
  createTeamMember,
  editTeamMember,
  getTeamMembers,
  deleteTeamMember,
} = require("../controller/teamMemberController");

// should check if the user is admin
router.post("/", createTeamMember);
router.get("/", getTeamMembers);
router.put("/:id", editTeamMember);
router.delete("/:id", deleteTeamMember);

module.exports = router;
