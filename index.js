//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application
const express = require('express');
const fs = require('fs');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
require('dotenv').config()

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

//Create MongoDB Client
const uri = process.env.MONGODB_STRING
const client = new MongoClient(uri, { useNewUrlParser: true });


app.get("/", async (req, res) => {
    // const HTML = await getMainPage("You Suck")
    // res.send(HTML)
    // console.log("sent!")
    // res.send("Hi")
    res.redirect("/vote")
})

app.post("/vote", (req, res) => {
    console.log(req.body.id)
    if (req.body.id == null || req.body.vote == null) {
        res.render(__dirname + "/public/index.ejs", {statusMessage: "Please enter your citizen ID and vote!"})
        return;
    }
    const citizenID = req.body.id;
    const vote = req.body.vote;
    if (vote.toLowerCase() == "quantity1" || vote.toLowerCase() == "quantity2") {
        client.connect(process.env.MONGODB_STRING, async (err, db) => {
            if (err) throw (err)
            else {
                 const voteCollection = db.db("WyattApp").collection("votes")
                 const citizenCollection = db.db("WyattApp").collection("citizens")
                 collection.findOne({ citizenID: citizenID }, async (err, result) => {
                      if (err) throw (err)
                      if (result != null) {
                        if (result.hasVoted == true) {
                            res.render(__dirname + "/public/index.ejs", {statusMessage: "You've already voted!"})
                        }
                           await db.close()
                      } else {
                           collection.updateOne({ citizenID: citizenID }, {
                            $set: {
                                hasVoted: true
                            }
                           }, async (err, result) => {
                                if (err) throw (err)
                                res.render(__dirname + "/public/index.ejs", {statusMessage: "Voted successfully! Check back later for the results!"})
                                await db.close()
                           })
                      }
                 })
            }
       })
    } else {
        res.render(__dirname + "/public/index.ejs", {statusMessage: "Don't mess with the site!"})
    }
})

app.listen(3001, () => {
    console.log('started on port 3000');
});

function generateHTMLVotes(data) {
    return "hi!"
}

app.get("/vote", (req, res) => {
    res.render(__dirname + "/public/index.ejs", {statusMessage: "Vote below!"})
})