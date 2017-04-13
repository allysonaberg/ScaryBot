'use strict'

var savedVideo = []
var titles = []
var subtitles = []
var images = []
var urls = []

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
function dbList(sender, titles, subtitles, images, urls) {
	Favourites.find(/*{sender: sender},*/ function(err, favourites) {
		if (err) throw err
			//console.log( JSON.stringify( favourites, null, 1) );
		console.log("DB LEGNTH: " + favourites.length)
			for (var index = 0; index < favourites.length; index++) {
					titles.push(favourites[index].meta[0].title)
					subtitles.push(favourites[index].meta[0].subtitle)
					images.push(favourites[index].meta[0].image)
					urls.push(favourites[index].meta[0].url)
			 }
			 console.log("TITLE LENGTH: " + titles.length)
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
	dbFindAndUpdate: dbFindAndUpdate,
	titles: titles,
	subtitles: subtitles,
	images: images,
	urls: urls
}