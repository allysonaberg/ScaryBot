'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const math = require('mathjs')
var YouTube = require('youtube-node')
var youTube = new YouTube()
youTube.setKey('AIzaSyDxvDFk1sS41kxhWS8YR5etEGlHfkrExrI')
youTube.addParam('channelId', 'UCeHGGfhRUiH5wBpjjzbRNXg')

var CronJob = require('cron').CronJob;


var inStories = false
var inSubscribe = false

var randomList = ['monster', 'demon', 'ghost', 'scary', 'vampire', 'help', 'dead', 'animal', 'forever', 'doom', 'death', 'think', 'child']
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

		    //GREETING
		    if (text === 'Hi') {
		    	let genericGreeting = 'Hi, my name is Scary Bot!'
		    	//sendTextMessage(sender, genericGreeting)
		    	let prompt1 = 'What would you like to do?'
		    	let option1 = 'Stories'
		    	let option2 = 'Subscribe'
		    	let option3 = 'Favourites'
		    	sendQuickReplyMenu(sender, prompt1, option1, option2, option3)

		    }
		    //SEARCH - OPENING
		    if (text === 'Stories') {
		    	let message = "Do you have a specific topic in mind, or should i surprise you?"
		    	let option1 = "Keyword"
		    	let option2 = "Surprise me"
		    	sendQuickReply(sender, message, option1, option2)			
		    }
		    if (text === 'Keyword') {
		    	inStories = true
		    	sendTextMessage(sender, 'Sure, what word?')
		    }

		    if (text === 'Surprise me') {
		    	var random = Math.floor(math.random((randomList.length - 1)))
		    	youTube.search(randomList[random], 15, function(error, result) {
		    		console.log("CALL 1")
		    				    		console.log("TEXT IS: " + text)

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
      				if (result.items[i].id.kind != "youtube#channel" && !(result.items[i].snippet.title.includes("Feelspasta"))) {
        					var title = result.items[i].snippet.title.replace('Creepypasta','')
        					title.replace('"', '')
        					titles.push(title)
        					subtitles.push(result.items[i].snippet.description)
        					images.push(result.items[i].snippet.thumbnails.high.url)
        					urls.push("https://www.youtube.com/watch?v=" + result.items[i].id.videoId)
      						}
    					}
    					
    					if (result.items.length > 5) {
    					sendGenericMessageLarge(sender, titles, subtitles, images, urls)
    					}
    					else {
    					sendGenericMessageSmall(sender, titles, subtitles, images, urls)
    					}    					
    					inStories = false
    					//sendMoreMessage(sender)
      				}
    			})
		    }

		    //KEYWORD SEARCH
		    if (text !=='Stories' && text !== "Surprise me" && text !== "Keyword" && inStories) {
		    	youTube.search(text, 15, function(error, result) {
		    		console.log("TEXT IS: " + text)
		    		console.log("CALL 2")
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
        					var title = result.items[i].snippet.title.replace('Creepypasta','')
        					title.replace('"', '')
        					titles.push(title)
        					subtitles.push(result.items[i].snippet.description)
        					images.push(result.items[i].snippet.thumbnails.high.url)
        					urls.push("https://www.youtube.com/watch?v=" + result.items[i].id.videoId)

      						}
    					}
    					
    					if (result.items.length > 5) {
    					sendGenericMessageLarge(sender, titles, subtitles, images, urls)
    					}
    					else {
    					sendGenericMessageSmall(sender, titles, subtitles, images, urls)
    					}
    					inStories = false
    					//sendMoreMessage(sender)
      				}
    			})

		    }
		    //SUBSCRIBE
		    if (text === 'Subscribe') {
		    	inSubscribe = true
		    	let message1 = "You can subscribe to daily videos here! Shall we get started?"
		    	let message2 = "What time would you like to receive these messages?"
		    	sendTextMessage(sender, message1)
		    	sendTextMessage(sender, message2)
		    }

		    //SUBSCRIBE TIME
		    if (text !== 'Subscribe' && inSubscribe) {
		    	console.log("STARTING job")
			var CronJob = require('cron').CronJob;
			var job = new CronJob({ cronTime: '00 47 8 * * 1-5',
  			onTick: function() {
    			/*
     			* Runs every weekday (Monday through Friday)
    			 * at 11:30:00 AM. It does not run on Saturday
    			 * or Sunday.
    			 */
    			youTube.search(text, 15, function(error, result) {
		    	console.log("TEXT IS: " + text)
		    	console.log("IN JOB")
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
        					var title = result.items[i].snippet.title.replace('Creepypasta','')
        					title.replace('"', '')
        					titles.push(title)
        					subtitles.push(result.items[i].snippet.description)
        					images.push(result.items[i].snippet.thumbnails.high.url)
        					urls.push("https://www.youtube.com/watch?v=" + result.items[i].id.videoId)

      						}
    					}
    					
    					if (result.items.length > 5) {
    					sendGenericMessageLarge(sender, titles, subtitles, images, urls)
    					}
    					else {
    					sendGenericMessageSmall(sender, titles, subtitles, images, urls)
    					}
    					inStories = false
    					//sendMoreMessage(sender)
      				}
    			})
  			},
  			start: false,
  			timeZone: 'America/Los_Angeles'
			});
			job.start();
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

function sendQuickReply(sender, message, option1, option2) {
	let messageData = {
    "text": message,
    "quick_replies":[
      {
        "content_type":"text",
        "title":option1,
        "payload":option1
      },
      {
        "content_type":"text",
        "title":option2,
        "payload":option2
      }
    ]
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

function sendQuickReplyMenu(sender, message, option1, option2, option3) {
	let messageData = {
    "text": message,
    "quick_replies":[
      {
        "content_type":"text",
        "title":option1,
        "payload":option1
      },
      {
        "content_type":"text",
        "title":option2,
        "payload":option2
      },
      {
        "content_type":"text",
        "title":option3,
        "payload":option3
      }
    ]
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
function sendGenericMessageLarge(sender, titles, subtitles, images, urls) {
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
			    }, {
					"title": titles[3],
				    "subtitle": subtitles[3],
				    "image_url": images[3],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[3],
					    "title": "watch",
				    }],
			    }, {
				    "title": titles[4],
				    "subtitle": subtitles[4],
				    "image_url": images[4],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[4],
					    "title": "watch",
				    }],
				}, {
				    "title": titles[5],
				    "subtitle": subtitles[5],
				    "image_url": images[5],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[5],
					    "title": "watch",
				    }],
			    }, {
					"title": titles[6],
				    "subtitle": subtitles[6],
				    "image_url": images[6],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[6],
					    "title": "watch",
				    }],
			    }, {
				    "title": titles[7],
				    "subtitle": subtitles[7],
				    "image_url": images[7],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[7],
					    "title": "watch",
				    }],
				}, {
				    "title": titles[8],
				    "subtitle": subtitles[8],
				    "image_url": images[8],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[8],
					    "title": "watch",
				    }],
			    }, {
				    "title": titles[9],
				    "subtitle": subtitles[9],
				    "image_url": images[9],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[9],
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

function sendGenericMessageSmall(sender, titles, subtitles, images, urls) {
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
			    }, {
					"title": titles[3],
				    "subtitle": subtitles[3],
				    "image_url": images[3],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[3],
					    "title": "watch",
				    }],
			    }, {
				    "title": titles[4],
				    "subtitle": subtitles[4],
				    "image_url": images[4],
				    "buttons": [{
					    "type": "web_url",
					    "url": urls[4],
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
function sendMoreMessage(sender) {
    let messageData = {
	    "attachment": {
		    "type": "template",
		    "payload": {
				"template_type": "generic",
			    "elements": [{
					"title": "More?",
				    "buttons": [{
					    "type": "web_url",
					    "url": "www.facebook.com",
					    "title": "Yes",
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
