//https://www.digitalocean.com/community/tutorials/how-to-use-ejs-to-template-your-node-application
const express = require('express');
const fs = require('fs');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const path = require('path');
require('dotenv').config()

app.set('view engine', 'ejs');

//Create MongoDB Client
const uri = process.env.MONGODB_STRING
const client = new MongoClient(uri, { useNewUrlParser: true });


app.get("/", async (req, res) => {
    const HTML = await getMainPage("You Suck")
    res.send(HTML)
    console.log("sent!")
    // res.send("Hi")
})

app.post("/vote", (req, res) => {
    if (!req.query.id || !req.query.vote) {
        res.redirect("/").send(getMainPage("Please enter a citizen ID and Vote"));
        return;
    }
    const citizenID = req.query.id;
    const vote = req.query.vote;
    if (vote.toLowerCase() == "quantity1" || vote.toLowerCase() == "quantity2") {
        res.redirect("/").send(getMainPage("Voted Successfully!"))
    } else {
        res.render("/public/index.ejs")
    }

})

app.listen(3000, () => {
    console.log('started on port 3000');
});

function generateHTMLVotes(data) {
    return "hi!"
}
