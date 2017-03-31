'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
var YouTube = require('youtube-node')
var youTube = new YouTube()
youTube.setKey('AIzaSyDxvDFk1sS41kxhWS8YR5etEGlHfkrExrI')

app.set('port', (process.env.PORT || 5000))

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Index route
app.get('/', function (req, res) {
	res.send('Hello world, I am a chat bot')
})

// for Facebook verification
app.get('/webhook/', function (req, res) {
	if (req.query['hub.verify_token'] === 'allyson') {
		res.send(req.query['hub.challenge'])
	}
	res.send('Error, wrong token')
})

// Spin up the server
app.listen(app.get('port'), function() {
	console.log('running on port', app.get('port'))
})


app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
	    let event = req.body.entry[0].messaging[i]
	    let sender = event.sender.id
	    if (event.message && event.message.text) {
		    let text = event.message.text
		    if (text === 'Search') {
		    	  youTube.search('creepypasta', 15, function(error, result) {
  				if (error) {
    				console.log(error);
  				}
  				else {
    				console.log(JSON.stringify(result, null, 2));
    				var message = ""
    				var titles = []
    				var subtitles = []
    				var images = []
    				var urls = []
    				for (var i = 0; i < result.items.length; i++) {
      				if (result.items[i].id.kind != "youtube#channel") {
        					//message += result.items[i].snippet.title + "\n\n"
        					var title = result.items[i].snippet.title.replace('Creepypasta','')
        					title.replace('"', '')
        					titles.push(title)
        					subtitles.push(result.items[i].snippet.description)
        					images.push(result.items[i].snippet.thumbnails.high.url)
        					urls.push("https://www.youtube.com/watch?v=" + result.items[i].id.videoId)
      						}
    					}
    					sendGenericMessage(sender, titles, subtitles, images, urls, 1)
    					sendQuickReply(sender)
      					}

    					})
		    				}
	    				}
    				}
    				res.sendStatus(200)
				})

const token = "EAADzGu0rDvIBAO7YTXgcDVviPZAU1PIFP6kjvOVpbWXxv9ZBZCV6hCSQ8nbpKGr0RHLJDYQtXfhRpwTX6ZCXtaqnzFoOf0y045loHFKbLYSBHpmVl6WEIdslipuZAdl2CodIZAy9lLVkXDcqdxJ5IgZB9bKYskg3UY95qZBtTZCZA3OgZDZD"

function sendTextMessage(sender, text) {
    let messageData = { text:text }
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
		json: {
		    recipient: {id:sender},
			message: messageData,
		}
	}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}

function sendQuickReply(sender) {
	console.log("SENDING QUICK REPLY")
	let messageData = {
	message: {
  		text: 'Pick a color:',
  	quick_replies: [
    	{ content_type: 'text', title: 'red', payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_RED' },
    	{ content_type: 'text', title: 'green', payload: 'DEVELOPER_DEFINED_PAYLOAD_FOR_PICKING_GREEN' }
  	]
	}	
			}, function(error, response, body) {
		if (error) {
		    console.log('Error sending messages: ', error)
		} else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })

		}
function sendGenericMessage(sender, titles, subtitles, images, urls, i) {
    let messageData = {
	    "attachment": {
		    "type": "template",
		    "payload": {
				"template_type": "generic",
			    "elements": [{
					"title": titles[0],
				    "subtitle": subtitles[0],
				    "image_url": images[0],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[0],
					    "title": "watch",
				    }],
			    }, {
				    "title": titles[1],
				    "subtitle": subtitles[1],
				    "image_url": images[1],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[1],
					    "title": "watch",
				    }],
				}, {
				    "title": titles[2],
				    "subtitle": subtitles[2],
				    "image_url": images[2],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[2],
					    "title": "watch",
				    }],
			    }]
		    }
    }
}
    request({
	    url: 'https://graph.facebook.com/v2.6/me/messages',
	    qs: {access_token:token},
	    method: 'POST',
	    json: {
		    recipient: {id:sender},
		    message: messageData,
	    }
    }, function(error, response, body) {
	    if (error) {
		    console.log('Error sending messages: ', error)
	    } else if (response.body.error) {
		    console.log('Error: ', response.body.error)
	    }
    })
}
