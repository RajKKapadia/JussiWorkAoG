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
    console.error('Error at conv catch --> ', error);
    conv.ask('I encountered a glitch. Please try again after some time.');
});

// Fallback
app.fallback((conv) => {
    conv.ask(`I couldn't understand. Please try again after some time.`);
});

// Initialize
app.intent('Default Welcome Intent', async (conv) => {

    // Get all the user names
    let names = await ad.getUserNames();

    // Set Default Fallback Count
    conv.data.fallbackCount = 0;

    // Set the context
    conv.contexts.set('await-student-name', 1);

    conv.ask('Hi, I welcome to OVO quiz!');
    conv.ask(new BasicCard({
        text: 'Please choose a username.',
        image: new Image({
            url: 'https://firebasestorage.googleapis.com/v0/b/ovobot-quiz.appspot.com/o/images%2FOVObot_1024x1024.png?alt=media&token=401b1fba-90c7-4a36-9dd6-183611178d8a',
            alt: 'OVO Bot Logo'
        }),
        display: 'WHITE'
    }));
    conv.ask(new Suggestions(names.slice(0, 8)));

});

// Step - 1 User provides name
app.intent('Provides-Name', async (conv, params) => {
    
    let studentName = params['person']['name'];
    
    try {
        // Get student details
        let record = await ad.getUserInfo(studentName);

        conv.data.studentName = studentName;
        conv.data.studentID = record['id'];
        conv.data.memoLevel = record['memoLevel'];
        conv.data.conseptsLevel = record['conseptsLevel'];
        conv.data.mathLevel = record['mathLevel'];
        conv.data.clockLevel = record['clockLevel'];

        // Set question number
        let qn = 0;
        conv.data.qn = qn;

        // Set right answer count
        let count = 0;
        conv.data.count = count;

        conv.contexts.set('await-quiz-type', 1);

        conv.ask(`Hello ${studentName}, What would you like to practice today?`);
        conv.ask(new Suggestions('Memo', 'Consepts', 'Clock', 'Math', 'E-Shop'));
    } catch (error) {
        console.log('Error at Provides Name --> ', error);
    }
});

// Step - 2 Choice is WORD
app.intent('Ask-First-Question', async (conv) => {

    conv.data.Type = conv.query.charAt(0).toUpperCase()+conv.query.slice(1);
    
    let qList = [];

    // Generate question list
    if (conv.data.Type === 'Memo') {
        qList = await ad.getAllQuestionList('Memo', conv.data.memoLevel);
    } else if (conv.data.Type === 'Consepts') {
        qList = await ad.getAllQuestionList('Consepts', conv.data.conseptsLevel);
    } else if (conv.data.Type === 'Math') {
        qList = await ad.getAllQuestionList('Math', conv.data.mathLevel);
    } else if (conv.data.Type === 'Clock') {
        qList = await ad.getAllQuestionList('Clock', conv.data.clockLevel);
    }

    let aqList = await ad.getAnsweredQuestionList(`${conv.data.Type}Progress`, conv.data.studentName);

    let uaList = qList.filter(x => !aqList.includes(x));

    if (uaList.length == 0) {
        conv.data.uaList = qList;
    } else {
        conv.data.uaList = uaList;
    }

    // Current number of question
    let cn = conv.data.qn;
    // Current question number
    let cqn = conv.data.uaList[cn];

    try {
        let record = await ad.getNewQuestion(conv.data.Type, cqn);

        let Answer = record['Answer'];
        let Question = record['Question'];
        let ImageURL = record['ImageURL'];
        let QID = record['QuestionID'];
        let Hint, HintImageURL;

        if (record['HA'] != 0) {
            Hint = record['Hint'];
        } else {
            Hint = 0;
        }

        if (record['HIA'] != 0) {
            HintImageURL = record['HintImageURL'];
        } else {
            HintImageURL = 0;
        }

        conv.contexts.set('await-answer-first', 1);

        conv.data.Hint = Hint;
        conv.data.HintImageURL = HintImageURL;
        conv.data.Answer = Answer;
        conv.data.Question = Question;
        conv.data.ImageURL = ImageURL;
        conv.data.QID = QID;

        conv.ask(Question);
        conv.ask(new BasicCard({
            image: new Image({
                url: ImageURL,
                alt: 'Question Image'
            }),
            display: 'WHITE'
        }));

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
        let qList = [];
        // Generate question list
        if (conv.data.Type === 'Memo') {
            qList = await ad.getAllQuestionList('Memo', conv.data.memoLevel);
        } else if (conv.data.Type === 'Consepts') {
            qList = await ad.getAllQuestionList('Consepts', conv.data.conseptsLevel);
        } else if (conv.data.Type === 'Math') {
            qList = await ad.getAllQuestionList('Math', conv.data.mathLevel);
        } else if (conv.data.Type === 'Clock') {
            qList = await ad.getAllQuestionList('Clock', conv.data.clockLevel);
        }
        conv.data.uaList = qList;
        cqn = conv.data.uaList[cn];
    }

    try {
        let record = await ad.getNewQuestion(conv.data.Type, cqn);

        let Answer = record['Answer'];
        let Question = record['Question'];
        let ImageURL = record['ImageURL'];
        let QID = record['QuestionID'];
        let Hint, HintImageURL;

        if (record['HA'] != 0) {
            Hint = record['Hint'];
        } else {
            Hint = 0;
        }

        if (record['HIA'] != 0) {
            HintImageURL = record['HintImageURL'];
        } else {
            HintImageURL = 0;
        }
        
        conv.contexts.set('await-answer-first', 1);

        conv.data.Hint = Hint;
        conv.data.HintImageURL = HintImageURL;
        conv.data.Answer = Answer;
        conv.data.Question = Question;
        conv.data.ImageURL = ImageURL;
        conv.data.QID = QID;

        conv.ask(Question);
        conv.ask(new BasicCard({
            image: new Image({
                url: ImageURL,
                alt: 'Question Image'
            }),
            display: 'WHITE'
        }));

    } catch (error) {
        console.log('Error at Ask Question --> ', error);
    }
});


// Step - 3 User provides the answer
app.intent('Provides-Answer-First', async (conv) => {
    
    let clapURL = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emojidex/59/clapping-hands-sign_emoji-modifier-fitzpatrick-type-5_1f44f-1f3fe_1f3fe.png';
    let actualAnswer = conv.data.Answer;
    let userAnswer = conv.query;

    if (userAnswer.toLowerCase() === 'menu') {
        console.log('came here.');
        conv.followup('menu', {
            type: 'menu'
        });
    }

    // Create new record for ImageQuestionProgress
    fields = {
        'Name': conv.data.studentName,
        'QuestionID': conv.data.QID,
        'Answered': 1,
        'Answer1': userAnswer,
        'Answer2': 'NA'
    }

    ad.createProgress(conv.data.Type, fields)
        .then((flag) => {
            // Use the flag here
        })
        .catch((error) => {
            console.log('Error at Create Progress First Answer --> ', error);
        });

    let ansTempList = actualAnswer.split(',');

    let ansList = [];

    ansTempList.forEach(element => {
        ansList.push(element.toLowerCase());
    });

    if (ansList.includes(userAnswer.toLowerCase())) {

        let message = await ad.getCongratsMessage('Right Answer');

        if (message['Image'] == 0) {
            conv.ask(message['Message']);
            conv.ask(new BasicCard({
                image: new Image({
                    url: clapURL,
                    alt: 'Clap Image'
                })
            }));
        } else {
            conv.ask(message['Message']);
            conv.ask(new BasicCard({
                image: new Image({
                    url: message['ImageURL'],
                    alt: 'Congratulation Image'
                })
            }));
        }

        // Increment the count of right answer
        conv.data.count = conv.data.count+1;

        // Increment the question number
        conv.data.qn = conv.data.qn+1;

        if (conv.data.count == 3) {

            // Update student level
            let cLevel = conv.data[`${conv.data.Type.toLowerCase()}Level`];

            let nLevel = parseInt(cLevel.split('l')[1])+1;

            if (conv.data.Type === 'Memo') {
                fields = {
                    'Memo': `Level${nLevel}`
                }
                conv.data.memoLevel = `Level${nLevel}`;
            } else if (conv.data.Type === 'Consepts') {
                fields = {
                    'Consepts': `Level${nLevel}`
                }
                conv.data.conseptsLevel = `Level${nLevel}`;
            } else if (conv.data.Type === 'Math') {
                fields = {
                    'Math': `Level${nLevel}`
                }
                conv.data.mathLevel = `Level${nLevel}`;
            } else {
                fields = {
                    'Clock': `Level${nLevel}`
                }
                conv.data.clockLevel = `Level${nLevel}`;
            }

            let flag = await ad.updateStudent(conv.data.studentID, fields);

            // Get question list
            let qList = await ad.getAllQuestionList(conv.data.Type, `Level${nLevel}`);
            conv.data.uaList = qList;

            // Reset the count
            conv.data.count = 0;

            // Reset the question number
            conv.data.qn = 0;

            if (flag == 1) {
                // Ask new question here
                conv.contexts.set('await-continue-yes', 1);

                let message = await ad.getCongratsMessage('Level Up');

                if (message['Image'] == 0) {
                    let m = message['Message'];
                    conv.ask(m);
                    conv.ask(new Suggestions('Next Question', 'Menu'));
                } else {
                    let m = message['Message'];
                    conv.ask(m);
                    conv.ask(new Suggestions('Next Question', 'Menu'));
                    // conv.ask(new BasicCard({
                    //     image: new Image({
                    //         url: message['ImageURL'],
                    //         alt: 'Level Up Image'
                    //     })
                    // }));
                }
            } else {
                conv.ask('Sorry, I encountered an error. Try agin after sometime.')
            }

        } else {
            conv.contexts.set('await-continue-yes', 1);
            conv.ask(new Suggestions('Next Question', 'Menu'));
        }

    } else {

        conv.contexts.set('await-answer-second', 1);

        let ssml;

        if (conv.data.Hint == 0 && conv.data.HintImageURL == 0) {
            ssml = '<speak>' +
                'It is a wrong answer.' +
                '<audio src="https://www.soundjay.com/misc/fail-buzzer-01.mp3"></audio>' +
                '<break time="200ms"/>' +
                'Please try again.' +
                '</speak>';
            conv.ask(ssml); 
        } else if (conv.data.Hint != 0 && conv.data.HintImageURL == 0) {
            ssml = '<speak>' +
                'It is a wrong answer.' +
                '<audio src="https://www.soundjay.com/misc/fail-buzzer-01.mp3"></audio>' +
                '<break time="200ms"/>' +
                conv.data.Hint +
                '</speak>';
            conv.ask(ssml);
        } else if (conv.data.Hint == 0 && conv.data.HintImageURL != 0) {
            ssml = '<speak>' +
                'It is a wrong answer.' +
                '<audio src="https://www.soundjay.com/misc/fail-buzzer-01.mp3"></audio>' +
                'See the hint image.' +
                '</speak>';
            conv.ask(ssml);
            conv.ask(new BasicCard({
                image: new Image({
                    url: conv.data.HintImageURL,
                    alt: 'Hint Image'
                }),
                display: 'WHITE'
            }));
        } else {
            ssml = '<speak>' +
                'It is a wrong answer.' +
                '<audio src="https://www.soundjay.com/misc/fail-buzzer-01.mp3"></audio>' +
                '<break time="200ms"/>' +
                conv.data.Hint +
                '</speak>';
            conv.ask(ssml);
            conv.ask(new BasicCard({
                image: new Image({
                    url: conv.data.HintImageURL,
                    alt: 'Hint Image'
                }),
                display: 'WHITE'
            }));
        }
    }
});

// User provides answer second time
app.intent('Provides-Answer-Second', async (conv) => {

    let clapURL = 'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/160/emojidex/59/clapping-hands-sign_emoji-modifier-fitzpatrick-type-5_1f44f-1f3fe_1f3fe.png';
    let actualAnswer = conv.data.Answer;
    let userAnswer = conv.query;

    if (userAnswer.toLowerCase() === 'menu') {
        console.log('came here.');
        conv.followup('menu', {
            type: 'menu'
        });
    }

    // Update ImageQuestionProgress
    fields = {
        'Answer2': userAnswer
    }

    let id = await ad.getProgressByID(conv.data.Type, conv.data.QID, conv.data.studentName);

    if (id == 0) {
        console.log('Error at Update Progress.')
    } else {
        ad.updateProgress(conv.data.Type, id, fields)
        .then((flag) => {
            // Use the flag here
        })
        .catch((error) => {
            console.log('Error at Update Progress Answer Two --> ', error);
        });
    }

    let ansTempList = actualAnswer.split(',');

    let ansList = [];

    ansTempList.forEach(element => {
        ansList.push(element.toLowerCase());
    });

    if (ansList.includes(userAnswer.toLowerCase())) {

        let message = await ad.getCongratsMessage('Right Answer');

        if (message['Image'] == 0) {
            conv.ask(message['Message']);
            conv.ask(new BasicCard({
                image: new Image({
                    url: clapURL,
                    alt: 'Clap Image'
                })
            }));
        } else {
            conv.ask(message['Message']);
            conv.ask(new BasicCard({
                image: new Image({
                    url: message['ImageURL'],
                    alt: 'Congratulation Image'
                })
            }));
        }

        // Increment the count of right answer
        conv.data.count = conv.data.count+1;

        // Increment the question number
        conv.data.qn = conv.data.qn+1;

        if (conv.data.count == 3) {
            
            // Update student level
            let cLevel = conv.data[`${conv.data.Type.toLowerCase()}Level`];

            let nLevel = parseInt(cLevel.split('l')[1])+1;

            if (conv.data.Type === 'Memo') {
                fields = {
                    'Memo': `Level${nLevel}`
                }
                conv.data.memoLevel = `Level${nLevel}`;
            } else if (conv.data.Type === 'Consepts') {
                fields = {
                    'Consepts': `Level${nLevel}`
                }
                conv.data.conseptsLevel = `Level${nLevel}`;
            } else if (conv.data.Type === 'Math') {
                fields = {
                    'Math': `Level${nLevel}`
                }
                conv.data.mathLevel = `Level${nLevel}`;
            } else {
                fields = {
                    'Clock': `Level${nLevel}`
                }
                conv.data.clockLevel = `Level${nLevel}`;
            }

            let flag = await ad.updateStudent(conv.data.studentID, fields);

            // Get question list
            let qList = await ad.getAllQuestionList(conv.data.Type, `Level${nLevel}`);
            conv.data.uaList = qList;

            // Reset the count
            conv.data.count = 0;

            // Reset the question number
            conv.data.qn = 0;

            if (flag == 1) {

                let message = await ad.getCongratsMessage('Level Up');

                if (message['Image'] == 0) {
                    let m = message['Message'];
                    conv.ask(m);
                    conv.ask(new Suggestions('Next Question', 'Menu'));
                } else {
                    let m = message['Message'];
                    conv.ask(m);
                    conv.ask(new Suggestions('Next Question', 'Menu'));
                    // conv.ask(new BasicCard({
                    //     image: new Image({
                    //         url: message['ImageURL'],
                    //         alt: 'Level Up Image'
                    //     })
                    // }));
                } 

            } else {
                conv.ask('Sorry, I encountered an error. Try agin after sometime.')
            }

        } else {
            conv.contexts.set('await-continue-yes', 1);
            conv.ask(new Suggestions('Next Question', 'Menu'));
        }

    } else {

        // Reset the count
        conv.data.count = 0;

        // Increase the question number
        conv.data.qn = conv.data.qn+1; 
        
        // Ask new question here
        conv.contexts.set('await-continue-yes', 1);
        conv.ask(`Not quite. The answer is ` + actualAnswer + `.`);
        conv.ask(new Suggestions('Next Question', 'Menu'));
    }
});

// E Shop intent
app.intent('E-Shop', (conv) => {
    conv.contexts.set('e-shop-conv', 1);
    conv.data.checkoutPrice = 0;
    conv.ask('Welcome to e-shop! How can I help you?');
});

app.intent('E-Shop-Buy-Items', async (conv, params) => {

    conv.contexts.set('e-shop-conv', 1);

    let item = params['item'];
    let record = await ad.getItemFromEShop(item);

    if (record['status'] == 0) {
        conv.ask(`${item} is not available, do you want anything else?`);
    } else {
        let price = record['Price'];
        conv.data.checkoutPrice = conv.data.checkoutPrice+price;
        console.log(conv.data.checkoutPrice);
        console.log(conv.data.checkoutPrice);
        conv.ask(`${item} is added, do you want anything else?`)
        conv.ask(new BasicCard({
            image: new Image({
                url: record['ImageURL'],
                alt: 'E-Shop Image'
            })
        }));
    }
})

// E Shop checkout intent
app.intent('E-Shop-Checkout', (conv) => {
    conv.contexts.set('e-shop-conv', 0);
    conv.close(`It takes ${conv.data.checkoutPrice} Euros.`);
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
    conv.close(`Thank you ${conv.data.studentName} for using the app.`);
});

app.intent('Default Fallback Intent', (conv) => {

    conv.data.fallbackCount = conv.data.fallbackCount+1;

    let contexts = conv.contexts.input;

    for (const key in contexts) {
        if (contexts.hasOwnProperty(key)) {
            if (contexts[key]['name'].includes('await-')) {
                let vals = contexts[key]['name'].split('/');
                getContext = vals[vals.length-1]
            }
        }
    }

    if (conv.data.fallbackCount < 10) {
        conv.contexts.set(getContext, 1);
        conv.ask('Please say it again.');
    } else {
        conv.close('Sorry, I am facing trouble hearing you, try again after sometime.');
    }
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