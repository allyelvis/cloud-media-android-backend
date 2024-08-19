const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const AWS = require('aws-sdk');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/cloud-media-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// User schema
const UserSchema = new mongoose.Schema({
    username: String,
    password: String,
});

const User = mongoose.model('User', UserSchema);

// Sign up endpoint
app.post('/signup', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send({ message: 'User created' });
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).send({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user._id }, 'secret_key');
    res.send({ token });
});

// Media upload endpoint
app.post('/upload', upload.single('media'), (req, res) => {
    const s3 = new AWS.S3();
    const params = {
        Bucket: 'your-s3-bucket-name',
        Key: req.file.filename,
        Body: fs.createReadStream(req.file.path),
    };
    s3.upload(params, (err, data) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send({ message: 'File uploaded', data });
    });
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
