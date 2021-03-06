//NOTE: FINAL VERSION ON DEVELOP BRANCH, ALL IMPROVEMENTS TO BE MADE ON SEP. BRANCH
'use strict'
const templates = require( "./templates" )
const express = require( 'express' )
const bodyParser = require( 'body-parser' )
const request = require( 'request' )
const app = express()
const math = require( 'mathjs' )
const codepoint = require( "./codepoint" )
var fbToken = process.env.FB_PAGE_ACCESS_TOKEN
var goMore = false
var YouTube = require( 'youtube-node' )
var youTube = new YouTube()
var async = require( 'async' )
youTube.setKey( process.env.YOUTUBE_TOKEN )

var titles = []
var subtitles = []
var images = []
var urls = []
var ids = []
var inStories = false
var name = ""
app.set( 'port', ( process.env.PORT || 5000 ) )

app.use( bodyParser.urlencoded( {
	extended: false
} ) )

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
	templates.sendErrorMessage( sender )
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


		if ( event.message && event.message.sticker_id ) {
			setTimeout( function() {
				var random = Math.floor( math.random( ( codepoint.noUnderstandList.length - 1 ) ) )
				let defaultMessage1 = codepoint.noUnderstandList[ random ]
				let defaultMessage2 = "What would you like to do?"
				let option1 = "Stories"
				let option2 = "Favourites"
				templates.sendTextMessage( sender, defaultMessage1 )
				setTimeout( function() {
					templates.sendQuickReply( sender, defaultMessage2, option1, option2 )
				}, 1000 )
			}, 2000 )

		}
		if ( event.message && event.message.text && !event.message.is_echo ) {
			let text = event.message.text.toLowerCase()

			//GREETING
			if ( !inStories && (text.includes("hey") || text.includes("hello") || text.includes("help") || text.includes("sup") || text.includes("play") || text.includes("start") || text.includes("hi")) ) {
				getUserName( sender )

				setTimeout( function() {
					var greetingsList = [ "Hey " + name + " " + codepoint.happy, "Hey there " + name + " " + codepoint.pumpkin ]
					var random = Math.floor( math.random() * ( greetingsList.length ) )
					let genericGreeting = greetingsList[ random ]
					templates.sendTextMessage( sender, genericGreeting )
					setTimeout( function() {
						templates.sendQuickReply( sender, prompt1, option1, option3 )
					}, 1000 )
					let prompt1 = 'What would you like to do?'
					let option1 = 'Stories'
					let option3 = 'Favourites'
				}, 200 )

			}

			//SEARCH - OPENING
			else if ( text === 'stories' ) {
				let message = "Do you have a specific topic in mind, or should I surprise you?"
				let option2 = "Keyword"
				let option1 = "Scare me " + codepoint.ghost
				templates.sendQuickReply( sender, message, option1, option2 )
			} else if ( text === 'keyword' ) {
				inStories = true
				templates.sendTextMessage( sender, 'Sure, what word?' )
			}
			//SCARE ME
			else if ( text.includes( 'scare me' ) ) {
				var random = Math.floor( math.random() * ( codepoint.randomList.length ) )
				channelRandomizer()
				youTube.search( codepoint.randomList[ random ], 10, function( error, result ) {
					if ( error ) {
						console.log( error );
						templates.sendErrorMessage( sender )
					} else {
						//console.log( JSON.stringify( result, null, 2 ) );
						var message = ""

						for ( var i = 0; i < result.items.length; i++ ) {
							if ( result.items[ i ].id.kind != "youtube#channel" && !( result.items[ i ].snippet.title.includes( "Feelspasta" ) ) ) {
								var title = result.items[ i ].snippet.title.replace( 'Creepypasta', '' )
								title.replace( '"', '' )
								titles.push( title )
								subtitles.push( result.items[ i ].snippet.description )
								images.push( result.items[ i ].snippet.thumbnails.high.url )
								urls.push( "https://www.youtube.com/watch?v=" + result.items[ i ].id.videoId )
								ids.push( result.items[ i ].id.videoId )
							}
						}

						templates.sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls, ids )
						inStories = false
					}
				} )

				clearArrays( sender, titles, subtitles, images, urls, ids )
			}

			//KEYWORD SEARCH
			else if ( text !== 'stories' && text !== "surprise me" && text !== "keyword" && text != "sure, what word?" && inStories ) {
				channelRandomizer()
				youTube.search( text, 10, function( error, result ) {
					if ( error ) {
						console.log( error );
						templates.sendErrorMessage( sender )
					} else {
						//console.log( JSON.stringify( result, null, 2 ) );
						var message = ""
						for ( var i = 0; i < result.items.length; i++ ) {
							if ( result.items[ i ].id.kind !== "youtube#channel" ) {
								var title = result.items[ i ].snippet.title.replace( 'Creepypasta', '' )
								title.replace( '"', '' )
								titles.push( title )
								subtitles.push( result.items[ i ].snippet.description )
								images.push( result.items[ i ].snippet.thumbnails.high.url )
								urls.push( "https://www.youtube.com/watch?v=" + result.items[ i ].id.videoId )
								ids.push( result.items[ i ].id.videoId )
							}
						}

						templates.sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls, ids )
						inStories = false
					}
				} )
				clearArrays( sender, titles, subtitles, images, urls, ids )
					//templates.sendMoreMessage(sender, keyword)

			} else if ( text === 'favourites' ) {
				templates.dbList( sender, titles, subtitles, images, urls, ids )
			}

			//goodbye messages
			else if ( !inStories && ( text === 'bye' || text === 'goodbye' || text === 'stop' ) ) {
				let byMessage = 'Ok, lets talk later! Bye!'
				templates.sendTextMessage( sender, byMessage )
			} else if ( text !== "" ) {
				var random = Math.floor( math.random() * ( codepoint.noUnderstandList.length ) )
				let defaultMessage1 = codepoint.noUnderstandList[ random ]
				let defaultMessage2 = "What would you like to do?"
				let option1 = "Stories"
				let option2 = "Favourites"
				templates.sendTextMessage( sender, defaultMessage1 )
				setTimeout( function() {
					templates.sendQuickReply( sender, defaultMessage2, option1, option2 )
				}, 1000 )

			}

			//PAYLOADS
		} else if ( event.postback && event.postback.payload ) {
			let payload = event.postback.payload
			if ( payload.includes( 'USER_DEFINED' ) ) {
				let firstGreeting = "Hello, my name is ScaryBot! I can help you find different creepypastas on youtube!"
				let fourthGreeting = "If you ever don't know what to do, just type 'Help', or use the menu below!"
				let fifthGreeting = "Now, what would you like to do?"
				let option1 = 'Stories'
				let option2 = 'Favourites'
				templates.sendTextMessage( sender, firstGreeting )
				setTimeout( function() {
					templates.sendTextMessage( sender, fourthGreeting )
				}, 1000 )
				setTimeout( function() {
					templates.sendQuickReply( sender, fifthGreeting, option1, option2 )
				}, 2000 )
			} else if ( payload.includes( 'MessageSave-' ) ) {
				let indexString = payload.replace( 'MessageSave-', '' )

				youTube.getById( indexString, function( error, result ) {
					if ( error ) {
						console.log( error );
						templates.sendErrorMessage( sender )
					} else {
						//console.log( "result" + JSON.stringify( result, null, 2 ) )
						function secondFunction( callback ) {
							var title = result.items[ 0 ].snippet.title.replace( 'Creepypasta', '' )
							title.replace( '"', '' )
							titles.push( title )
							subtitles.push( result.items[ 0 ].snippet.description )
							images.push( result.items[ 0 ].snippet.thumbnails.high.url )
							urls.push( "https://www.youtube.com/watch?v=" + result.items[ 0 ].id.videoId )
							ids.push( result.items[ 0 ].id )
							callback( sender, title, result.items[ 0 ].snippet.description, result.items[ 0 ].snippet.thumbnails.high.url, "https://www.youtube.com/watch?v=" + result.items[ 0 ].id )
						}

						function firstFunction() {
							templates.dbPopulate( sender, title, result.items[ 0 ].snippet.description, result.items[ 0 ].snippet.thumbnails.high.url, "https://www.youtube.com/watch?v=" + result.items[ 0 ].id )
						}
						secondFunction( templates.dbPopulate )

						setTimeout( function() {
							clearArrays( sender, titles, subtitles, images, urls )
						}, 5000 )
					}
				} )

			} else if ( payload.includes( 'SavedRemove' ) ) {
				let indexString = payload.replace( 'SavedRemove', '' )
				let indexValue = parseInt( indexString )
				templates.newDbRemove( sender, indexString )
				templates.sendTextMessage( sender, "Removed!" )
			}
			//persistent menu
			else if ( payload.includes( 'menu' ) ) {
				//do stuff for the persistent menu
				getUserName( sender )
				setTimeout( function() {
					var greetingsList = [ "Hey " + name + " " + codepoint.happy, "Hey there " + name + " " + codepoint.pumpkin ]
					var random = Math.floor( math.random() * ( greetingsList.length ) )
					let genericGreeting = greetingsList[ random ]
					templates.sendTextMessage( sender, genericGreeting )
					setTimeout( function() {
						templates.sendQuickReply( sender, prompt1, option1, option3 )
					}, 1000 )
					let prompt1 = 'What would you like to do?'
					let option1 = 'Stories'
					let option3 = 'Favourites'
				}, 200 )
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
	templates.sendGenericMessageTemplateSaved( sender, titles, subtitles, images, urls, ids )
}

function channelRandomizer() {
	var random = Math.floor( math.random( ( codepoint.channels.length - 1 ) ) )
	var channel = codepoint.channels[ random ]
	youTube.addParam( 'channelId', channel )
}

function getUserName( sender ) {
	request.get( {
		headers: {
			'content-type': 'application/x-www-form-urlencoded'
		},
		url: "https://graph.facebook.com/v2.6/" + sender + "?fields=first_name&access_token=" + fbToken,
	}, function( err, response, body ) {
		if ( err ) {
			return err
		}
		name = JSON.parse( body ).first_name
	} )
}