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
    console.error(error);
    conv.ask('I encountered a glitch. Can you say that again?');
});

// Fallback
app.fallback((conv) => {
    conv.ask(`I couldn't understand. Can you say that again?`);
});

// Step - 1 User provides name
app.intent('provides.name', async (conv, params) => {
    let studentName = params.KnownStudentName;
    
    try {
        let record = await ad.getLQALevel(studentName);
        conv.data.studentName = studentName;
        conv.data.studentID = record['id'];
        conv.data.LQA = record['ImageLQA'];
        conv.data.Level = record['Level'];

        conv.contexts.set('await_quiz_type',1);

        // Set right answer count
        let count = 0;
        conv.data.count = count;

        conv.ask(`Hello ${studentName}, What would you like to have today?`)
        conv.ask(new Suggestions('Word', 'Clock', 'Maths'));
    } catch (error) {
        console.log(error);
    }
});

// Step - 2 Choice is WORD
app.intent('choice.WORD', async (conv) => {
    let lqa = conv.data.LQA;
    try {
        let record = await ad.getNewQuestion(lqa+1);
        let Hint = record['Hint'];
        let Answer = record['Answer'];
        let Question = record['Question'];
        let ImageURL = record['ImageURL'];
        let QID = record['QuestionID'];
        conv.contexts.set('await_word_answer',1);
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
            })
        }))

    } catch (error) {
        console.log(error);
    }
});

// Step - 3 User provides the answer
app.intent('provides.WORDANSWER', async (conv) => {
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

    console.log('Inserted question id --> ', conv.data.QID);

    ad.createImageQuestionProgress(fields).then((flag) => {
        console.log('Created IQP --> ', flag);
    }).catch((error) => {
        console.log('Error at Create IQP --> ', error);
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
            })
        }));

        // Increment the count of right answer
        conv.data.count = conv.data.count+1;

        // Update the Student --> ImageLQA with conv.data.LQA
        conv.data.LQA = conv.data.LQA+1;
        fields = {
            'ImageLQA': conv.data.LQA
        }

        let flag = await ad.updateStudent(conv.data.studentID, fields)

        if (flag == 1) {
            // Ask new question here
            conv.contexts.set('await_continue', 1);
            conv.ask('Do you want new question?');
            conv.ask(new Suggestions('Yes', 'No'));    
        }

    } else {
        // Reset the count
        conv.data.count = 0;
        conv.contexts.set('await_word_answer_2',1);

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
            })
        }))
    }
});

// User provides answer second time
app.intent('provides.WORDANSWER2', async (conv) => {
    let clappURL = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emojidex/59/clapping-hands-sign_emoji-modifier-fitzpatrick-type-5_1f44f-1f3fe_1f3fe.png';
    let actualAnswer = conv.data.Answer;
    let userAnswer = conv.query;

    // Update ImageQuestionProgress
    fields = {
        'Answer2': userAnswer
    }

    let id = await ad.getImageQuestionProgressID(conv.data.QID, conv.data.studentName);

    console.log('Updated question id --> ', conv.data.QID);

    ad.updateImageQuestionProgress(id, fields).then((flag) => {
        console.log('Updated IQP --> ', flag);
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
        // Increase the count for Level
        conv.data.count = conv.data.count+1;

        // Update the Student --> ImageLQA with conv.data.LQA
        conv.data.LQA = conv.data.LQA+1;
        fields = {
            'ImageLQA': conv.data.LQA
        }

        let flag = await ad.updateStudent(conv.data.studentID, fields)

        if (flag == 1) {
            // Ask new question here
            conv.contexts.set('await_continue', 1);
            conv.ask('Do you want new question?');
            conv.ask(new Suggestions('Yes', 'No'));    
        }

    } else {

        // Reset the count
        conv.data.count = 0;

        conv.data.LQA = conv.data.LQA+1;

        fields = {
            'ImageLQA': conv.data.LQA
        }

        let flag = await ad.updateStudent(conv.data.studentID, fields)

        if (flag == 1) {
            // Ask new question here
            conv.contexts.set('await_continue', 1);
            conv.ask(`Not quite. The answer is ` + actualAnswer + `. Do you want another word?`);
            conv.ask(new Suggestions('Yes', 'No'));   
        }
    }
});

// User wants to continue to next question
app.intent('choice.CONTINUE.YES', async (conv) => {

    console.log('The count is --> ', conv.data.count);
    console.log('The LQA is --> ', conv.data.LQA);
    
    conv.contexts.set('await_quiz_type',1);

    if (conv.data.count % 3 == 0) {
        conv.ask('Congratulation, you cleared the level.');
    }
    conv.ask('What would you like to have?');
    conv.ask(new Suggestions('Word', 'Clock', 'Maths'));
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