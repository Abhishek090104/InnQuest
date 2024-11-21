const express = require("express");
const router = express.Router({mergeParams: true});
const user = require("../models/users");
const passport = require("passport");
router.get("/signup",(req,res)=>{
    res.render("./users/signup.ejs");
});

router.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const newUser = new user({ email, username });
        const registeredUser = await user.register(newUser, password);
        console.log(registeredUser);
        req.flash("success", `Welcome to InnQuest, ${username}!`);
        res.redirect("/listings");
    } catch (err) {
        req.flash("error", err.message);
        res.redirect("/signup"); // Redirect to the signup page in case of an error
    }
});


router.get("/login", (req, res) => {
    res.render("./users/login.ejs");
});


router.post("/login",
    passport.authenticate("local",
        {failureRedirect: '/login',
             failureFlash: true
            }),
           async (req,res) => {
            const { username, password } = req.body;
          req.flash("success",` ${username} has successfully logged in`);
           res.redirect("/listings");
});


router.get("/logout", (req,res) =>{
    req.logout((err) => {
        if(err){
           return next(err);
        }
        req.flash("success","you have logged out successfully");
        res.redirect("/listings");
    })
    
})
module.exports = router;
