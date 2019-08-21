const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;

// Get the Last Question Asked and the Level
const getLQALevel = async (studentName) => {

    url = 'https://api.airtable.com/v0/'+APP_ID+'/tblOwl9fQunAzEa4t?view=Grid%20view&filterByFormula=(AND({Name}="'+studentName+'"))&maxRecords=1';
    headers = {
        Authorization: 'Bearer '+API_KEY
    }
    
    const response = await axios.get(url, {headers});

    let id = response.data.records[0]['id'];
    let ID = response.data.records[0]['fields']['ID'];
    let Level = response.data.records[0]['fields']['Level'];
    let ImageLQA = response.data.records[0]['fields']['ImageLQA'];

    return {
        'id': id,
        'ID': ID,
        'Level': Level,
        'ImageLQA': ImageLQA
    };
};

module.exports = {
    getLQALevel
}