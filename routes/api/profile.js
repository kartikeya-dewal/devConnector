const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const request = require('request');
const config = require('config');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const logger = require('../../lib/logger');

/**
 * @route       GET /api/profile/me
 * @description Get current user's profile
 * @access      Private
 */
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route       POST /api/profile
 * @description Create or update a user profile
 * @access      Private
 */
router.post('/', [auth,
  [
    check('status', 'Status is required').not().isEmpty(),
    check('skills', 'Skills is required').not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { company, website, location, bio, status,
    githubUsername, skills, youtube, facebook,
    twitter, instagram, linkedin } = req.body;

  // Build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if (company) profileFields.company = company;
  if (website) profileFields.website = website;
  if (location) profileFields.location = location;
  if (bio) profileFields.bio = bio;
  if (status) profileFields.status = status;
  if (githubUsername) profileFields.githubUsername = githubUsername;
  if (skills) profileFields.skills = skills.split(',').map(skill => skill.trim());

  // Build social object
  profileFields.social = {};
  if (youtube) profileFields.social.youtube = youtube;
  if (facebook) profileFields.social.facebook = facebook;
  if (twitter) profileFields.social.twitter = twitter;
  if (instagram) profileFields.social.instagram = instagram;
  if (linkedin) profileFields.social.linkedin = linkedin;

  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields }, { new: true });
      return res.json(profile);
    }
    profile = new Profile(profileFields);
    await profile.save();
    return res.json(profile);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send('Server Error');
  }

  res.send(profileFields.skills);
});

/**
 * @route       GET /api/profile
 * @description Get all profiles
 * @access      Public
 */
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    logger.error(err.message);
    res.status(500).send('Server Errror');
  }
});

/**
 * @route       GET /api/profile/user/:userId
 * @description Get profile by user id
 * @access      Public
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId }).populate('user', ['name', 'avatar']);
    if (!profile) return res.status(400).json({ msg: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    logger.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Errror');
  }
});

/**
 * @route       DELETE /api/profile
 * @description Delete profile, user and posts
 * @access      Private
 */
router.delete('/', auth, async (req, res) => {
  try {
    // @todo - remove user's posts
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });
    res.json({ msg: 'User deleted' });
  } catch (err) {
    logger.error(err.message);
    res.status(500).send('Server Errror');
  }
});

/**
 * @route       PUT /api/profile/experience
 * @description Add profile experience
 * @access      Private
 */
router.put('/experience', [auth, [
  check('title', 'Title is required').not().isEmpty(),
  check('company', 'Company is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { title, company, location, from, to, current, description } = req.body;
  const newExp = { title, company, location, from, to, current, description };
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.experience.unshift(newExp);
    await profile.save();
    res.json(profile);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send('Server error');
  }
});

/**
 * @route       DELETE /api/profile/experience/:expId
 * @description Delete experience from profile
 * @access      Private
 */
router.delete('/experience/:expId', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // Get remove index
    const index = profile.experience.map(item => item.id).indexOf(req.params.expId);
    profile.experience.splice(index, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send('Server error');
  }
});

/**
 * @route       PUT /api/profile/education
 * @description Add profile education
 * @access      Private
 */
router.put('/education', [auth, [
  check('school', 'School is required').not().isEmpty(),
  check('degree', 'Degree is required').not().isEmpty(),
  check('fieldOfStudy', 'Field of study is required').not().isEmpty(),
  check('from', 'From date is required').not().isEmpty(),
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { school, degree, fieldOfStudy, from, to, current, description } = req.body;
  const newEdu = { school, degree, fieldOfStudy, from, to, current, description };
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    profile.education.unshift(newEdu);
    await profile.save();
    res.json(profile);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send('Server error');
  }
});

/**
 * @route       DELETE /api/profile/education/:eduId
 * @description Delete education from profile
 * @access      Private
 */
router.delete('/education/:eduId', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    // Get remove index
    const index = profile.education.map(item => item.id).indexOf(req.params.eduId);
    profile.education.splice(index, 1);
    await profile.save();
    res.json(profile);
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send('Server error');
  }
});

/**
 * @route       GET /api/profile/github/:username
 * @description Get user repos from github
 * @access      Public
 */

router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc
      &client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: { 'user-agent': 'node.js' }
    }
    request(options, (error, response, body) => {
      if (error) logger.error(error);
      if (response.statusCode != 200) {
        res.status(400).json({ msg: 'No github profile found' });
      }
      res.json(JSON.parse(body))
    });
  } catch (err) {
    logger.error(err.message);
    return res.status(500).send('Server error');
  }
});

module.exports = router;