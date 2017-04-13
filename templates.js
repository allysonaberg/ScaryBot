'use strict'

const express = require( 'express' )
const bodyParser = require( 'body-parser' )
const request = require( 'request' )
const app = express()
const math = require( 'mathjs' )
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

var CronJob = require( 'cron' ).CronJob;


var inStories = false
var inSubscribe = false
var isSubscribed = false

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
function sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls ) {
	let messageData = genericMessageTemplate( sender, result, titles, subtitles, images, urls )

	sendRequest( sender, messageData )
}

function genericMessageTemplate( sender, result, titles, subtitles, images, urls ) {
	var elements = []

	for ( var xy = 0; xy < titles.length && xy < 10; xy++ ) {
		elements.push( storyElement( xy, result, titles, subtitles, images, urls ) )
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

function storyElement( xy, result, titles, subtitles, images, urls ) {

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
		payload: "MessageSave-" + xy
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
function sendGenericMessageTemplateSaved( sender, titles, subtitles, images, urls ) {
	console.log("step 1")
	let messageData = genericMessageTemplateSaved( sender, titles, subtitles, images, urls)

	sendRequest( sender, messageData )
}

function genericMessageTemplateSaved( sender, titles, subtitles, images, urls) {
	console.log("step 2")
	var elements = []
	console.log("IN ")
	console.log("LENGTH: " + titles.length)
	for ( var xy = 0; xy < ( titles.length); xy++ ) {
		console.log("XY: " + xy)
		elements.push( storyElementSaved( xy, sender, titles, subtitles, images, urls) )
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

	console.log("step 3")
	var buttons = [ {
		type: "web_url",
		url: urls[xy],
		title: "Watch"
	} ]
	buttons.push( {
		type: "postback",
		title: "Remove",
		payload: "SavedRemove" + xy
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
	sendRequest: sendRequest
}