//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application
const express = require('express');
const fs = require('fs');
const app = express();
const MongoClient = require('mongodb').MongoClient
const path = require('path');
const bodyParser = require('body-parser')
require('dotenv').config()

app.use(express.static(__dirname + '/public'));
app.use(bodyParser());
app.set('view engine', 'ejs');

//Create MongoDB Client
const uri = process.env.MONGODB_STRING
let mongoClient = new MongoClient(uri);
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true});


app.get("/", async (req, res) => {
    // const HTML = await getMainPage("You Suck")
    // res.send(HTML)
    // console.log("sent!")
    // res.send("Hi")
    res.redirect("/vote")
})

app.post("/vote", async (req, res) => {
    if (req.body.id == null || req.body.vote == null || req.body.issue == null) {
        res.render(__dirname + "/public/index.ejs", {statusMessage: "Please enter your citizen ID and vote!"})
        return;
    }
    const citizenID = req.body.id;
    const vote = req.body.vote;
    const issue = req.body.issue
    if (vote.toLowerCase() == "quantity1" || vote.toLowerCase() == "quantity2") {
        await mongoClient.connect(async (err, db) => {
            console.log("hello")
            if (err) throw (err)
            else {
                console.log("connected")
                 const voteCollection = db.db("WyattSite").collection("votes")
                 const citizenCollection = db.db("WyattSite").collection("citizens")
                 citizenCollection.findOne({ citizenID: citizenID }, async (err, result) => {
                      if (err) throw (err)
                      if (result != null) {
                        if (result.hasVoted == true) {
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
            }
       })
    } else {
        res.render(__dirname + "/public/index.ejs", {statusMessage: "Don't mess with the site!"})
    }
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