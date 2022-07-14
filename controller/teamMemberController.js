const TeamMember = require("../model/TeamMember");
const Joi = require("joi");

// @desc  Create a team member
// @route POST /api/teamMembers   body:{}
const createTeamMember = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      department,
      linkedln,
      location,
      profileImage,
    } = req.body;
    const bodySchema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      department: Joi.string()
        .required()
        .valid(
          "operation",
          "founder",
          "research",
          "marketing",
          "technology",
          "business",
          "legal"
        ),
      location: Joi.object({
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
      }),
      linkedln: Joi.string().optional(),
      profileImage: Joi.string().optional(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }
    const newTeamMember = new TeamMember({
      firstName,
      lastName,
      department,
      linkedln,
      location,
      profileImage,
    });
    const savedTeamMember = await newTeamMember.save();
    return res.status(200).send(savedTeamMember);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc  Get all team members
// @route GET /api/faqs
const getTeamMembers = async (req, res) => {
  try {
    const teamMembers = await TeamMember.find();
    return res.status(200).send(teamMembers);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc  Edit a team member
// @route PUT /api/teamMembers/:id  body:{....}
const editTeamMember = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      department,
      linkedln,
      location,
      profileImage,
    } = req.body;
    const bodySchema = Joi.object({
      firstName: Joi.string().required(),
      lastName: Joi.string().required(),
      department: Joi.string()
        .required()
        .valid(
          "operation",
          "founder",
          "research",
          "marketing",
          "technology",
          "business",
          "legal"
        ),
      location: Joi.object({
        city: Joi.string().required(),
        state: Joi.string().required(),
        country: Joi.string().required(),
      }),
      linkedln: Joi.string().optional(),
      profileImage: Joi.string().optional(),
    });
    const { error } = bodySchema.validate(req.body);
    if (error) {
      return res.status(200).send({ error: error.details[0].message });
    }
    const updatedTeamMember = await TeamMember.findByIdAndUpdate(
      req.params.id,
      {
        firstName,
        lastName,
        department,
        linkedln,
        location,
        profileImage,
      }
    );
    return res.status(200).send(updatedTeamMember);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// @desc  Delete a team member
// @route DELETE /api/teamMembers/:id
const deleteTeamMember = async (req, res) => {
  try {
    await TeamMember.deleteOne({ _id: req.params.id });
    res.status(200).send({ message: "Team member deleted successfully" });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  createTeamMember,
  editTeamMember,
  getTeamMembers,
  deleteTeamMember,
};
