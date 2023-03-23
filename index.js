//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application
const express = require('express');
const fs = require('fs');
const app = express();
const MongoClient = require('mongodb').MongoClient
const path = require('path');
const bodyParser = require('body-parser');
const { ConnectionClosedEvent } = require('mongodb');
require('dotenv').config()

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.set('view engine', 'ejs');

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

app.post("/addCitizen", async (req, res) => {
    if (req.body.citizenName == null) {
        res.send(201);
    }
})

app.post("/vote", async (req, res) => {
    if (req.body.id == null || req.body.vote == null || req.body.issue == null) {
        res.render(__dirname + "/public/index.ejs", {statusMessage: "Please enter your citizen ID and vote!"})
        return;
    }
    const citizenID = req.body.id;
    const vote = req.body.vote;
    const issue = req.body.issue
    await mongoClient.connect(async (err, db) => {
        if (err) throw (err)
        else {
            //Setup database collections to be used
            const voteCollection = db.db("WyattSite").collection("votes")
            const votingItemsCollection = db.db("WyattSite").collection("votingIssues")
            const citizenCollection = db.db("WyattSite").collection("citizens")

            //Check if the issue selected is valid
            //TODO Make it so more than one person with the same name/ID can vote
            votingItemsCollection.findOne({ name: issue }, async (err, voteResult) => {
                if (err) throw err
                if (voteResult == null) {
                    res.render(__dirname + "/public/index.ejs", {statusMessage: "Please don't mess with the site! (name)"})
                    return
                }
                console.log(voteResult.options)
                if (!voteResult.options.includes(vote)) {
                    res.render(__dirname + "/public/index.ejs", {statusMessage: "Please don't mess with the site! (vote)"})
                    return
                }

                //Check if the Citizen ID is valid
                citizenCollection.findOne({ citizenID: citizenID }, async (err, result) => {
                    if (err) throw (err)
                    if (result != null) {
                        if (result.votes.includes(issue) == true) {
                            res.render(__dirname + "/public/index.ejs", {statusMessage: "You've already voted!"})
                        } else {
                            citizenCollection.updateOne({ citizenID: citizenID }, {
                                $set: {
                                    hasVoted: true
                                }
                            }, async (err, result) => {
                                if (err) throw (err)
                                res.render(__dirname + "/public/index.ejs", {statusMessage: "Voted successfully! Check back later for the results!"})
                                await db.close()
                            })
                        }
                        await db.close()
                    } else {
                        await db.close()
                        res.render(__dirname + "/public/index.ejs", {statusMessage: "Enter a valid citizen ID!"})
                    }
                })
            })
        }
    })
})

app.listen(3000, () => {
    console.log('started on port 3000');
});

function generateHTMLVotes(data) {
    return "hi!"
}

app.get("/vote", (req, res) => {
    res.render(__dirname + "/public/index.ejs", {statusMessage: "Vote below!"})
})