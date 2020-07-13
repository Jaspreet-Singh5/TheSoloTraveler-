var mongoose = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var userBlogSchema = new mongoose.Schema({
    username : String,
    password : String,
});

userBlogSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("UserBlog", userBlogSchema);