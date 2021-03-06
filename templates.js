'use strict'

const express = require( 'express' )
const bodyParser = require( 'body-parser' )
const request = require( 'request' )
const app = express()
const math = require( 'mathjs' )
const codepoint = require( "./codepoint" )
const Facebook = require( 'facebook-node-sdk' )

var facebook = new Facebook( {
	appId: process.env.FB_APPID,
	secret: process.env.FB_SECRET
} )
var async = require( "async" )

var YouTube = require( 'youtube-node' )
var youTube = new YouTube()
youTube.setKey( process.env.YOUTUBE_TOKEN )
youTube.addParam( 'channelId', 'UCeHGGfhRUiH5wBpjjzbRNXg' )

//saved video object
var savedVideo = []
var titles = []
var subtitles = []
var images = []
var urls = []
var ids = []
var name = ""

var inStories = false
var mongoose = require( 'mongoose' )
var Schema = mongoose.Schema
var url = process.env.MONGOLAB_URI
var fbToken = process.env.FB_PAGE_ACCESS_TOKEN
mongoose.connect( url )

app.set( 'port', ( process.env.PORT || 5000 ) )

function sendTextMessage( sender, text ) {
	let messageData = {
		text: text
	}
	sendRequest( sender, messageData )
}

function sendQuickReply( sender, message, option1, option2 ) {
	let messageData = {
		text: message,
		quick_replies: [ {
			content_type: "text",
			title: option1,
			payload: option1
		}, {
			content_type: "text",
			title: option2,
			payload: option2
		} ]
	}
	sendRequest( sender, messageData )
}


/* REGULAR MESSAGES */
function sendGenericMessageTemplate( sender, results, titles, subtitles, images, urls, ids ) {
	let messageData = genericMessageTemplate( sender, results, titles, subtitles, images, urls, ids )

	sendRequest( sender, messageData )
}

function genericMessageTemplate( sender, results, titles, subtitles, images, urls, ids ) {
	var elements = []

	for ( var xy = 0; xy < titles.length && xy < 10; xy++ ) {
		elements.push( storyElement( xy, results, titles, subtitles, images, urls, ids, function( err, result ) {
			if ( err ) {
				console.log( "error" )
				sendErrorMessage( sender )
			}

		} ) )
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

function storyElement( xy, results, titles, subtitles, images, urls, ids ) {

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
		payload: "MessageSave-" + ids[ xy ]
	} )

	return {
		title: titles[ xy ],
		item_url: urls[ xy ],
		//subtitle: subtitles[ xy ],
		image_url: images[ xy ],
		buttons: buttons
	}

}


/* SAVED MESSAGES */
function sendGenericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids ) {
	let messageData = genericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids )
	sendRequest( sender, messageData )

}

function genericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids ) {
	var elements = []
	for ( var xy = 0; xy < ( titles.length ); xy++ ) {
		elements.push( storyElementSaved( xy, sender, titles, subtitles, images, urls, ids ) )
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

function storyElementSaved( xy, sender, titles, subtitles, images, urls, ids ) {

	var buttons = [ {
		type: "web_url",
		url: urls[ xy ],
		title: "Watch"
	} ]
	buttons.push( {
		type: "postback",
		title: "Remove",
		payload: "SavedRemove" + ids[ xy ]
	} )

	return {
		title: titles[ xy ],
		item_url: urls[ xy ],
		image_url: images[ xy ],
		buttons: buttons
	}

}


function sendMoreMessage( sender, keyword ) {
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
			access_token: fbToken
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
			sendErrorMessage( sender )
		} else if ( response.body.error ) {
			console.log( 'Error: ', response.body.error )
		}
	} )
}


/* DB STUFF */


var favouritesSchema = new Schema( {
	meta: [ {
		sender: String,
		title: String,
		subtitle: String,
		image: String,
		url: String
	} ]
} )

var Favourites = mongoose.model( 'Favourites', favouritesSchema )
module.exports = Favourites

//CREATE
function dbPopulate( sender, title, subtitle, image, url ) {
	Favourites.find( {}, function( err, favourites ) {
		clearArrays( sender, titles, subtitles, images, urls )
		if ( err ) {
			sendErrorMessage( sender )
			throw err
		} else {
			//console.log( JSON.stringify( favourites, null, 1 ) );

			if ( favourites != undefined ) {
				for ( var index = 0; index < favourites.length; index++ ) {
					if ( favourites[ index ].meta[ 0 ].sender == sender ) {
						titles.push( favourites[ index ].meta[ 0 ].title )
							//subtitles.push( favourites[ index ].meta[ 0 ].subtitle )
						images.push( favourites[ index ].meta[ 0 ].image )
						urls.push( favourites[ index ].meta[ 0 ].url )
					}
				}
			}

			if ( titles.length < 5 ) {
				var user = Favourites( {
						meta: [ {
							sender: sender,
							title: title,
							subtitle: subtitle,
							image: image,
							url: url
						} ]
					} )
					//console.log( "SAVING: " + sender, title, subtitle, image, url )


				user.save( function( err ) {
					if ( err ) {
						sendErrorMessage( sender )
						console.log( "ERROR:" + err )
					} else {
						sendTextMessage( sender, "Saved!" )
					}
				} )
			} else {
				sendTextMessage( sender, "Sorry, you can only have 5 items in your favourites list at a time!" )
			}
		}
	} )
}


//READ ALL
function dbList( sender, titles, subtitles, images, urls, ids ) {
	Favourites.find( {}, function( err, favourites ) {
		clearArrays( sender, titles, subtitles, images, urls, ids )
		if ( err ) {
			sendErrorMessage( sender )
			throw err
		} else {
			//console.log( JSON.stringify( favourites, null, 1 ) );
			for ( var index = 0; index < favourites.length; index++ ) {
				if ( favourites[ index ].meta[ 0 ].sender == sender ) {
					titles.push( favourites[ index ].meta[ 0 ].title )
					subtitles.push( favourites[ index ].meta[ 0 ].subtitle )
					images.push( favourites[ index ].meta[ 0 ].image )
					urls.push( favourites[ index ].meta[ 0 ].url )
					ids.push( favourites[ index ].id )
				}
			}

			if ( titles.length > 0 ) {
				sendGenericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids )
			} else {
				sendTextMessage( sender, "You have no videos saved!" )
			}
		}
	} )
}


function newDbRemove( sender, index ) {
	Favourites.findByIdAndRemove( index, function( err ) {
		if ( err ) {
			sendErrorMessage( sender )
			throw err
		} else {
			console.log( "REMOVED" )
		}
	} )

}

function clearArrays( sender, titles, subtitles, images, urls, ids ) {
	titles.length = 0
	subtitles.length = 0
	images.length = 0
	urls.length = 0
	if ( ids != undefined ) {
		ids.length = 0
	}
}

function sendErrorMessage( sender ) {
	var errorMessage = "Sorry, something went wrong! Please try again!"
	sendTextMessage( sender, errorMessage )
}


module.exports = {
	sendTextMessage: sendTextMessage,
	sendQuickReply: sendQuickReply,
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
	newDbRemove: newDbRemove,
	sendErrorMessage: sendErrorMessage
}

