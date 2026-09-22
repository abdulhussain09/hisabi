const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    register,
    login,
    demoLogin,
    createStaff,
    getStaff,
    deleteStaff,
    getProfile,
    updateProfile,
    registerSchema,
    loginSchema,
    createStaffSchema,
    updateProfileSchema
} = require('../controllers/authController');

const { authLimiter } = require('../middleware/rateLimiter');

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/demo-login', authLimiter, demoLogin);
router.post('/staff', authenticate, authorize(['admin']), validate(createStaffSchema), createStaff);
router.get('/staff', authenticate, authorize(['admin']), getStaff);
router.delete('/staff/:id', authenticate, authorize(['admin']), deleteStaff);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, upload.single('brand_logo'), validate(updateProfileSchema), updateProfile);

module.exports = router;
