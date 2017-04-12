'use strict'

const templates = require( "./templates" )
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var url = process.env.MONGOLAB_URI
mongoose.connect(url)

var favouritesSchema = new Schema({
	meta: [{
		sender: String,
		title: String,
		subtitle: String,
		image: String,
		url: String
	}]
})

var Favourites = mongoose.model('Favourites', favouritesSchema)

module.exports = Favourites

//CREATE
function dbPopulate(sender, title, subtitle, image, url) {
	var user = Favourites({
		meta:[{
			sender: sender,
			title: title,
			subtitle: subtitle,
			image: image,
			url: url
		}]
	})

	user.save(function(err) {
	if (err) console.log("ERROR:" + err)
		console.log("ADDED IN!!!")
	})
}


//READ ALL
function dbList(sender) {
	Favourites.find(/*{sender: sender},*/ function(err, favourites) {
		if (err) throw err
			console.log( JSON.stringify( favourites, null, 1) );
			// savedVideo.length = 0
			// for (var index = 0; index < favourites.length; index++) {

			// }
	})
}

//REMOVE
function dbRemove(sender, title) {
	Favourites.findOneAndRemove({sender: sender}, {title: title}, function(err) {
		if (err) throw err
		console.log("deleted")
	})
}

//FIND AND UPDATE (in this case, find by title)
function dbFindAndUpdate() {
	Favourites.findById({title: ''}, {title: 'newtitle'}, function(err, user) {
		if (err) throw err

		console.log("found and updated")

	})
}


module.exports = {
	dbPopulate: dbPopulate,
	dbList: dbList,
	dbRemove: dbRemove,
	dbFindAndUpdate: dbFindAndUpdate
}