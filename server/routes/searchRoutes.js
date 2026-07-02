const express = require('express');
const router = express.Router();
const { search, getTrendingHashtags } = require('../controllers/searchController');

router.get('/', search);
router.get('/trending', getTrendingHashtags);

module.exports = router;
