const express = require('express');
const router = express.Router();

require('dotenv').config();
const cloud_name = process.env.CLOUD_NAME;
const api_key = process.env.API_KEY;
const api_secret = process.env.API_SECRET;

const multer = require('multer');
const upload = multer();

// Configure Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: cloud_name,
    api_key: api_key,
    api_secret: api_secret
});


// test APIs
router.get('/', async function (req, res) {
    try {
        res.status(200).send({ status: true, message: 'Api working' });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    };
});


// upload image 
router.post('/upload/image', upload.single('image'), async function (req, res) {
    try {

        if (!req.file) {
            return res.status(400).send({ status: false, message: 'Missing image in the request body' });
        };

        const result = await cloudinary.uploader.upload_stream({ resource_type: 'image' },
            (error, result) => {
                if (error) {
                    res.status(500).send({ status: false, message: error.message });
                } else {
                    res.status(201).send({ status: true, data: result, message: 'Image uploaded successfully' });
                }
            }
        ).end(req.file.buffer);

    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    };
});

module.exports = router;