const config = require('./config.json');

const Client = require('instagram-private-api').V1;
const device = new Client.Device(config.credentials.username);
const storage = new Client.CookieFileStorage(`${config.settings.storage}${config.credentials.username}.json`);

Client.Session.create(device, storage, config.credentials.username, config.credentials.password)
	.then((session) => {
   		// Now you have a session, we can follow / unfollow, anything...
		// And we want to follow Instagram official profile
		return [session, Client.Account.searchForUser(session, 'instagram')]
	})
	.spread((session, account) => {
		return Client.Relationship.create(session, account.id);
	})
	.then((relationship) => {
		console.log(relationship.params)
		// {followedBy: ... , following: ... }
		// Yey, you just followed @instagram
	})
