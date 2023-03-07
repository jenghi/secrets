//jshint esversion:6
require('dotenv').config();
const express = require ("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");

const session = require ("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
mongoose.set('strictQuery', true);
const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://0.0.0.0:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
   res.render ("home");
});

app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets");
        console.log("Login erfolgreich");
    }else {
        res.redirect("/login");
        console.log("zuerst Login");
    }
});

////////////////////////  LOGIN /////////////////////
app.route("/login")
    .get (function(req, res){
        res.render ("login");
    })
    .post (async(req, res) => {
        try {
            const user = new User ({
                username: req.body.username,
                password: req.body.password
            });
            req.login(user, function(err){
                if (err){
                    console.log(err);
                }else {
                    passport.authenticate('local')(req, res, function(){
                        res.redirect("/secrets");
                        });
         } });
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
        User.register({username: req.body.username}, req.body.password).then (function(err, user){
            passport.authenticate('local')(req, res, function(){
                res.redirect("/secrets");
            });
           
        }).catch(function(err){
            console.log(err + " User gibts schon");
            res.redirect("/register");
        });
       
    }
    catch (error){
        console.log(error);
    }});


app.get("/logout", function(req, res){
    req.logout(function(err){
        if (err){
            console.log("ausloggen ging nicht");
        }
    });
    res.redirect("/");
});

app.listen(3000, function(){
    console.log("Server Manuela ist started on Port 3000");
});