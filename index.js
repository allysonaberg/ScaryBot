'use strict'
const templates = require( "./templates" )
const express = require( 'express' )
const bodyParser = require( 'body-parser' )
const request = require( 'request' )
const app = express()
const math = require( 'mathjs' )
var goMore = false
var YouTube = require( 'youtube-node' )
var youTube = new YouTube()
youTube.setKey( 'AIzaSyDxvDFk1sS41kxhWS8YR5etEGlHfkrExrI' )

var userInfo = [] //key will be the user id, value will be another dictionary (ie: [alarm?: Bool], [savedList: array], etc...)
var savedDictionary = []
	//saved video object
var savedVideo = []
var titles = []
var subtitles = []
var images = []
var urls = []
var ids = []

var async = require( 'async' )

//var CronJob = require( 'cron' ).CronJob;

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
			if ( text === 'Hi' || text === 'Help' || text === 'Menu') {
				let genericGreeting = 'Hi, my name is Scary Bot. I am your personalized creepyPasta scout!'
				templates.sendTextMessage( sender, genericGreeting )
				setTimeout( function() {
					templates.sendQuickReply( sender, prompt1, option1, option3 )
				}, 1000 )
				let prompt1 = 'What would you like to do?'
				let option1 = 'Stories'
				let option3 = 'Favourites'
			}

			//SEARCH - OPENING
			if ( text === 'Stories' ) {
				let message = "Do you have a specific topic in mind, or should I surprise you?"
				let option1 = "Keyword"
				let option2 = "Surprise me"
				templates.sendQuickReply( sender, message, option1, option2 )
			}
			if ( text === 'Keyword' ) {
				inStories = true
				templates.sendTextMessage( sender, 'Sure, what word?' )
			}
			if ( text === 'Surprise me' ) {
				var random = Math.floor( math.random( ( randomList.length - 1 ) ) )
				channelRandomizer()
				youTube.search( randomList[ random ], 10, function( error, result ) {
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
								ids.push("test")
							}
						}

						templates.sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls, ids)
						inStories = false
					}

				} )

				clearArrays( sender, titles, subtitles, images, urls, ids)
			}

			//KEYWORD SEARCH
			if ( text !== 'Stories' && text !== "Surprise me" && text !== "Keyword" && text != "Sure, what word?" && inStories ) {
				channelRandomizer()
				youTube.search( text, 10, function( error, result ) {
					if ( error ) {
						console.log( error );
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

			if ( text === 'Favourites' ) {
			 	templates.dbList(sender, titles, subtitles, images, urls, ids)
			 }
			 if (text === 'Get Started') {
				console.log("GET STARTED MESSAGE")
				let firstGreeting = "Hello, my name is ScaryBot! I can help you find different creepypastas on youtube!"
				let thirdGreeting = "I can send you different creepypastas, but you also have the opportunity to 'save' your favourites stories!"
				let fourthGreeting = "If you ever don't know what to do, just type 'Help', to bring up my menu"
				let fifthGreeting = "Now, what would you like to do?"
				let option1 = 'Stories'
				let option2 = 'Favourites'
				templates.sendTextMessage(sender, firstGreeting)
				setTimeout( function() {
					templates.sendTextMessage(sender, thirdGreeting)
				}, 1000 )
				setTimeout( function() {
					templates.sendTextMessage(sender, fourthGreeting)
				}, 2000 )
				setTimeout( function() {
					templates.sendQuickReply(sender, fifthGreeting, option1, option2)
				}, 3000 )
			 }


		} else if ( event.postback && event.postback.payload ) {
			let payload = event.postback.payload
			if (payload.includes('GET_STARTED')) {
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
				if ( savedDictionary[ sender ] != undefined && savedDictionary[ sender ].length > 36 ) {
					let message = "Sorry, you can't have more than 10 items in your favourites! Delete one and try again"
					templates.sendTextMessage( sender, message )
				} else {
					let indexString = payload.replace( 'MessageSave-', '' )
					let indexValue = parseInt( indexString )

					savedVideo.push( titles[ indexValue ] )
					savedVideo.push( subtitles[ indexValue ] )
					savedVideo.push( images[ indexValue ] )
					savedVideo.push( urls[ indexValue ] )
					templates.dbPopulate( sender, titles[ indexValue ], subtitles[ indexValue ], images[ indexValue ], urls[ indexValue ], ids[indexValue])
				}
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

const token = "EAADzGu0rDvIBAO7YTXgcDVviPZAU1PIFP6kjvOVpbWXxv9ZBZCV6hCSQ8nbpKGr0RHLJDYQtXfhRpwTX6ZCXtaqnzFoOf0y045loHFKbLYSBHpmVl6WEIdslipuZAdl2CodIZAy9lLVkXDcqdxJ5IgZB9bKYskg3UY95qZBtTZCZA3OgZDZD"

function clearArrays( sender, titles, subtitles, images, urls ) {
	titles.length = 0
	subtitles.length = 0
	images.length = 0
	urls.length = 0
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

module.exports = {
	sendMessage: sendMessage
}
