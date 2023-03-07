//jshint esversion:6
require('dotenv').config();
const express = require ("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
const bcrypt = require("bcrypt");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect("mongodb://0.0.0.0:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
   res.render ("home");
});

////////////////////////  LOGIN /////////////////////
app.route("/login")
    .get (function(req, res){
        res.render ("login");
    })
    .post (async(req, res) => {
        try {
            const username = req.body.username;
            const password = req.body.password;
            
            User.findOne({email: username}).then(function(foundUser){
                if (foundUser){   
                console.log(foundUser.password);
                    bcrypt.compare(password, foundUser.password, function(err, result){
                        if (result === true){
                            console.log("success login");
                            res.render("secrets");
                        }else{
                            console.log("failde login");
                        }
                    });

                    
                } else {
                    res.render("home");
                    console.log("false user");
                }
                
            });
        }
        catch (error) {
            console.log(error);
        }
    });


 /////////////// REGISTER ////////////////////////   
 app.route("/register")
 . get( function(req, res){
    res.render ("register");
    })

 .post(async(req, res) => {
    try {

        const saltRounds = 10;
    
        bcrypt.hash(req.body.password, saltRounds, function(err, hash){
            const newUser = new User({
                email: req.body.username,
                password: hash
                });
            newUser.save().then(saveDoc => {
                {
                    console.log("new User" + req.body.username);
                    res.render("secrets");
                }});

        });
       
       
    }
    catch (error){
        console.log(error);
    }});

app.listen(3000, function(){
    console.log("Server Manuela ist started on Port 3000");
});