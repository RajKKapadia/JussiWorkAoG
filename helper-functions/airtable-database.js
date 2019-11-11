const axios = require('axios');
require('dotenv').config();

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;

// Get the Last Question Asked and the Level
const getUserInfo = async (studentName) => {

    studentName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

    url = `https://api.airtable.com/v0/${APP_ID}/Student?view=Grid%20view&filterByFormula=(AND({Name}="${studentName}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + API_KEY
    }

    let response = await axios.get(url, { headers });

    if (response.data.records.length != 0) {

        let record = response.data.records[0];

        let fields = record['fields'];

        let id = record['id'];
        let ID = fields['ID'];
        let Name = fields['Name'];
        let memoLevel = fields['Memo'];
        let conseptsLevel = fields['Consepts'];
        let mathLevel = fields['Math'];
        let clockLevel = fields['Clock'];

        return {
            'status': 1,
            'id': id,
            'ID': ID,
            'Name': Name,
            'memoLevel': memoLevel,
            'conseptsLevel': conseptsLevel,
            'mathLevel': mathLevel,
            'clockLevel': clockLevel
        }

    } else {

        return {
            'status': 0
        }

    }
};

// Get list of all question id's from the table
const getAllQuestionList = async (table, level) => {

    url = `https://api.airtable.com/v0/${APP_ID}/${table}?&view=Grid%20view&filterByFormula=(AND({Difficulty}="${level}"))`;
    headers = {
        Authorization: 'Bearer ' + API_KEY
    }

    let response = await axios.get(url, { headers });

    let records = response['data']['records'];
    let qList = [];

    records.forEach(record => {
        qList.push(record['fields']['QuestionID']);
    });
    return qList;
};

// Get list of all answered questions
const getAnsweredQuestionList = async (table, studentName) => {

    url = `https://api.airtable.com/v0/${APP_ID}/${table}?&view=Grid%20view&filterByFormula=(AND({Name}="${studentName}"))`;
    headers = {
        Authorization: 'Bearer ' + API_KEY
    }

    let response = await axios.get(url, { headers });

    let records = response['data']['records'];
    let aqList = []

    if (records.length == 0) {
        return aqList;
    } else {

        records.forEach(record => {
            aqList.push(record['fields']['QuestionID'])
        });
        return aqList;
    }
};

// Get the new question on Question Number
const getNewQuestion = async (table, qn) => {

    url = `https://api.airtable.com/v0/${APP_ID}/${table}?view=Grid%20view&filterByFormula=(AND({QuestionID}="${qn}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + API_KEY
    }

    let response = await axios.get(url, { headers });

    if (response['data']['records'].length == 0) {
        return 0;
    } else {

        let record = response.data.records[0];
        let fields = record['fields'];

        let QuestionID = fields['QuestionID'];
        let Hint = fields['Hint'];
        let HintImage = fields['HintImage'];
        let Answer = fields['Answer'];
        let Question = fields['Question'];
        let Difficulty = fields['Difficulty'];
        let ImageURL = fields['Image'][0]['thumbnails']['large']['url'];

        let result = {
            'QuestionID': QuestionID,
            'Answer': Answer,
            'Question': Question,
            'Difficulty': Difficulty,
            'ImageURL': ImageURL
        };

        if (Hint == undefined && HintImage == undefined) {

            result['HA'] = 0;
            result['HIA'] = 0;

        } else if (Hint != undefined && HintImage == undefined) {

            result['HA'] = 1;
            result['Hint'] = Hint;
            result['HIA'] = 0;

        } else if (Hint == undefined && HintImage != undefined) {

            result['HA'] = 0;
            result['HIA'] = 1;
            result['HintImageURL'] = HintImage[0]['thumbnails']['large']['url'];

        } else {

            result['HA'] = 1;
            result['Hint'] = Hint;
            result['HIA'] = 1;
            result['HintImageURL'] = HintImage[0]['thumbnails']['large']['url'];
        }

        return result;
    }
};

// Update the student data
const updateStudent = async (studentID, fields) => {

    url = `https://api.airtable.com/v0/${APP_ID}/Student/${studentID}`;
    headers = {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
    }

    let response = await axios.patch(url, { fields }, { headers });

    if (response.status == 200) {
        return 1;
    } else {
        return 0;
    }
};

// Create ImageQuestionProgress
const createProgress = async (table, fields) => {

    url = `https://api.airtable.com/v0/${APP_ID}/${table}Progress`;
    headers = {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
    }

    let response = await axios.post(url, { fields }, { headers });

    if (response.status == 200) {
        return 1;
    } else {
        return 0;
    }
};

// Get Question Progress data
const getProgressByID = async (table, QID, Name) => {

    url = `https://api.airtable.com/v0/${APP_ID}/${table}Progress?view=Grid%20view&filterByFormula=(AND({QuestionID}="${QID}", {Name}="${Name}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + API_KEY
    }

    let response = await axios.get(url, { headers });

    if (response['data']['records'].length == 0) {
        return 0;
    } else {
        let id = response['data']['records'][0]['id'];
        return id;
    }
};

// Update Image Question Progress
const updateProgress = async (table, id, fields) => {

    url = `https://api.airtable.com/v0/${APP_ID}/${table}Progress/${id}`;
    headers = {
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Type': 'application/json'
    }

    let response = await axios.patch(url, { fields }, { headers });

    if (response.status == 200) {
        return 1;
    } else {
        return 0;
    }
};

// Get the message for Congratulations and NExt Level
const getCongratsMessage = async (type) => {

    url = `https://api.airtable.com/v0/${APP_ID}/CongratulationMessages?view=Grid%20view&filterByFormula=(AND({Name}="${type}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + API_KEY
    }

    let response = await axios.get(url, { headers });
    let records = response['data']['records'];
    let pickNumb = Math.floor(Math.random() * Math.floor(records.length));

    let message = records[pickNumb];

    if (message['fields']['Image'] == undefined) {
        return {
            'Image': 0,
            'Message': message['fields']['Message']
        };
    } else {
        return {
            'Image': 1,
            'Message': message['fields']['Message'],
            'ImageURL': message['fields']['Image'][0]['thumbnails']['large']['url']
        };
    }
};

// Get the item from E-Shpp
const getItemFromEShop = async (itemName) => {

    url = `https://api.airtable.com/v0/${APP_ID}/Items?view=Grid%20view&filterByFormula=(AND({Name}="${itemName}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + API_KEY
    }

    let response = await axios.get(url, { headers });

    let record = response['data']['records'][0];

    if (record === undefined) {
        return {
            'status': 0,
        }
    } else {

        return {
            'status': 1,
            'Name': record['fields']['Name'],
            'Price': record['fields']['Price'],
            'ImageURL': record['fields']['Image'][0]['thumbnails']['large']['url'],
        }

    }
};

// Get all usernames
const getUserNames = async () => {

    url = `https://api.airtable.com/v0/${APP_ID}/Student`;
    headers = {
        Authorization: 'Bearer ' + API_KEY
    }

    let response = await axios.get(url, { headers });

    let records = response['data']['records'];

    let Names = [];

    records.forEach(record => {
        Names.push(record['fields']['Name']);
    });

    return Names;
};

module.exports = {
    getUserInfo,
    getAllQuestionList,
    getAnsweredQuestionList,
    getNewQuestion,
    updateStudent,
    createProgress,
    getProgressByID,
    updateProgress,
    getCongratsMessage,
    getItemFromEShop,
    getUserNames
}