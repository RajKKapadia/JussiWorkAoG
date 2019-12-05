const axios = require('axios');
require('dotenv').config();

// Airtable Credentials
// Question Answer
const QA_API_KEY = process.env.QA_API_KEY;
const QA_APP_ID = process.env.QA_APP_ID;
// Student Detail
const SD_API_KEY = process.env.SD_API_KEY;
const SD_APP_ID = process.env.SD_APP_ID;
// Student Progress
const SP_API_KEY = process.env.SP_API_KEY;
const SP_APP_ID = process.env.SP_APP_ID;

// Get the Last Question Asked and the Level
// Student Details
const getUserInfo = async (studentName) => {

    studentName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

    url = `https://api.airtable.com/v0/${SD_APP_ID}/Students?view=Grid%20view&filterByFormula=(AND({Name}="${studentName}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + SD_API_KEY
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
// Question Answer
const getAllQuestionList = async (table, level) => {

    table = table.charAt(0).toUpperCase() + table.slice(1);

    url = `https://api.airtable.com/v0/${QA_APP_ID}/${table}?&view=Grid%20view&filterByFormula=(AND({Difficulty}="${level}"))`;
    headers = {
        Authorization: 'Bearer ' + QA_API_KEY
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
// Student Progress
const getAnsweredQuestionList = async (studentName) => {

    studentName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

    url = `https://api.airtable.com/v0/${SP_APP_ID}/${studentName}?&view=Grid%20view`;
    headers = {
        Authorization: 'Bearer ' + SP_API_KEY
    }

    let response = await axios.get(url, { headers });

    let records = response['data']['records'];
    let aqList = []

    if (records.length != 0) {
        records.forEach(record => {
            aqList.push(record['fields']['QuestionID'])
        });
    }

    return aqList;
};

// Get the new question on Question Number
// Question Answer
const getNewQuestion = async (table, qn) => {

    table = table.charAt(0).toUpperCase() + table.slice(1);

    url = `https://api.airtable.com/v0/${QA_APP_ID}/${table}?view=Grid%20view&filterByFormula=(AND({QuestionID}="${qn}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + QA_API_KEY
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
        let HintText = fields['HintText'];
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

        result['Hint'] = 0;
        result['HintImage'] = 0;
        result['HintText'] = 0;

        if (Hint !== undefined) {
            result['Hint'] = Hint;
        }
        if (HintText !== undefined) { 
            result['HintText'] = HintText;
        }
        if (HintImage !== undefined) {
            result['HintImage'] = HintImage[0]['thumbnails']['large']['url'];
        }
        
        return result;
    }
};

// Update the student data
// Student Detail
const updateStudent = async (studentID, fields) => {

    url = `https://api.airtable.com/v0/${SD_APP_ID}/Students/${studentID}`;
    headers = {
        'Authorization': 'Bearer ' + SD_API_KEY,
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
// Student Progress
const createProgress = async (studentName, fields) => {

    studentName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

    url = `https://api.airtable.com/v0/${SP_APP_ID}/${studentName}`;
    headers = {
        'Authorization': 'Bearer ' + SP_API_KEY,
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
// Student Progress
const getProgressByID = async (studentName, QID) => {

    studentName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

    url = `https://api.airtable.com/v0/${SP_APP_ID}/${studentName}?view=Grid%20view&filterByFormula=(AND({QuestionID}="${QID}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + SP_API_KEY
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
// Student Progress
const updateProgress = async (studentName, id, fields) => {

    studentName = studentName.charAt(0).toUpperCase() + studentName.slice(1);

    url = `https://api.airtable.com/v0/${SP_APP_ID}/${studentName}/${id}`;
    headers = {
        'Authorization': 'Bearer ' + SP_API_KEY,
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
// Question Answer
const getCongratsMessage = async (type) => {

    url = `https://api.airtable.com/v0/${QA_APP_ID}/CongratulationMessages?view=Grid%20view&filterByFormula=(AND({Name}="${type}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + QA_API_KEY
    }

    let response = await axios.get(url, { headers });
    let records = response['data']['records'];
    // Choose a random message
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
// Question Answer
const getItemFromEShop = async (itemName) => {

    url = `https://api.airtable.com/v0/${QA_APP_ID}/Items?view=Grid%20view&filterByFormula=(AND({Name}="${itemName}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + QA_API_KEY
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
// Student Detail
const getUserNames = async () => {

    url = `https://api.airtable.com/v0/${SD_APP_ID}/Students`;
    headers = {
        Authorization: 'Bearer ' + SD_API_KEY
    }

    let response = await axios.get(url, { headers });

    let records = response['data']['records'];

    let Names = [];

    records.forEach(record => {
        Names.push(record['fields']['Name']);
    });

    return Names;
};

// Get the student current levels
const getStudentLevels = async (studentName) => {

    url = `https://api.airtable.com/v0/${SD_APP_ID}/Students?view=Grid%20view&filterByFormula=(AND({Name}="${studentName}"))&maxRecords=1`;
    headers = {
        Authorization: 'Bearer ' + SD_API_KEY
    }

    let response = await axios.get(url, { headers });

    let records = response['data']['records'];

    if (records.length != 0) {

        let fields = records[0]['fields']
        return {
            'status': 1,
            'memoLevel': fields['Memo'],
            'conseptsLevel': fields['Consepts'],
            'clockLevel': fields['Clock'],
            'mathLevel': fields['Math']
        };
        
    } else {
        return {
            'status': 0
        };
    }
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
    getUserNames,
    getStudentLevels
}