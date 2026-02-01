const express = require('express');
const router = express.Router();
const briefService = require('../services/briefService');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

/**
 * @route   GET /api/brief
 * @desc    Get the Daily Command Center Brief
 * @access  Private
 */
router.get('/', auth, async (req, res) => {
    try {
        const brief = await briefService.generateDailyBrief(req.user.userId);
        res.json(brief);
    } catch (error) {
        console.error('Brief API Error:', error);
        res.status(500).json({ message: 'Server error generating brief' });
    }
});

module.exports = router;
