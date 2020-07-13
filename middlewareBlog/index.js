var Comment = require("../modelsBlog/comment"),
    Blog = require("../modelsBlog/blog.js");

var middleware = {};

// middleware to prevent unauthenticated access
middleware.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
            return next();
    }
    req.flash("error", "You need to be logged in to do that");
    res.redirect("/loginBlog");
};

middleware.checkBlogOwnership = function(req, res, next){
    // if a user is logged in
    if(req.isAuthenticated()){
        Blog.findById(req.params.id, function(err, foundBlog){
            if(err){
                console.log(err);
                req.flash("error","Blog not found");
                res.redirect("back");
            }
            else{
                // does user own the comment
                if(foundBlog.author.id.equals(req.user._id)){
                    next();
                }
                else{
                    req.flash("error","You do not have the permission to do that");
                    res.redirect("back");
                }
            }    
        });   
    }
    else{
        req.flash("error","You need to be logged in to do that");
        res.redirect("back");
    }
};

middleware.checkCommentOwnership = function(req, res, next){
    // if a user is logged in
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                console.log(err);
                req.flash("error","Comment not found");
                res.redirect("back");
            }
            else{
                // does user own the comment
                if(foundComment.author.id.equals(req.user._id)){
                    next();
                }
                else{
                    req.flash("error","You do not have the permission to do that");
                    res.redirect("back");
                }
            }    
        });   
    }
    else{
        req.flash("error","You need to be logged in to do that");
        res.redirect("back");
    }
};

module.exports = middleware;