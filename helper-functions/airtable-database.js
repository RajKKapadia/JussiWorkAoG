const axios = require('axios');
require('dotenv').config();

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;

// Get the Last Question Asked and the Level
const getUserInfo = async (studentName) => {

    url = 'https://api.airtable.com/v0/'+APP_ID+'/Student?view=Grid%20view&filterByFormula=(AND({Name}="'+studentName+'"))&maxRecords=1';
    headers = {
        Authorization: 'Bearer '+API_KEY
    }
    
    let response = await axios.get(url, {headers});
    let id = response.data.records[0]['id'];
    let ID = response.data.records[0]['fields']['ID'];
    let Name = response.data.records[0]['fields']['Name'];
    let Level = response.data.records[0]['fields']['Level'];
    
    return {
        'id': id,
        'ID': ID,
        'Name': Name,
        'Level': Level
    }
};

// Get list of all question id's from the table
const getAllQuestionList = async (table, level) => {
    url = `https://api.airtable.com/v0/${APP_ID}/${table}?&view=Grid%20view&filterByFormula=(AND({Difficulty}="${level}"))`;
    headers = {
        Authorization: 'Bearer '+API_KEY
    }

    let response = await axios.get(url, {headers});

    let records =  response.data.records;
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
        Authorization: 'Bearer '+API_KEY
    }

    let response = await axios.get(url, {headers});

    let records =  response.data.records;
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

// Get the new question on LQA
const getNewQuestion = async (lqa) => {

    url = 'https://api.airtable.com/v0/'+APP_ID+'/ImageQuestions?view=Grid%20view&filterByFormula=(AND({QuestionID}="'+lqa+'"))&maxRecords=1';
    headers = {
        Authorization: 'Bearer '+API_KEY
    }

    let response = await axios.get(url, {headers});

    if (response.data.records.length == 0) {
        return 0;
    } else {
        let QuestionID = response.data.records[0]['fields']['QuestionID'];
        let Hint = response.data.records[0]['fields']['Hint'];
        let Answer = response.data.records[0]['fields']['Answer'];
        let Question = response.data.records[0]['fields']['Question'];
        let Difficulty = response.data.records[0]['fields']['Difficulty'];
        let ImageURL = response.data.records[0]['fields']['Image'][0]['thumbnails']['large']['url'];

        return {
            'QuestionID': QuestionID,
            'Hint': Hint,
            'Answer': Answer,
            'Question': Question,
            'Difficulty': Difficulty,
            'ImageURL': ImageURL
        }
    }
};

// Update the student data
const updateStudent = async (studentID, fields) => {
    url = `https://api.airtable.com/v0/${APP_ID}/Student/${studentID}`;
    headers = {
        'Authorization': 'Bearer '+API_KEY,
        'Content-Type': 'application/json'
    }

    let response = await axios.patch(url, {fields}, {headers});

    if (response.status == 200) {
        return 1;
    } else {
        return 0;
    }
};

// Create ImageQuestionProgress
const createImageQuestionProgress = async (fields) => {
    url = `https://api.airtable.com/v0/${APP_ID}/ImageQuestionsProgress`;
    headers = {
        'Authorization': 'Bearer '+API_KEY,
        'Content-Type': 'application/json'
    }
    
    let response = await axios.post(url, {fields}, {headers});

    if (response.status == 200) {
        return 1;
    } else {
        return 0;
    }
};

// Get Image Question Progress data
const getImageQuestionProgressID = async (QID, Name) => {
    url = 'https://api.airtable.com/v0/'+APP_ID+'/ImageQuestionsProgress?view=Grid%20view&filterByFormula=(AND({QuestionID}="'+QID+'", {Name}="'+Name+'"))&maxRecords=1';
    headers = {
        Authorization: 'Bearer '+API_KEY
    }

    let response = await axios.get(url, {headers});

    let id = response.data.records[0].id;

    return id;
};

// Update Image Question Progress
const updateImageQuestionProgress = async (id, fields) => {
    url = `https://api.airtable.com/v0/${APP_ID}/ImageQuestionsProgress/${id}`;
    headers = {
        'Authorization': 'Bearer '+API_KEY,
        'Content-Type': 'application/json'
    }

    let response = await axios.patch(url, {fields}, {headers});

    if (response.status == 200) {
        return 1;
    } else {
        return 0;
    }
};

module.exports = {
    getUserInfo,
    getAllQuestionList,
    getAnsweredQuestionList,
    getNewQuestion,
    updateStudent,
    createImageQuestionProgress,
    getImageQuestionProgressID,
    updateImageQuestionProgress
}