'use strict'

const express = require( 'express' )
const bodyParser = require( 'body-parser' )
const request = require( 'request' )
const app = express()
const math = require( 'mathjs' )
const db = require("./db")
var async = require('async')
var YouTube = require( 'youtube-node' )
var youTube = new YouTube()
youTube.setKey( 'AIzaSyDxvDFk1sS41kxhWS8YR5etEGlHfkrExrI' )
youTube.addParam( 'channelId', 'UCeHGGfhRUiH5wBpjjzbRNXg' )
	//youTube.addParam('channelId', 'UCJMemx7yz_1QwXjHG_rXRhg' )

const token = "EAADzGu0rDvIBAO7YTXgcDVviPZAU1PIFP6kjvOVpbWXxv9ZBZCV6hCSQ8nbpKGr0RHLJDYQtXfhRpwTX6ZCXtaqnzFoOf0y045loHFKbLYSBHpmVl6WEIdslipuZAdl2CodIZAy9lLVkXDcqdxJ5IgZB9bKYskg3UY95qZBtTZCZA3OgZDZD"

var userInfo = [] //key will be the user id, value will be another dictionary (ie: [alarm?: Bool], [savedList: array], etc...)
var savedDictionary = []

//saved video object
var savedVideo = []

var titles = []
var subtitles = []
var images = []
var urls = []
var ids = []

var CronJob = require( 'cron' ).CronJob;


var inStories = false
var inSubscribe = false
var isSubscribed = false

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var url = process.env.MONGOLAB_URI
mongoose.connect(url)

app.set( 'port', ( process.env.PORT || 5000 ) )

function sendTextMessage( sender, text ) {
	let messageData = {
		text: text
	}
	sendRequest( sender, messageData )
}

function sendQuickReply( sender, message, option1, option2 ) {
	let messageData = {
		"text": message,
		"quick_replies": [ {
			"content_type": "text",
			"title": option1,
			"payload": option1
		}, {
			"content_type": "text",
			"title": option2,
			"payload": option2
		} ]
	}
	sendRequest( sender, messageData )
}

function sendQuickReplyMenu( sender, message, option1, option2, option3 ) {
	let messageData = {
		"text": message,
		"quick_replies": [ {
			"content_type": "text",
			"title": option1,
			"payload": option1
		}, {
			"content_type": "text",
			"title": option2,
			"payload": option2
		}, {
			"content_type": "text",
			"title": option3,
			"payload": option3
		} ]
	}
	sendRequest( sender, messageData )
}

/* REGULAR MESSAGES */
function sendGenericMessageTemplate( sender, results, titles, subtitles, images, urls ) {
	let messageData = genericMessageTemplate( sender, results, titles, subtitles, images, urls )

	sendRequest( sender, messageData )
}

function genericMessageTemplate( sender, results, titles, subtitles, images, urls ) {
	var elements = []

	for ( var xy = 0; xy < titles.length && xy < 10; xy++ ) {
		elements.push( storyElement( xy, results, titles, subtitles, images, urls ) )
	}
	return {
		attachment: {
			type: "template",
			payload: {
				template_type: "generic",
				elements: elements
			}
		}
	}
}

function storyElement( xy, results, titles, subtitles, images, urls ) {

	var not_found_image = "http://i.imgur.com/ZZVyknT.png"
	var not_found_url = "http://i.imgur.com/bvuKFZp.png"

	var buttons = [ {
		type: "web_url",
		url: urls[ xy ],
		title: "Watch"
	} ]
	buttons.push( {
		type: "postback",
		title: "Save to favourites",
		payload: "MessageSave" + xy
	} )

	return {
		title: titles[ xy ],
		item_url: urls[ xy ],
		subtitle: subtitles[ xy ],
		image_url: images[ xy ],
		buttons: buttons
	}

}


/* SAVED MESSAGES */
function sendGenericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids) {
	let messageData = genericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids)
	sendRequest( sender, messageData )
	
}

function genericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids) {
	var elements = []
	for ( var xy = 0; xy < ( titles.length); xy++ ) {
		console.log("XY: " + xy)
		elements.push( storyElementSaved( xy, sender, titles, subtitles, images, urls, ids) )
	}
	return {
		attachment: {
			type: "template",
			payload: {
				template_type: "generic",
				elements: elements
			}
		}
	}
}

function storyElementSaved( xy, sender, titles, subtitles, images, urls) {

	console.log("3")
	var buttons = [ {
		type: "web_url",
		url: urls[xy],
		title: "Watch"
	} ]
	buttons.push( {
		type: "postback",
		title: "Remove",
		payload: "SavedRemove" + ids[xy]
	} )

	return {
		title: titles[xy],
		item_url: urls[xy],
		subtitle: subtitles[xy],
		image_url: images[xy],
		buttons: buttons
	}

}


function sendMoreMessage( sender, keyword ) {
	console.log( "SENDING MORE MESSAGE" )
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [ {
					"title": "More?",
					"buttons": [ {
						"type": "postback",
						"title": "More?",
						"payload": "showMore-" + keyword
					} ],
				} ]
			}
		}
	}
	sendRequest( sender, messageData )
}

function sendRequest( sender, messageData ) {
	request( {
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: {
			access_token: token
		},
		method: 'POST',
		json: {
			recipient: {
				id: sender
			},
			message: messageData,
		}
	}, function( error, response, body ) {
		if ( error ) {
			console.log( 'Error sending messages: ', error )
		} else if ( response.body.error ) {
			console.log( 'Error: ', response.body.error )
		}
	} )
}


/* DB STUFF */


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
	console.log("TITLE: " + title)
	console.log("IN POPULATE")
	Favourites.find(/*{sender: sender},*/ function(err, favourites) {
		clearArrays(sender, titles, subtitles, images, urls)
		if (err) throw err
			console.log( JSON.stringify( favourites, null, 1) );
			for (var index = 0; index < favourites.length; index++) {
					titles.push(favourites[index].meta[0].title)
					subtitles.push(favourites[index].meta[0].subtitle)
					images.push(favourites[index].meta[0].image)
					urls.push(favourites[index].meta[0].url)
					ids.push(favourites[index].id)
			 }

			 	
			 	if (titles.length < 5) {
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
				console.log("ADDED IN " + title + subtitle + image + url)
			})				}
				else {
					sendTextMessage(sender, "Sorry, you can only have 5 items in your favourites list at a time!")
				}
			 
	})
}


//READ ALL
function dbList(sender, titles, subtitles, images, urls) {
	Favourites.find(/*{sender: sender},*/ function(err, favourites) {
		clearArrays(sender, titles, subtitles, images, urls)
		if (err) throw err
			console.log( JSON.stringify( favourites, null, 1) );
			for (var index = 0; index < favourites.length; index++) {
					titles.push(favourites[index].meta[0].title)
					subtitles.push(favourites[index].meta[0].subtitle)
					images.push(favourites[index].meta[0].image)
					urls.push(favourites[index].meta[0].url)

			 }

			 if (titles.length > 0) {
			 	sendGenericMessageTemplateSaved(sender, titles, subtitles, images, urls)
			 }
			 else {
			 	sendTextMessage(sender, "You have no videos saved!")
			 }
	})
}


function dbListRemoveFinal(sender, index) {
	//IDEA: add the given mongodb ID to the end of the remove-, and then just search by id
	// dbListRemove(sender, index)
	// dbRemove(sender, urls, index)
}

function dbListRemove(sender, index) {
	//FIND TO GET TITLES

	Favourites.find(/*{sender: sender},*/ function(err, favourites) {
<<<<<<< HEAD
		console.log("part 1")
		clearArrays(sender, titles, subtitles, images, urls)
		if (err) throw err
			//console.log( JSON.stringify( favourites, null, 1) )
			for (var index1 = 0; index1 < favourites.length; index1++) {
					titles.push(favourites[index1].meta[0].title)
					subtitles.push(favourites[index1].meta[0].subtitle)
					images.push(favourites[index1].meta[0].image)
					urls.push(favourites[index1].meta[0].url)
					console.log("push")
					if (index1 = favourites.length - 1) {
						callback(null, urls)
					}
			 }
	})				
}

=======
		clearArrays(sender, titles, subtitles, images, urls)
		if (err) throw err
			console.log( JSON.stringify( favourites, null, 1) );
			for (var index = 0; index < favourites.length; index++) {
					titles.push(favourites[index].meta[0].title)
					subtitles.push(favourites[index].meta[0].subtitle)
					images.push(favourites[index].meta[0].image)
					urls.push(favourites[index].meta[0].url)
			 }
	})
	console.log("REMOVING: " + urls[index])
	//REMOVE
	Favourites.findOneAndRemove(/*{sender: sender},*/ {url: urls[index]}, function(err) {
		if (err) throw err
			console.log("REMOVED!!!!!!!")
	})
	clearArrays(sender, titles, subtitles, images, urls)

}


>>>>>>> parent of 6fa2fa6... more cleaning up
//REMOVE
function dbRemove(sender, urls, index) {
	console.log("part 2")
	Favourites.findOneAndRemove({url: urls[index]}, function(err) {
		console.log("length: " + urls.length)
		if (err) throw err
		console.log("deleted")
	})
}

function clearArrays( sender, titles, subtitles, images, urls ) {
	titles.length = 0
	subtitles.length = 0
	images.length = 0
	urls.length = 0
}
/* DB STUFF */


module.exports = {
	sendTextMessage: sendTextMessage,
	sendQuickReply: sendQuickReply,
	sendQuickReplyMenu: sendQuickReplyMenu,
	sendGenericMessageTemplate: sendGenericMessageTemplate,
	genericMessageTemplate: genericMessageTemplate,
	storyElement: storyElement,
	sendGenericMessageTemplateSaved: sendGenericMessageTemplateSaved,
	genericMessageTemplateSaved: genericMessageTemplateSaved,
	storyElementSaved: storyElementSaved,
	sendMoreMessage: sendMoreMessage,
	sendRequest: sendRequest,
	dbPopulate: dbPopulate,
	dbList: dbList,
	dbRemove: dbRemove,
	dbListRemove: dbListRemove,
	dbListRemoveFinal: dbListRemoveFinal
}