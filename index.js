'use strict'
const templates = require( "./templates" )
const express = require( 'express' )
const bodyParser = require( 'body-parser' )
const request = require( 'request' )
const app = express()
const math = require( 'mathjs' )
const codepoint = require("./codepoint")
var goMore = false
var YouTube = require( 'youtube-node' )
var youTube = new YouTube()
var async = require( 'async' )
youTube.setKey( 'AIzaSyDxvDFk1sS41kxhWS8YR5etEGlHfkrExrI' )

var titles = []
var subtitles = []
var images = []
var urls = []
var ids = []

var inStories = false
var inSubscribe = false
var isSubscribed = false


var randomList = [ 'monster', 'demon', 'ghost', 'scary', 'vampire', 'help', 'dead', 'animal', 'forever', 'doom', 'death', 'think', 'child', 'person', 'fear' ]
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
	templates.sendErrorMessage(sender)
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
		// if (event.message === undefined) {
		// 	console.log("ATTACHMENTS")
		// 	let defaultMessage1 = "Sorry, I didn't get that!"
		// 	let defaultMessage2 = "What would you like to do?"
		// 	let option1 = "Stories"
		// 	let option2 = "Favourites"
		// 	templates.sendTextMessage(sender, defaultMessage1)
		// 	setTimeout( function() {
		// 		templates.sendQuickReply(sender, defaultMessage2, option1, option2)
		// 	}, 1000)
		// }
		 if ( event.message && event.message.text ) {
			console.log("TEXT")
			let text = event.message.text

			//GREETING
			if ( text === 'Hi' || text === 'Help' || text === 'Menu') {
				let genericGreeting = 'Hey!' + codepoint.happy
				templates.sendTextMessage( sender, genericGreeting )
				setTimeout( function() {
					templates.sendQuickReply( sender, prompt1, option1, option3 )
				}, 1000 )
				let prompt1 = 'What would you like to do?'
				let option1 = 'Stories'
				let option3 = 'Favourites'
			}

			//SEARCH - OPENING
			else if ( text === 'Stories' ) {
				let message = "Do you have a specific topic in mind, or should I surprise you?"
				let option1 = "Keyword"
				let option2 = "Scare me " + codepoint.ghost
				templates.sendQuickReply( sender, message, option1, option2 )
			}
			else if ( text === 'Keyword' ) {
				inStories = true
				templates.sendTextMessage( sender, 'Sure, what word?' )
			}
			else if ( text.includes('Scare me' )) {
				var random = Math.floor( math.random( ( randomList.length - 1 ) ) )
				channelRandomizer()
				youTube.search( randomList[ random ], 10, function( error, result ) {
					if ( error ) {
						console.log( error );
						templates.sendErrorMessage(sender)
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
								ids.push(result.items[i].id.videoId)
								console.log("ID: " + ids[i])
							}
						}

						templates.sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls, ids)
						inStories = false
					}
				} )

				clearArrays( sender, titles, subtitles, images, urls, ids)
			}

			//KEYWORD SEARCH
			else if ( text !== 'Stories' && text !== "Surprise me" && text !== "Keyword" && text != "Sure, what word?" && inStories ) {
				channelRandomizer()
				youTube.search( text, 10, function( error, result ) {
					if ( error ) {
						console.log( error );
						templates.sendErrorMessage(sender)
					} else {
						console.log( JSON.stringify( result, null, 2 ) );
						var message = ""
						for ( var i = 0; i < result.items.length; i++ ) {
							if ( result.items[ i ].id.kind != "youtube#channel" ) {
								var title = result.items[ i ].snippet.title.replace( 'Creepypasta', '' )
								title.replace( '"', '' )
								titles.push( title )
								subtitles.push( result.items[ i ].snippet.description )
								images.push( result.items[ i ].snippet.thumbnails.high.url )
								urls.push( "https://www.youtube.com/watch?v=" + result.items[ i ].id.videoId )
								ids.push("test")
							}
						}

						templates.sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls, ids)
						inStories = false
					}
				} )
				clearArrays( sender, titles, subtitles, images, urls, ids)
					//templates.sendMoreMessage(sender, keyword)

			}

			else if ( text === 'Favourites' ) {
			 	templates.dbList(sender, titles, subtitles, images, urls, ids)
			 }

			else if ( text !== "") {
			let defaultMessage1 = "Sorry, I didn't get that!"
			let defaultMessage2 = "What would you like to do?"
			let option1 = "Stories"
			let option2 = "Favourites"
			templates.sendTextMessage(sender, defaultMessage1)
			setTimeout( function() {
				templates.sendQuickReply(sender, defaultMessage2, option1, option2)
			}, 1000)

		}

		//PAYLOADS
		} else if ( event.postback && event.postback.payload ) {
			console.log("PAYLOAD")
			let payload = event.postback.payload
			if (payload.includes('USER_DEFINED')) {
				console.log("GET STARTED MESSAGE")
				let firstGreeting = "Hello, my name is ScaryBot! I can help you find different creepypastas on youtube!"
				let secondGreeting = "Since this is our first time speaking, let me get you up to speed on what i can do!"
				let thirdGreeting = "I can send you different creepypastas, but you also have the opportunity to 'save' your favourites stories!"
				let fourthGreeting = "If you ever don't know what to do, just type 'Help', to bring up my menu"
				let fifthGreeting = "Now, what would you like to do?"
				let option1 = 'Stories'
				let option2 = 'Favourites'
				sendTextMessage(sender, firstGreeting)
				setTimeout( function() {
					sendTextMessage(sender, secondGreeting)
				}, 1000 )
				setTimeout( function() {
					sendTextMessage(sender, thirdGreeting)
				}, 1000 )
				setTimeout( function() {
					sendTextMessage(sender, fourthGreeting)
				}, 1000 )
				setTimeout( function() {
					sendQuickReply(sender, fifthGreeting, option1, option2)
				}, 1000 )
			}
			else if ( payload.includes( 'MessageSave-' ) ) {
				let indexString = payload.replace( 'MessageSave-', '' )
				console.log("PAYLOAD: " + indexString)

				youTube.getById(indexString, function(error, result) {
  				if (error) {
    				console.log(error);
    				templates.sendErrorMessage(sender)
  				}
  				else {
    				var title = result.items[ 0 ].snippet.title.replace( 'Creepypasta', '' )
					title.replace( '"', '' )
					titles.push( title )
					subtitles.push( result.items[ 0 ].snippet.description )
					images.push( result.items[ 0 ].snippet.thumbnails.high.url )
					urls.push( "https://www.youtube.com/watch?v=" + result.items[ 0 ].id.videoId )
					ids.push(result.items[0].id)
					console.log("ID: " + ids[0])

				setTimeout( function() {
					templates.dbPopulate( sender, title, result.items[ 0 ].snippet.description, result.items[ 0 ].snippet.thumbnails.high.url, "https://www.youtube.com/watch?v=" + result.items[ 0 ].id.videoId)
					clearArrays(sender, titles, subtitles, images, urls, ids)
				}, 4000)
  				}
				})
				
			} else if ( payload.includes( 'SavedRemove' ) ) {
				let indexString = payload.replace( 'SavedRemove', '' )
				let indexValue = parseInt( indexString )
				templates.newDbRemove( sender, indexString)
				templates.sendTextMessage( sender, "Removed!" )
			}
		}

		res.sendStatus( 200 )
	}
} )

function clearArrays( sender, titles, subtitles, images, urls ) {
	titles.length = 0
	subtitles.length = 0
	images.length = 0
	urls.length = 0
	ids.length = 0
}
function sendMessage( sender, titles, subtitles, images, urls ) {
	templates.sendGenericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids)
}

function channelRandomizer() {
	var randomNumber = Math.floor( ( Math.random() * ( 3 - 1 ) + 1 ) )
	if ( randomNumber == 1 ) {
		//creepsMcPasta
		youTube.addParam( 'channelId', 'UCeHGGfhRUiH5wBpjjzbRNXg' )
	} else {
		//mrCreepyPasta
		youTube.addParam( 'channelId', 'UCJMemx7yz_1QwXjHG_rXRhg' )
	}
}
