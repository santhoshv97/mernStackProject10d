const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const config = require('config');
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");

const User = require("../../models/User");

//@route POST api/users
//register user
router.post(
    "/",
    [
        check("name", "Name is required").not().isEmpty(),
        check("email", "Please include a valid email").isEmail(),
        check(
            "password",
            "Please enter a password with 6 or more characters"
        ).isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "User already exists" }] });
            }

            const avatar = gravatar.url(email, {
                s: "200",
                r: "pg",
                d: "mm",
            }),
                user1 = new User({
                    name,
                    email,
                    avatar,
                    password,
                });

            const salt = await bcrypt.genSalt(10);

            user1.password = await bcrypt.hash(password, salt);

            await user1.save();

            const payload = {
                user: {
                    id: user1.id
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: '5 days' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send("Server error");
        }
    }
);

module.exports = router;
