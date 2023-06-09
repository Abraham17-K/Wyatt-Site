//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application
const express = require('express');
const fs = require('fs');
const app = express();
const MongoClient = require('mongodb').MongoClient
const path = require('path');
const bodyParser = require('body-parser');
const crypto = require("crypto");
const emailValidator = require('deep-email-validator');
const nodemailer = require('nodemailer');
require('dotenv').config()

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.set('view engine', 'ejs');

//TODO add a getter for votes
//TODO make it load all of the current issues and send to client
//TODO add a vote scheduler


//Create SMTP info
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
transporter.verify().then(console.log).catch(console.error);
//Create MongoDB Client
const uri = process.env.MONGODB_STRING
let mongoClient = new MongoClient(uri);
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});


app.get("/", (req, res) => {
    // const HTML = await getMainPage("You Suck")
    // res.send(HTML)
    // console.log("sent!")
    // res.send("Hi")
    res.redirect("/vote")
})

//TODO add auth
//TODO check duplicate emails
app.post("/addCitizen", async (req, res) => {
    if (req.body.citizenName == null || req.body.email == null) {
        res.sendStatus(404); //TODO replace with res.render()
        return
    }
    const {citizenName, email} = req.body
    // const {valid, reason, validators} = await emailValidator.validate(email);
    // console.log(valid)
    // console.log(reason)
    // if (valid == false) {
    //     res.sendStatus(400); //TODO replace with res.render()
    //     return
    // }
    const num = crypto.randomInt(Math.pow(10, 8), 999999999)
    id = "" + num
    await mongoClient.connect(async (err, db) => {
        if (err) throw (err)
        const citizenCollection = db.db("WyattSite").collection("citizens")
        citizenCollection.findOne({ citizenID: id }, async (err, result) => {
            if (err) throw (err)
            if (result != null) {
                res.sendStatus(400) //TODO replace with res.render() //Citizen already exists "an unknown error, try again" make better
                return
            }

            citizenCollection.insertOne({ citizenID: id, votes: [], citizenName: citizenName, citizenEmail: email }, (err) => {
                if (err) throw err
                res.sendStatus(201) //TODO replace with res.render()
            })
        })
    })
    var sendId = "";
    for (var i = 0; i < 9; i++) {
        sendId += id.charAt(i);
        if (i != 0 && (i+1) % 3 == 0 && i != 8) {
            sendId += '-'
        }
    }
    console.log(sendId)
    transporter.sendMail({
        from: '"Kapanshin Voting" kapanshin.voting@gmail.com', // sender address
        to: email, // list of receivers
        subject: "Welcome to Kapanshin!", // Subject line
        text: `You have been invited to join Kapanshin! Welcome ${citizenName}! Your id is ${sendId} Don't share this with anyone!`, // plain text body
        html: `You have been invited to join Kapanshin! Welcome ${citizenName}! <br>Your id is <b>${sendId}</b><br> Don't share this with anyone!`, // html body
      }).then(info => {
        console.log({info});
      }).catch(console.error);
    console.log(id)

})

app.post("/addIssue", async (req, res) => {
    const {issue, options} = req.body
    if (issue == null || options == null) {
        res.sendStatus(400) //TODO replace with res.render()
        return
    }

    await mongoClient.connect(async (err, db) => {
        if (err) throw err
        const votingCollection = db.db("WyattSite").collection("votingIssues")
        var votes = []
        for (var i = 0; i < options.length; i++) {
            votes.push(0)
        }
        votingCollection.insertOne( {name: issue, options: options, votes: votes} )
    })
})

app.post("/vote", async (req, res) => {
    console.log(JSON.stringify(req.headers));
    if (req.body.id == null || req.body.vote == null || req.body.issue == null) {
        res.render(__dirname + "/public/index.ejs", {statusMessage: "Please enter your citizen ID and vote!"})
        return;
    }
    var citizenID = req.body.id;
    while (citizenID.includes("-")) {
        citizenID = citizenID.replace("-", "")
    }
    const vote = req.body.vote;
    const issue = req.body.issue;

    //TODO close db properly
    await mongoClient.connect(async (err, db) => {
        if (err) throw (err)
        else {
            //Setup database collections to be used
            const voteCollection = db.db("WyattSite").collection("votes")
            const votingItemsCollection = db.db("WyattSite").collection("votingIssues")
            const citizenCollection = db.db("WyattSite").collection("citizens")

            //Check if the issue selected is valid
            votingItemsCollection.findOne({ name: issue }, async (err, voteResult) => {
                if (err) throw err
                if (voteResult == null) {
                    const issues = await getVoteList()
                    res.render(__dirname + "/public/index.ejs", {statusMessage: "Please don't mess with the site! (name)", issues: issues})
                    return
                }
                if (!voteResult.options.includes(vote)) {
                    const issues = await getVoteList()
                    res.render(__dirname + "/public/index.ejs", {statusMessage: "Please don't mess with the site! (vote)", issues: issues})
                    return
                }
                //Check if the Citizen ID is valid
                citizenCollection.findOne({ citizenID: citizenID }, async (err, result) => {
                    if (err) throw (err)
                    if (result != null) {
                        if (result.votes.includes(issue) == true) {
                            const issues = await getVoteList()
                            res.render(__dirname + "/public/index.ejs", {statusMessage: "You've already voted!", issues: issues})
                        } else {
                            console.log(result.votes)
                            citizenCollection.updateOne({ citizenID: citizenID }, {
                                $push: {
                                    votes: issue
                                }
                            }, async (err, result) => {
                                if (err) throw (err)
                                votes = voteResult.votes
                                votes[voteResult.options.indexOf(vote)] = 1 + votes[voteResult.options.indexOf(vote)]
                                votingItemsCollection.updateOne({ name: issue }, {
                                    $set: {votes: votes}
                                })
                                const issues = await getVoteList()
                                res.render(__dirname + "/public/index.ejs", {statusMessage: "Voted successfully! Check back later for the results!", issues: issues})
                            })
                        }
                        await db.close()
                    } else {
                        await db.close()
                        const issues = await getVoteList()
                        res.render(__dirname + "/public/index.ejs", {statusMessage: "Enter a valid citizen ID!", issues: issues})
                    }
                })
            })
        }
    })
})

app.listen(3000, () => {
    console.log('Running on http://localhost:3000/ and http://datalsmp.ga:3000');
});

//TODO add error handling
app.get("/vote", async (req, res) => {
    // await mongoClient.connect(async (err, db) => {
    //     const voteCollection = db.db("WyattSite").collection("votingIssues")
    //     voteCollection.find({}).toArray((err, result) => {
    //         if (err) throw err
    //         if (result == null) return
    //         console.log(result)
    //         res.render(__dirname + "/public/index.ejs", {statusMessage: "Vote below!", issues: result})
    //     })
    // })
    var issues = await getVoteList()
    console.log("rendering votes with list")
    console.log("issues", issues)
    res.render(__dirname + "/public/index.ejs", {statusMessage: "Vote below!", issues: issues })
})

async function getVoteList() {
    await mongoClient.connect(async (err, db) => {
        const voteCollection = db.db("WyattSite").collection("votingIssues")
        voteCollection.find({}).toArray((err, result) => {
            if (err) throw err
            if (result == null) return
            console.log(result)
            return result
        })
    })
}
