var express          = require("express"),
    app              = express(),
    body             = require("body-parser"),
    Tour             = require("./models/tour");
    
var expressSanitizer    = require("express-sanitizer"),
    methodOverride      = require("method-override"),
    LocalStrategy       = require("passport-local"),
    mongoose            = require("mongoose"),
    passport            = require("passport"),
    flash               = require("connect-flash"),
    User                = require("./models/user"),
    Blog                = require("./modelsBlog/blog"),
    middlewareBlog      = require("./middlewareBlog");
// EXPRESS CONFIG
app.use(require("express-session")({
    secret: "the pancake that john gave me to eat yesterday, was very bad in taste.",
    resave: false,
    saveUninitialized: false,
}));

// PASSPORT CONFIG
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

// middleware
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

// APP CONFIG
mongoose.connect("mongodb://JaspreetSingh:jaspreet1999@ds029821.mlab.com:29821/thesolotraveler");
//mongoose.connect("mongodb://localhost/TheSoloTraveler");

app.set("view engine", "ejs");
app.use(body.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(expressSanitizer());

app.get("/", function(req,res) {
    res.render("index");
});

app.get("/tourList", function(req,res) {
    Tour.find({}, function(err, tours){
        if(err)
        {
            console.log(err);
        }
        else
        {
            res.render("./tours/index", {tours : tours});   
        }
    })
});

// create tour
app.get("/newTour", function(req, res){
    res.render("./tours/new");
});

// create tour
app.post("/tourList", function(req, res){
    
    Tour.create(req.body.tour, function(err, newTour){
        if(err){
            res.render("./tours/new");
        }
        
        else{
            res.render("index")
        }
    });
});

// show event
app.get("/tours/:id", function(req, res) {
    Tour.findById(req.params.id, function(err, tour){
        if(err){
            console.log(err);
        }
        
        else{
            res.render(".tours/show", { tour: tour });
        }
    });
});

// register form
app.get("/register",function(req,res){
    res.render("register");
})

//sign up logic
app.post("/register",function(req, res) {
   var newUser = new User({username:req.body.username});
   User.register(newUser,req.body.password,function(err,user){
       if(err){
           req.flash("error",err.message);
           console.log(err);
           return res.redirect("/register");
       }
       passport.authenticate("local")(req,res,function(){
           req.flash("success","Welcome to TheSoloTraveler "+user.username);
           res.render("index");
       });
   });
});

// login form
app.get("/login",function(req, res){
    res.render("login");
});

// login logic
app.post("/login",passport.authenticate("local",{
    successRedirect: "/",
    failureRedirect: "/login",
}), function(req, res){
});

// logout logic
app.get("/logout",function(req, res){
    req.logout();
    req.flash("success","Logged you out");
    res.redirect("/");
});

// middleware to prevent unauthenticated access
function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
            console.log("yup");
            return next();
    }
    req.flash("error","You need to be logged in to do that");
    res.redirect("/login");
}

// ================
// blog routes
// ================

// INDEX
app.get("/blogs", function(req, res){
    Blog.find({}, function(err, blogs){
        if(err)
        {
            console.log(err);
            req.flash("error",err.message);
        }
        else
        {
            res.render("blogs/index", {blogs : blogs});   
        }
    })
});

// NEW
app.get("/blogs/new", middlewareBlog.isLoggedIn, function(req, res){
   res.render("blogs/new"); 
});

// CREATE
app.post("/blogs", middlewareBlog.isLoggedIn, function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);

    var author = {
      id: req.user._id,
      username: req.user.username,
    };
    
    req.body.blog.author = author;
    
    Blog.create(req.body.blog, function(err, newBlog){
        if(err){
            res.render("blogs/new");
            req.flash("error",err.message);
        }
        
        else{
            res.redirect("/blogs");
        }
    });
});

// SHOW
app.get("/blogs/:id", function(req, res){
    Blog.findById(req.params.id).populate("comments").exec(function(err, foundBlog){
        if(err){
            res.redirect("/blogs");
            req.flash("error",err.message);
        }
        else{
            res.render("blogs/show", {blog: foundBlog});
        }
    })
})

// EDIT
app.get("/blogs/:id/edit", middlewareBlog.checkBlogOwnership, function(req, res) {
    Blog.findById(req.params.id, function(err, foundBlog)
    {
        if(err){
            res.redirect("/blogs");
            req.flash("error",err.message);
        }
        
        else{
             res.render("blogs/edit", {blog: foundBlog});
        }
    });
});

// Update
app.put("/blogs/:id", middlewareBlog.checkBlogOwnership, function(req, res){
    req.body.blog.body = req.sanitize(req.body.blog.body);
    Blog.findByIdAndUpdate(req.params.id, req.body.blog, function(err, updateBlog){
        if(err){
            res.redirect("/blogs");
            req.flash("error",err.message);
        }
        
        else{
            res.redirect("/blogs/" + req.params.id);
        }
    })
})

// DELETE
app.delete("/blogs/:id", middlewareBlog.checkBlogOwnership, function(req, res){
    Blog.findByIdAndRemove(req.params.id, function(err)
    {
        if(err){
            res.redirect("/blogs");
            req.flash("error",err.message);
        }
        else{
            res.redirect("/blogs");
        }
    })
})

// ================
// Auth routes
// ================

// register form
app.get("/registerBlog",function(req,res){
    res.render("blogs/register");
})

//sign up logic
app.post("/registerBlog",function(req, res) {
   var newUser = new User({username:req.body.username});
   User.register(newUser,req.body.password,function(err,user){
       if(err){
           req.flash("error",err.message);
           
           return res.redirect("/registerBlog");
       }
       passport.authenticate("local")(req,res,function(){
           req.flash("success","Welcome to our Blog app "+user.username);
           res.redirect("/blogs");
       });
   });
});

// login form
app.get("/loginBlog",function(req, res){
    res.render("blogs/login");
});

// login logic
app.post("/loginBlog",passport.authenticate("local",{
    successRedirect: "/blogs",
    failureRedirect: "/loginBlog",
}), function(req, res){
});

// logout logic
app.get("/logoutBlog",function(req, res){
    req.logout();
    req.flash("success","Logged you out");
    res.redirect("/blogs");
});

// ================
// Comment routes
// ================

// NEW
app.get("/blogs/:id/comments/new", middlewareBlog.isLoggedIn, function(req, res){
    // find campground by id
    Blog.findById(req.params.id, function(err, foundBlog){
        if(err){
            req.flash("error",err.message);
            console.log(err);
        }
        else{
                res.render("comments/new", {blog: foundBlog});
        }
    });
});

// CREATE
app.post("/blogs/:id/comments/", middlewareBlog.isLoggedIn, function(req,res){
   // lookup campground using id
   Blog.findById(req.params.id, function(err, foundBlog){
       if(err){
            req.flash("error",err.message);
           console.log(err);
           res.redirect("/blogs");
       }
       else{
           Comment.create(req.body.comment, function(err, comment){
               if(err){
                   req.flash("error",err.message);
                   console.log(err);
               }
               else{
                   comment.author.id = req.user._id;
                   comment.author.username = req.user.username;
                   comment.save();
                   foundBlog.comments.push(comment);
                   foundBlog.save(function(err){
                       if(err){
                           req.flash("error",err.message);
                           console.log(err);
                       }
                       else{
                            res.redirect("/blogs/" + foundBlog._id);         
                       }
                   });
               }
           });
       }
           
   });
});

// EDIT
app.get("/blogs/:id/comments/:comment_id/edit", middlewareBlog.checkCommentOwnership, function(req,res){
   Comment.findById(req.params.comment_id, function(err, foundComment){
       if(err){
           req.flash("error",err.message);
           console.log(err);
           res.redirect("back");
       }
       else{
           res.render("comments/edit",{blog_id:req.params.id,comment:foundComment});
       }
   });
});

// UPDATE
app.put("/blogs/:id/comments/:comment_id", middlewareBlog.checkCommentOwnership, function(req,res){
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err){
       if(err){
           req.flash("error",err.message);
           res.redirect("back");
       }
       else{
           res.redirect("/blogs/" + req.params.id);
       }
   }) 
});

// DELETE
app.delete("/blogs/:id/comments/:comment_id", middlewareBlog.checkCommentOwnership, function(req,res){
    Comment.findByIdAndRemove(req.params.comment_id,function(err){
        if(err){
            console.log(err);
            req.flash("error",err.message);
            res.redirect("back");
        }
        else{
            res.redirect("/blogs/"+req.params.id);
        }
    });
});


app.listen(process.env.PORT, process.env.IP, function() {
        console.log("The TheSoloTraveler Server has Started.");
    }
);
