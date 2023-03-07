//jshint esversion:6
require('dotenv').config();
const express = require ("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require ("mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const session = require ("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const findOrCreate = require("mongoose-findorcreate");

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

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile.photos.value);
    console.log("--" + profile._json.picture);
    photos = profile._json.picture;
    User.findOrCreate({ googleId: profile.id, email: profile.email }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

mongoose.connect("mongodb://0.0.0.0:27017/userDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

app.get("/", function(req, res){
   res.render ("home");
});

/*app.get("/secrets", function(req, res){
    if (req.isAuthenticated()){
        res.render("secrets");
        console.log("Login erfolgreich");
    }else {
        res.redirect("/login");
        console.log("zuerst Login");
    }
});*/

app.get("/secrets", function(req, res){
    User.find({"secret": {$ne: null}}, 
    function (err, foundUsers){
        if (err){
            console.log(err);
        }else {
            if (foundUsers){
                res.render("secrets", {"userswithSecrets": foundUsers});
            }
        }
    });
});


app.get ("/submit", function(req, res){
    if (req.isAuthenticated()){
        res.render("submit");
        console.log("zum submit");
    }else {
        res.redirect("/login");
        console.log("zuerst Login");
    }
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] }));

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });


  app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/logout", function(req, res){
    req.logout(function(err){
        if (err){
            console.log("ausloggen ging nicht");
        }
    });
    res.redirect("/");
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

app.post("/submit", function (req, res){
    const submittedSecret = req.body.secret;

    console.log(req.user.id);

    User.findById(req.user.id, function(err, foundUser){
        if (foundUser){
            foundUser.secret=submittedSecret;
            console.log("hier+");

            foundUser.save().then(saveDoc => {
                {
                   console.log(submittedSecret+"5");
                    res.redirect("/secrets");
                }}).catch(function(error){
                    console.log(error);
                });
        }
    }); 
    
});


app.listen(3000, function(){
    console.log("Server Manuela ist started on Port 3000");
});