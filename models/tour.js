var mongoose = require("mongoose");

var tourSchema = new mongoose.Schema({
    name:           String,
    days:           String,
    numOfPeople:    String,
    numOfGuides:    String,
    sleep:          String,
    difficulty:     String,
    price:          String,
    image:       String,
});

module.exports = mongoose.model("Tour", tourSchema);
