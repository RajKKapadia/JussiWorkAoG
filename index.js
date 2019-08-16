'use strict';

const {dialogflow, actionssdk,
    Image, Table, Carousel, Suggestions,
    BasicCard} = require('actions-on-google');

const express = require('express')
const bodyParser = require('body-parser')
const axios = require('axios');

const app = dialogflow({debug:true});

const Airtable = require('airtable');

const API_KEY = process.env.API_KEY;
const APP_ID = process.env.APP_ID;

Airtable.configure({
    endpointUrl: 'https://api.airtable.com',
    apiKey: API_KEY
});

const base = Airtable.base(APP_ID);

var nq = 1;

// User provides Name
app.intent('provides.name', (conv, params) => {
    //fetch the first unanswered question from Airtable
    const studentName = params.KnownStudentName;
    return base('Student').select({
        view: 'Grid view',
        filterByFormula: 'AND(Name="'+studentName+'")'
    }).firstPage((err, records) => {
        if (err) {
            console.log(err);
            conv.ask(err);
        }
        let studentID = records[0].get('ID');
        conv.data.studentID = studentID;
        conv.data.someProperty = 'SomeValue';
        conv.contexts.set('await_quiz_type',1);
        conv.ask(`What would you like to do today?`);
        conv.ask(new Suggestions('Word','Clock','Shop','Math','Cancel'))
    });
});

// User makes a chioce
app.intent('choice.WORD', (conv, params) => {

    console.log(params.KnownStudentName)

    const qetQuestionUrl = 'https://api.airtable.com/v0/'+APP_ID+'/ImageQuestions?view=Grid%20view&filterByFormula=(AND({QuestionID}="'+nq+'"))&maxRecords=1';
    return axios.get(qetQuestionUrl,
        {
            headers: { Authorization: "Bearer "+API_KEY }
        }
    ).then(function(response){
        conv.contexts.set('await_word_answer',1);
        conv.data.expectedAnswer = response.data.records[0].fields.Answer;
        conv.data.answerHint = response.data.records[0].fields.Hint;
        conv.data.questionImageUrl = response.data.records[0].fields.Image[0].thumbnails.small.url;
        conv.ask(response.data.records[0].fields.Question);
        conv.ask(new BasicCard({
            image: new Image({
                url: conv.data.questionImageUrl,
                alt: 'What is this?',
            }),
            display: 'CROPPED',
        }));
    }).catch(function(error){
        console.log(error);
        conv.ask(err);
    });
});

// User provides answer
app.intent('provides.WORDANSWER', (conv) => {
    //fetch the first unanswered question from Airtable
    const expectedAnswer = conv.data.expectedAnswer;
    const actualAnswer = conv.query;
    const answerHint = conv.data.answerHint;
    if(actualAnswer.toLowerCase() === expectedAnswer.toLowerCase()){
        const ssml = `<speak>` +
            `That's correct. ` +
            `<audio src="https://www.soundjay.com/human/applause-01.mp3"></audio>`+
            '</speak>';
        conv.ask(ssml);
        conv.ask(new BasicCard({
            image: new Image({
                url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emojidex/59/clapping-hands-sign_emoji-modifier-fitzpatrick-type-5_1f44f-1f3fe_1f3fe.png',
                alt: 'Clapping hands',
            }),
            display: 'CROPPED',
        }));
        //ask next question
        conv.ask('Next question');
        conv.ask(new Suggestions('Yes', 'No'));
        conv.contexts.set('await_continue',  1);
    }
    else{
        //provide the hint
        conv.contexts.set('await_word_answer_2',1);
        const ssml = `<speak>` +
            `<audio src="https://www.soundjay.com/misc/fail-buzzer-01.mp3"></audio>`+
            answerHint+
            '</speak>';
        conv.ask(ssml);
        conv.ask(new BasicCard({
            image: new Image({
                url: conv.data.questionImageUrl,
                alt: 'What is this?',
            }),
            display: 'CROPPED',
        }));
    }
});

// User provides answer again
app.intent('provides.WORDANSWER2', (conv) => {
    //fetch the first unanswered question from Airtable
    const expectedAnswer = conv.data.expectedAnswer;
    const actualAnswer = conv.query;
    if(actualAnswer.toLowerCase() === expectedAnswer.toLowerCase()){
        const ssml = `<speak>` +
            `That's correct. ` +
            `<audio src="https://www.soundjay.com/human/applause-01.mp3"></audio>`+
            '</speak>';
        conv.ask(ssml);
        conv.ask(new BasicCard({
            image: new Image({
                url: 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emojidex/59/clapping-hands-sign_emoji-modifier-fitzpatrick-type-5_1f44f-1f3fe_1f3fe.png',
                alt: 'Clapping hands',
            }),
            display: 'CROPPED',
        }));
        //ask next question
        conv.ask('Next question');
        conv.ask(new Suggestions('Yes', 'No'));
        conv.contexts.set('await_continue',  1);
    }
    else{
        //provide the hint
        conv.contexts.set('await_continue',1);
        conv.ask(`Not quite. The answer is `+conv.data.expectedAnswer+`. Do you want another question?`);
        conv.ask(new Suggestions('Yes','No'));
    }
});

// Continue
app.intent('choice.CONTINUE.YES', (conv) => {
    //user wants to continue to the next question
    nq += 1;
    if (nq > 3) {
        conv.ask('Congratulations, you are on next level.')
    }
    conv.contexts.set('await_quiz_type',1);
    conv.ask('Please select');
    conv.ask(new Suggestions('Word', 'Clock', 'Shop', 'Math'));
});


// No intent matched
app.fallback((conv) => {
    conv.ask(`I couldn't understand. Can you say that again?`);
});

// Error
app.catch((conv, error) => {
    console.error(error);
    conv.ask('I encountered a glitch. Can you say that again?');
});

// Server
const expressApp = express().use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({extended:true}));

expressApp.get('/', (req, res) => {
    res.send('Hello World.');
});

expressApp.post('/webhook', app);

expressApp.listen(process.env.PORT || 5000, () => console.log('Webhook is listening'));
