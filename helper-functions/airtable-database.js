const axios = require('axios');
require('dotenv').config();

const APP_ID = process.env.APP_ID;
const API_KEY = process.env.API_KEY;

// Get the Last Question Asked and the Level
const getLQALevel = async (studentName) => {

    url = 'https://api.airtable.com/v0/'+APP_ID+'/Student?view=Grid%20view&filterByFormula=(AND({Name}="'+studentName+'"))&maxRecords=1';
    headers = {
        Authorization: 'Bearer '+API_KEY
    }
    
    const response = await axios.get(url, {headers});
    let id = response.data.records[0]['id'];
    let ID = response.data.records[0]['fields']['ID'];
    let Name = response.data.records[0]['fields']['Name'];
    let Level = response.data.records[0]['fields']['Level'];
    let ImageLQA = response.data.records[0]['fields']['ImageLQA'];
    
    return {
        'id': id,
        'ID': ID,
        'Name': Name,
        'Level': Level,
        'ImageLQA': ImageLQA
    }
};

// Get the new question on LQA
const getNewQuestion = async (lqa) => {

    url = 'https://api.airtable.com/v0/'+APP_ID+'/ImageQuestions?view=Grid%20view&filterByFormula=(AND({QuestionID}="'+lqa+'"))&maxRecords=1';
    headers = {
        Authorization: 'Bearer '+API_KEY
    }

    const response = await axios.get(url, {headers});

    if (response.data.records.length == 0) {
        return 0;
    } else {
        let QuestionID = response.data.records[0]['fields']['QuestionID'];
        let Hint = response.data.records[0]['fields']['Hint'];
        let Answer = response.data.records[0]['fields']['Answer'];
        let Question = response.data.records[0]['fields']['Question'];
        let Difficulty = response.data.records[0]['fields']['Difficulty'];
        let ImageURL = response.data.records[0]['fields']['Image'][0]['thumbnails']['small']['url'];

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

    const response = await axios.patch(url, {fields}, {headers});

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
    
    const response = await axios.post(url, {fields}, {headers});

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

    const response = await axios.get(url, {headers});

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

    const response = await axios.patch(url, {fields}, {headers});

    if (response.status == 200) {
        return 1;
    } else {
        return 0;
    }
};

module.exports = {
    getLQALevel,
    getNewQuestion,
    updateStudent,
    createImageQuestionProgress,
    getImageQuestionProgressID,
    updateImageQuestionProgress
}