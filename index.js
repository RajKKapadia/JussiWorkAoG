const express = require('express');
const bodyParser = require('body-parser');

const ad = require('./helper-functions/airtable-database');

// Actions-on-Google
const {
    dialogflow,
    actionssdk,
    Image,
    Table,
    Carousel,
    Suggestions,
    BasicCard
  } = require('actions-on-google');

const app = dialogflow({
    debug: true
});

// Error handling
app.catch((conv, error) => {
    console.error('Error at catch --> ', error);
    conv.ask('I encountered a glitch. Can you say that again?');
});

// Fallback
app.fallback((conv) => {
    conv.ask(`I couldn't understand. Can you say that again?`);
});

// Initialize
app.intent('Default Welcome Intent', (conv) => {

    // Get all the user names

});

// Step - 1 User provides name
app.intent('Provides-Name', async (conv, params) => {
    let studentName = params.KnownStudentName;
    
    try {
        // Get student details
        let record = await ad.getUserInfo(studentName);

        conv.data.studentName = studentName;
        conv.data.studentID = record['id'];
        conv.data.Level = record['Level'];

        // Generate question list
        let qList = await ad.getAllQuestionList('ImageQuestions', record['Level']);
        let aqList = await ad.getAnsweredQuestionList('ImageQuestionsProgress', studentName);

        let uaList = await qList.filter(x => !aqList.includes(x));

        if (uaList.length == 0) {
            conv.data.uaList = qList;
        } else {
            conv.data.uaList = uaList;
        }

        // Set question number
        let qn = 0;
        conv.data.qn = qn;

        // Set right answer count
        let count = 0;
        conv.data.count = count;

        conv.contexts.set('await-quiz-type', 1);

        conv.ask(`Hello ${studentName}, What would you like to practice today?`)
        conv.ask(new Suggestions('Word', 'Clock', 'Maths'));
    } catch (error) {
        console.log('Error at Provides Name --> ', error);
    }
});

// Step - 2 Choice is WORD
app.intent('Ask-First-Question', async (conv) => {

    // Current number of question
    let cn = conv.data.qn;
    // Current question number
    let cqn = conv.data.uaList[cn];

    if (cqn === undefined) {
        let qList = await ad.getAllQuestionList('ImageQuestions', conv.data.Level);
        conv.data.uaList = qList;
        cqn = conv.data.uaList[cn];
    }

    try {
        let record = await ad.getNewQuestion(cqn);
        let Hint = record['Hint'];
        let Answer = record['Answer'];
        let Question = record['Question'];
        let ImageURL = record['ImageURL'];
        let QID = record['QuestionID'];
        conv.contexts.set('await-answer-first', 1);
        conv.data.Hint = Hint;
        conv.data.Answer = Answer;
        conv.data.Question = Question;
        conv.data.ImageURL = ImageURL;
        conv.data.QID = QID;

        conv.ask(Question);
        conv.ask(new BasicCard({
            image: new Image({
                url: ImageURL,
                alt: 'Internet Error'
            }),
            display: 'WHITE'
        }))

    } catch (error) {
        console.log('Error at Ask First Question --> ', error);
    }
});

// Step - 2 Choice is WORD
app.intent('Ask-Question', async (conv) => {
    
    // Current number of question
    let cn = conv.data.qn;
    // Current question number
    let cqn = conv.data.uaList[cn];

    if (cqn === undefined) {
        let qList = await ad.getAllQuestionList('ImageQuestions', conv.data.Level);
        conv.data.uaList = qList;
        cqn = conv.data.uaList[cn];
    }

    try {
        let record = await ad.getNewQuestion(cqn);
        let Hint = record['Hint'];
        let Answer = record['Answer'];
        let Question = record['Question'];
        let ImageURL = record['ImageURL'];
        let QID = record['QuestionID'];
        conv.contexts.set('await-answer-first', 1);
        conv.data.Hint = Hint;
        conv.data.Answer = Answer;
        conv.data.Question = Question;
        conv.data.ImageURL = ImageURL;
        conv.data.QID = QID;

        conv.ask(Question);
        conv.ask(new BasicCard({
            image: new Image({
                url: ImageURL,
                alt: 'Internet Error'
            }),
            display: 'WHITE'
        }))

    } catch (error) {
        console.log('Error at Ask Question --> ', error);
    }
});


// Step - 3 User provides the answer
app.intent('Provides-Answer-First', async (conv) => {
    let clappURL = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emojidex/59/clapping-hands-sign_emoji-modifier-fitzpatrick-type-5_1f44f-1f3fe_1f3fe.png';
    let actualAnswer = conv.data.Answer;
    let userAnswer = conv.query;

    // Create new record for ImageQuestionProgress
    fields = {
        'Name': conv.data.studentName,
        'QuestionID': conv.data.QID,
        'Answered': 1,
        'Answer1': userAnswer,
        'Answer2': 'NA'
    }

    ad.createImageQuestionProgress(fields).then((flag) => {
    }).catch((error) => {
        console.log('Error at Create IQP First Answer --> ', error);
    });

    if (actualAnswer.toLowerCase() === userAnswer.toLowerCase()) {

        let ssml = '<speak>'+
            'That is correct answer.'+
            '<audio src="https://www.soundjay.com/human/applause-01.mp3"></audio>'+
            '</speak>';
        conv.ask(ssml);
        conv.ask(new BasicCard({
            image: new Image({
                url: clappURL,
                alt: 'Internet Error'
            }),
        }));

        // Increment the count of right answer
        conv.data.count = conv.data.count+1;

        // Increment the question number
        conv.data.qn = conv.data.qn+1;

        if (conv.data.count == 3) {

            // Update student level
            let cLevel = conv.data.Level;

            let nLevel = parseInt(cLevel.split('l')[1])+1;
            conv.data.Level = `Level${nLevel}`;

            fields = {
                'Level': `Level${nLevel}`
            }

            let flag = await ad.updateStudent(conv.data.studentID, fields);

            // Get question list
            let qList = await ad.getAllQuestionList('ImageQuestions', `Level${nLevel}`);
            conv.data.uaList = qList;

            // Reset the count
            conv.data.count = 0;

            // Reset the question number
            conv.data.qn = 0;

            if (flag == 1) {
                // Ask new question here
                conv.contexts.set('await-continue-yes', 1);
                // Print level nuame here
                conv.ask('Congratulations, you have cleared the level. Would you like to continue?');
                conv.ask(new Suggestions('Yes')); 
            } else {
                conv.ask('Sorry, I encountered an error. Try agin after sometime.')
            }

        } else {
            conv.contexts.set('await-continue-yes', 1);
            conv.ask('Would you like to continue?');
            conv.ask(new Suggestions('Yes'));
        }

    } else {

        conv.contexts.set('await-answer-second', 1);

        let ssml = '<speak>'+
            '<audio src="https://www.soundjay.com/misc/fail-buzzer-01.mp3"></audio>'+
            '<break time="200ms"/>'+
            conv.data.Hint+
            '</speak>';
        conv.ask(ssml);
        conv.ask(new BasicCard({
            image: new Image({
                url: conv.data.ImageURL,
                alt: 'Internet Error'
            }),
            display: 'WHITE'
        }))
    }
});

// User provides answer second time
app.intent('Provides-Answer-Second', async (conv) => {
    let clappURL = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emojidex/59/clapping-hands-sign_emoji-modifier-fitzpatrick-type-5_1f44f-1f3fe_1f3fe.png';
    let actualAnswer = conv.data.Answer;
    let userAnswer = conv.query;

    // Update ImageQuestionProgress
    fields = {
        'Answer2': userAnswer
    }

    let id = await ad.getImageQuestionProgressID(conv.data.QID, conv.data.studentName);


    ad.updateImageQuestionProgress(id, fields).then((flag) => {
    }).catch((error) => {
        console.log('Error at UIPQ --> ', error);
    })

    if (actualAnswer.toLowerCase() === userAnswer.toLowerCase()) {

        let ssml = '<speak>'+
            'That is correct answer.'+
            '<audio src="https://www.soundjay.com/human/applause-01.mp3"></audio>'+
            '</speak>';
        conv.ask(ssml);
        conv.ask(new BasicCard({
            image: new Image({
                url: clappURL,
                alt: 'Internet Error'
            })
        }));

        // Increment the count of right answer
        conv.data.count = conv.data.count+1;

        // Increment the question number
        conv.data.qn = conv.data.qn+1;

        if (conv.data.count == 3) {
            // Update student level
            let cLevel = conv.data.Level;

            let nLevel = parseInt(cLevel.split('l')[1])+1;
            conv.data.Level = `Level${nLevel}`;

            fields = {
                'Level': `Level${nLevel}`
            }

            let flag = await ad.updateStudent(conv.data.studentID, fields);

            // Get question list
            let qList = await ad.getAllQuestionList('ImageQuestions', `Level${nLevel}`);
            conv.data.uaList = qList;

            // Reset the count
            conv.data.count = 0;

            // Reset the question number
            conv.data.qn = 0;

            if (flag == 1) {
                // Ask new question here
                conv.contexts.set('await-continue-yes', 1);
                // Print level nuame here
                conv.ask('Congratulations, you have cleared the level. Would you like to continue?');
                conv.ask(new Suggestions('Yes')); 
            } else {
                conv.ask('Sorry, I encountered an error. Try agin after sometime.')
            }

        } else {
            conv.contexts.set('await-continue-yes', 1);
            conv.ask('Would you like to continue?');
            conv.ask(new Suggestions('Yes'));
        }

    } else {

        // Reset the count
        conv.data.count = 0;

        // Increase the question number
        conv.data.qn = conv.data.qn+1; 
        
        // Ask new question here
        conv.contexts.set('await-continue-yes', 1);
        conv.ask(`Not quite. The answer is ` + actualAnswer + `. Do you want another word?`);
        conv.ask(new Suggestions('Yes', 'No')); 
        
    }
});

app.intent('Continue-Yes', (conv) => {
    // Call an event to continue asking a new question
    conv.followup('question', {
        type: 'Word'
    });
});

app.intent('Continue-No', (conv) => {
    conv.ask(`Thank you ${conv.data.studentName} for using the app.`);
});

app.intent('Cancel', (conv) => {
    conv.ask(`Thank you ${conv.data.studentName} for using the app.`);
});

// Webserver
const Webapp = express();

Webapp.use(bodyParser.urlencoded({ extended: true }));
Webapp.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

Webapp.get('/', (req, res) => {
    res.send('Hello World.!')
});

Webapp.post('/webhook', app);

Webapp.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});