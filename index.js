//RESET TO HARD
'use strict'
const templates = require( "./templates" )
const express = require( 'express' )
const bodyParser = require( 'body-parser' )
const request = require( 'request' )
const app = express()
const math = require( 'mathjs' )
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

//var CronJob = require( 'cron' ).CronJob;

/* DB STUFF*/

var mongoose = require('mongoose')
var Schema = mongoose.Schema
var url = process.env.MONGOLAB_URI
mongoose.connect(url)

var favouritesSchema = new Schema({[
	sender: String,
	meta: [{
		title: String,
		subtitle: String,
		image: String,
		url: String
	}]
]})

var Favourites = mongoose.model('Favourites', favouritesSchema)

module.exports = Favourites

function dbPopulate(sender, title, subtitle, image, url) {
	var user = Favourites({ [
		sender: "sender",
		meta:[{
			title: "title",
			subtitle: "subtitle",
			image: "image",
			url: "url"
		}]
	]})

	user.save(function(err) {
	if (err) console.log("ERROR:" + err)
		console.log("ADDED IN!!!")
	})
}

//function dbChange(sender, title, subtitle, image, url)

//READ ALL
function dbList() {
	Favourites.find({}, function(err, favourites) {
		if (err) throw err
			console.log( JSON.stringify( favourites, null, 2 ) );
			savedVideo.length = 0
			for (var index = 0; index < favourites.length; index++) {

			}
	})
}

//READ ONE
// Favourites.find({name: 'TESTTITLE'}, function(err, user) {
// 	if (err) throw err
// 	console.log(user)
// })

//FIND AND UPDATE

/* DB SUTFF */



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
			if ( text === 'Hi' || text === 'Help' || text === 'Menu' ) {
				let genericGreeting = 'Hi, my name is Scary Bot. I am your personalized creepyPasta scout!'
				templates.sendTextMessage( sender, genericGreeting )
				setTimeout( function() {
					templates.sendQuickReplyMenu( sender, prompt1, option1, option2, option3 )
				}, 1000 )
				let prompt1 = 'What would you like to do?'
				let option1 = 'Stories'
				let option2 = 'Subscribe'
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

			if (text === 'Db') {
				//dbPopulate(sender, "title", "subtitle", "image", "url")
						console.log("SENDER: " + sender)

				dbList()
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
							}
						}

						templates.sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls )
						inStories = false
					}

				} )

				clearArrays( sender, titles, subtitles, images, urls )

			}

			//KEYWORD SEARCH
			if ( text !== 'Stories' && text !== "Surprise me" && text !== "Keyword" && text != "Sure, what word?" && inStories ) {
				channelRandomizer()
				youTube.search( text, 10, function( error, result ) {
					console.log( "searching for" + text )
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

						templates.sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls )

						inStories = false
					}
				} )
				clearArrays( sender, titles, subtitles, images, urls )
					//templates.sendMoreMessage(sender, keyword)

			}
			//SUBSCRIBE
			if ( text === 'Subscribe' ) {

				if ( !isSubscribed ) {
					inSubscribe = true
					let message1 = "You can subscribe to daily videos here!"
					let message2 = "You are currently unsubscribed, would you like to be subscribed?"
					let option1 = "Yes"
					let option2 = "No"
					templates.sendTextMessage( sender, message1 )
					setTimeout( function() {
						templates.sendQuickReply( sender, message2, option1, option2 )
					}, 1000 )

				} else {
					let message1 = "You are already subscribed to daily videos, would you like to unsubscribe?"
					let option2 = "Stay subscribed"
					let option1 = "Unsubscribe"
					templates.sendQuickReply( sender, message1, option1, option2 )

				}
			}
			//SUBSCRIBE TIME
			if ( text === 'Yes' && inSubscribe && !isSubscribed ) {
				isSubscribed = true
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

						channelRandomizer()
						youTube.search( randomList[ random ], 10, function( error, result ) {
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

								templates.sendGenericMessageTemplate( sender, result, titles, subtitles, images, urls )

								inStories = false
							}
						} )
					},
					start: false,
					timeZone: 'America/Toronto'
				} );
				job.start();
			}

			if ( text === 'Favourites' ) {
				if ( savedDictionary[ sender ] != undefined && savedDictionary[ sender ].length > 0 ) {
					templates.sendGenericMessageTemplateSaved( sender, savedDictionary )
				} else {
					let message = "You don't have any videos saved!"
					templates.sendTextMessage( sender, message )
				}
			}


		} else if ( event.postback && event.postback.payload ) {
			let payload = event.postback.payload
			if ( payload.includes( 'MessageSave-' ) ) {
				if ( savedDictionary[ sender ] !== undefined ) {
					console.log( "INDEX: " + savedDictionary[ sender ].length )
				}
				if ( savedDictionary[ sender ] != undefined && savedDictionary[ sender ].length > 36 ) {
					let message = "Sorry, you can't have more than 10 items in your favourites! Delete one and try again"
					templates.sendTextMessage( sender, message )
				} else {
					let indexString = payload.replace( 'MessageSave-', '' )
					let indexValue = parseInt( indexString )

					console.log( "saving with index: " + indexValue )
						//saving video
					savedVideo.push( titles[ indexValue ] )
					savedVideo.push( subtitles[ indexValue ] )
					savedVideo.push( images[ indexValue ] )
					savedVideo.push( urls[ indexValue ] )

					savedDictionary[ sender ] = savedVideo

					console.log( savedDictionary[ sender ] )
					templates.sendTextMessage( sender, "Saved to favourites" )
				}
			} else if ( payload.includes( 'SavedRemove' ) ) {
				let indexString = payload.replace( 'SavedRemove', '' )
				let indexValue = parseInt( indexString )
				savedVideo.splice( ( 4 * indexValue ), 4 )
				savedDictionary[ sender ] = savedVideo
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

function channelRandomizer() {
	var randomNumber = Math.floor( ( Math.random() * ( 3 - 1 ) + 1 ) )
	console.log( "NUMBER: " + randomNumber )
	if ( randomNumber == 1 ) {
		//creepsMcPasta
		youTube.addParam( 'channelId', 'UCeHGGfhRUiH5wBpjjzbRNXg' )
	} else {
		//mrCreepyPasta
		youTube.addParam( 'channelId', 'UCJMemx7yz_1QwXjHG_rXRhg' )
	}
}
