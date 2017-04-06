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
youTube.addParam('channelId', 'UCJMemx7yz_1QwXjHG_rXRhg' )

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

var randomList = [ 'monster', 'demon', 'ghost', 'scary', 'vampire', 'help', 'dead', 'animal', 'forever', 'doom', 'death', 'think', 'child' ]
app.set( 'port', ( process.env.PORT || 5000 ) )

// Process application/x-www-form-urlencoded
app.use( bodyParser.urlencoded( {
	extended: false
} ) )

// Process application/json
app.use( bodyParser.json() )

// Index route
app.get( '/', function( req, res ) {
	res.send( 'Hello world, I am a chat bot' )
} )

// for Facebook verification
app.get( '/webhook/', function( req, res ) {
	if ( req.query[ 'hub.verify_token' ] === 'allyson' ) {
		res.send( req.query[ 'hub.challenge' ] )
	}
	res.send( 'Error, wrong token' )
} )

// Spin up the server
app.listen( app.get( 'port' ), function() {
	console.log( 'running on port', app.get( 'port' ) )
} )


app.post( '/webhook/', function( req, res ) {
	let messaging_events = req.body.entry[ 0 ].messaging
	for ( let i = 0; i < messaging_events.length; i++ ) {
		let event = req.body.entry[ 0 ].messaging[ i ]
		let sender = event.sender.id
		if ( event.message && event.message.text ) {
			let text = event.message.text

			//GREETING
			if ( text === 'Hi' || text === 'Help' ) {
				let genericGreeting = 'Hi, my name is Scary Bot!'
					//sendTextMessage(sender, genericGreeting)
				let prompt1 = 'What would you like to do?'
				let option1 = 'Stories'
				let option2 = 'Subscribe'
				let option3 = 'Favourites'
				sendQuickReplyMenu( sender, prompt1, option1, option2, option3 )

			}

			//SEARCH - OPENING
			if ( text === 'Stories' ) {
				let message = "Do you have a specific topic in mind, or should i surprise you?"
				let option1 = "Keyword"
				let option2 = "Surprise me"
				sendQuickReply( sender, message, option1, option2 )
			}
			if ( text === 'Keyword' ) {
				inStories = true
				sendTextMessage( sender, 'Sure, what word?' )
			}

			if ( text === 'Surprise me' ) {
				var random = Math.floor( math.random( ( randomList.length - 1 ) ) )
				//youTube.search( randomList[ random ], 15, function( error, result ) {
				youTube.search( randomList[random], 15, function( error, result ) {
					if ( error ) {
						console.log( error );
					} else {
						console.log( JSON.stringify( result, null, 2 ) );
						var message = ""

						for ( var i = 0; i < result.items.length; i++ ) {
							if ( result.items[ i ].id.kind != "youtube#channel" && !( result.items[ i ].snippet.title.includes( "Feelspasta" ) ) ) {
								var title = result.items[ i ].snippet.title.replace( 'Creepypasta', '' )
								title.replace( '"', '' )
								titles.push( title )
								subtitles.push( result.items[ i ].snippet.description )
								images.push( result.items[ i ].snippet.thumbnails.high.url )
								urls.push( "https://www.youtube.com/watch?v=" + result.items[ i ].id.videoId )
							}
						}

						if ( result.items.length > 5 ) {
							sendGenericMessageChanging( sender, titles, subtitles, images, urls )
						}
						else {
							sendGenericMessageSingle(sender, titles, subtitles, images, urls )
						}
						inStories = false
							//sendMoreMessage(sender)
					}

				} )

			}

			//KEYWORD SEARCH
			if ( text !== 'Stories' && text !== "Surprise me" && text !== "Keyword" && text!="Sure, what word?" && inStories ) {
				youTube.search( text, 10, function( error, result ) {
					console.log("searching for" + text)
					if ( error ) {
						console.log( error );
					} else {
						console.log( JSON.stringify( result, null, 2 ) );
						var message = ""
						var titles = []
						var subtitles = []
						var images = []
						var urls = []
						for ( var i = 0; i < result.items.length; i++ ) {
							if ( result.items[ i ].id.kind != "youtube#channel" ) {
								var title = result.items[ i ].snippet.title.replace( 'Creepypasta', '' )
								title.replace( '"', '' )
								titles.push( title )
								subtitles.push( result.items[ i ].snippet.description )
								images.push( result.items[ i ].snippet.thumbnails.high.url )
								urls.push( "https://www.youtube.com/watch?v=" + result.items[ i ].id.videoId )

							}
						}

						if ( result.items.length > 5 ) {
							console.log("about to send generic message template" + urls[0])
							sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls)
						}
						else {
							sendGenericMessageSingle( sender, titles, subtitles, images, urls)
						}
						inStories = false
					}
				} )
			}
			//SUBSCRIBE
			if ( text === 'Subscribe' ) {

				if ( !isSubscribed ) {
					inSubscribe = true
					let message1 = "You can subscribe to daily videos here!\nYou are currently unsubscribed, would you like to be subscribed?"
					let option1 = "Yes"
					let option2 = "No"
					sendQuickReply( sender, message1, option1, option2)
						//sendTextMessage(sender, message2)
				} else {
					let message1 = "You are already subscribed to daily videos, would you like to unsubscribe?"
					let option2 = "Stay subscribed"
					let option1 = "Unsubscribe"
					sendQuickReply( sender, message1, option1, option2 )
				}
			}
			//SUBSCRIBE TIME
			if ( text === 'Yes' && inSubscribe && !isSubscribed ) {
				isSubscribed = true
				console.log( "STARTING job" )
				sendTextMessage( sender, "You are now subscribed" )
				var CronJob = require( 'cron' ).CronJob;
				var job = new CronJob( {
					cronTime: '00 00 9 * * 1-7',
					onTick: function() {
						/*
						 * Runs every weekday (Monday through Friday)
						 * at 11:30:00 AM. It does not run on Saturday
						 * or Sunday.
						 */
						sendTextMessage( sender, "Your daily scary story!" )
						var random = Math.floor( math.random( ( randomList.length - 1 ) ) )

						youTube.search( randomList[ random ], 15, function( error, result ) {
							if ( error ) {
								console.log( error );
							} else {
								console.log( JSON.stringify( result, null, 2 ) );
								var message = ""
								var titles = []
								var subtitles = []
								var images = []
								var urls = []
								for ( var i = 0; i < result.items.length; i++ ) {
									if ( result.items[ i ].id.kind != "youtube#channel" ) {
										var title = result.items[ i ].snippet.title.replace( 'Creepypasta', '' )
										title.replace( '"', '' )
										titles.push( title )
										subtitles.push( result.items[ i ].snippet.description )
										images.push( result.items[ i ].snippet.thumbnails.high.url )
										urls.push( "https://www.youtube.com/watch?v=" + result.items[ i ].id.videoId )

									}
								}

								if ( result.items.length > 5 ) {
									sendGenericMessageLarge( sender, titles, subtitles, images, urls )
								} else {
									sendGenericMessageSingle( sender, titles, subtitles, images, urls )
								}
								inStories = false
									//sendMoreMessage(sender)
							}
						} )
					},
					start: false,
					timeZone: 'America/Toronto'
				} );
				job.start();
			}

			//SAVE TO FAVOURITES
			if (text === 'Save') {
				savedVideo.push(titles[0])
				savedVideo.push(subtitles[0])
				savedVideo.push(images[0])
				saverdideo.push(urls[0])
				// savedVideo[title] = titles[0]
				// savedVideo.subtitle = subtitles[0]
				// savedVideo.image = images[0]
				// savedVideo.url = urls[0]

				savedDictionary[sender] = saverVideo
				console.log(savedDictionary[sender])
				sendTextMessage(sender, "Saved to favourites")
			}

			if (text === 'Favourites') {
				if (savedDictionary[sender] != undefined) {
					sendGenericMessageSaved(sender, savedDictionary)
				}
				else {
					let message = "You don't have any videos saved yet!"
					sendTextMessage(sender, message)
				}
			}


		}

		else if (event.postback && event.postback.payload) {
			let payload = event.postback.payload
			if (payload.includes('MessageSave-')) {
				let indexString = payload.replace('MessageSave-', '')
				let indexValue = parseInt(indexString)

				console.log("saving with index: " + indexValue)
				//saving video
				savedVideo.push(titles[indexValue])
				savedVideo.push(subtitles[indexValue])
				savedVideo.push(images[indexValue])
				savedVideo.push(urls[indexValue])

				savedDictionary[sender] = savedVideo

				console.log(savedDictionary[sender])
				sendTextMessage(sender, "Saved to favourites")
			}
			else if (payload.includes('SavedRemove')) {
				let indexString = payload.replace('SavedRemove', '')
				let indexValue = parseInt(indexString)
				savedVideo.splice(indexValue, 1)
				savedDictionary[sender] = savedVideo
				sendTextMessage(sender, "Removed! Here is your new favourites list: ")
			}
		}
	}

	res.sendStatus( 200 )

} )

const token = "EAADzGu0rDvIBAO7YTXgcDVviPZAU1PIFP6kjvOVpbWXxv9ZBZCV6hCSQ8nbpKGr0RHLJDYQtXfhRpwTX6ZCXtaqnzFoOf0y045loHFKbLYSBHpmVl6WEIdslipuZAdl2CodIZAy9lLVkXDcqdxJ5IgZB9bKYskg3UY95qZBtTZCZA3OgZDZD"

function sendTextMessage( sender, text ) {
	let messageData = {
		text: text
	}
	sendRequest(sender, messageData)
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
	sendRequest(sender, messageData)
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
	sendRequest(sender, messageData)
}

function sendGenericMessageLarge( sender, titles, subtitles, images, urls ) {
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [ {
					"title": titles[ 0 ],
					"subtitle": subtitles[ 0 ],
					"image_url": images[ 0 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 0 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 0
					} ],
				}, {
					"title": titles[ 1 ],
					"subtitle": subtitles[ 1 ],
					"image_url": images[ 1 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 1 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 1
					} ],
				}, {
					"title": titles[ 2 ],
					"subtitle": subtitles[ 2 ],
					"image_url": images[ 2 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 2 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 2
					} ],
				}, {
					"title": titles[ 3 ],
					"subtitle": subtitles[ 3 ],
					"image_url": images[ 3 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 3 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 3
					} ],
				}, {
					"title": titles[ 4 ],
					"subtitle": subtitles[ 4 ],
					"image_url": images[ 4 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 4 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 4
					} ],
				}, {
					"title": titles[ 5 ],
					"subtitle": subtitles[ 5 ],
					"image_url": images[ 5 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 5 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 5
					} ],
				}, {
					"title": titles[ 6 ],
					"subtitle": subtitles[ 6 ],
					"image_url": images[ 6 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 6 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 6
					} ],
				}, {
					"title": titles[ 7 ],
					"subtitle": subtitles[ 7 ],
					"image_url": images[ 7 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 7 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 7
					} ],
				}, {
					"title": titles[ 8 ],
					"subtitle": subtitles[ 8 ],
					"image_url": images[ 8 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 8 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 8
					} ],
				}, {
					"title": titles[ 9 ],
					"subtitle": subtitles[ 9 ],
					"image_url": images[ 9 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 9 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 9
					} ],
				} ]
			}
		}
	}
	sendRequest(sender, messageData)
}

function sendGenericMessageTemplate(sender, result, titles, subtitles, images, urls) {
	console.log("in generic message template")
	let messageData = genericMessageTemplate(sender, result, titles, subtitles, images, urls)
	console.log("URLS: " + urls[0])
	
	sendRequest(sender, messageData)
}
function genericMessageTemplate( sender, result, titles, subtitles, images, urls) {
	console.log("further in")
	var elements = []
	console.log("OUTSIDE with: " + titles.length)
	console.log("URLS: " + urls[0])
	
	for (var xy = 0; xy < titles.length; xy++) {
		console.log("XY IS: " + xy)
		elements.push(storyElement(xy))
	}
    return {
        attachment: {
            type: "template",
            payload: {
                template_type: "generic",
                elements: elements
            }
        }
    }}

function storyElement(xy, result, titles, subtitles, images, urls) { 

	var not_found_image = "http://i.imgur.com/ZZVyknT.png"
    var not_found_url = "http://i.imgur.com/bvuKFZp.png"

    var buttons = [
        {
            type: "web_url",
            url: urls[xy],
            title: "Watch"
        }
    ]
        buttons.push(
            {
                type: "postback",
                title: "Save to favourites",
                payload: "MessageSave-" + xy
            }
        )
  
    return {
        title: titles[xy],
        item_url: urls[xy],
        subtitle: subtitles[xy],
        image_url: images[xy],
        buttons: buttons
    }

   }


function sendGenericMessageSingle( sender, titles, subtitles, images, urls ) {
	console.log("URLS IS: " + urls[0] + "and XY IS: " + xy + "THEREFORE: " + urls[xy])
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [ {
					"title": titles[ 0 ],
					"subtitle": subtitles[ 0 ],
					"image_url": images[ 0 ],
					"buttons": [ {
						"type": "web_url",
						"url": urls[ 0 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Save to favourites",
						"payload":"MessageSave-" + 0
					} ],
				}]
			}
		}
	}
sendRequest(sender, messageData)
}

function sendGenericMessageSaved( sender, savedDictionary) {
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [ {
					"title": savedDictionary[sender][ 0 ],
					"subtitle": savedDictionary[sender][ 1 ],
					"image_url": savedDictionary[sender][ 2 ],
					"buttons": [ {
						"type": "web_url",
						"url": savedDictionary[sender][ 3 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Remove",
						"payload":"SavedRemove" + 0
					} ],
				}, {
					"title": savedDictionary[sender][ 4 ],
					"subtitle": savedDictionary[sender][ 5 ],
					"image_url": savedDictionary[sender][ 6 ],
					"buttons": [ {
						"type": "web_url",
						"url": savedDictionary[sender][ 7 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Remove",
						"payload":"SavedRemove" + 1
					} ],
				}, {
					"title": savedDictionary[sender][ 8 ],
					"subtitle": savedDictionary[sender][ 9 ],
					"image_url": savedDictionary[sender][ 10 ],
					"buttons": [ {
						"type": "web_url",
						"url": savedDictionary[sender][ 11 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Remove",
						"payload":"SavedRemove" + 2
					} ],
				} ]
			}
		}
	}
	sendRequest(sender, messageData)
}

function sendGenericMessageSavedRemove( sender, savedDictionary) {
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [ {
					"title": savedDictionary[sender][ 0 ],
					"subtitle": savedDictionary[sender][ 1 ],
					"image_url": savedDictionary[sender][ 2 ],
					"buttons": [ {
						"type": "web_url",
						"url": savedDictionary[sender][ 3 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Remove",
						"payload":"SavedRemove" + 0
					} ],
				}, {
					"title": savedDictionary[sender][ 4 ],
					"subtitle": savedDictionary[sender][ 5 ],
					"image_url": savedDictionary[sender][ 6 ],
					"buttons": [ {
						"type": "web_url",
						"url": savedDictionary[sender][ 7 ],
						"title": "Watch",
					}, {
						"type":"postback",
						"title":"Remove",
						"payload":"SavedRemove" + 1
					} ],
				}]
			}
		}
	}
	sendRequest(sender, messageData)
}
function sendMoreMessage( sender ) {
	let messageData = {
		"attachment": {
			"type": "template",
			"payload": {
				"template_type": "generic",
				"elements": [ {
					"title": "More?",
					"buttons": [ {
						"type": "web_url",
						"url": "www.facebook.com",
						"title": "Yes",
					} ],
				} ]
			}
		}
	}
	sendRequest(sender, messageData)
}

function sendRequest(sender, messageData) {
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

