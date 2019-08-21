const express = require('express');
const bodyParser = require('body-parser');

const ad = require('./helper-functions/airtable-database');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    ad.getLQALevel('Alice').then((record) => {
        console.log(record);
        res.send(record);
    }).catch((e) => {
        console.log(e);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});