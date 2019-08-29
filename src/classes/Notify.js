const DiscordWebhook = require("discord-webhooks");

let Notify = {};


Notify.discord = function (webhook_url, url, brand, metadata, type, color) {

	let myWebhook = new DiscordWebhook(webhook_url);
	let stock = 'Stock not available';

	if ((typeof metadata.stock).toLowerCase() === "number") {
		stock = 'Unavailable';
	} else {
		stock = metadata.stock;
	}

	let price = metadata.price

	let links;
	let qtFormatted = "- ";
	
	if (Array.isArray(metadata.links)) {
		qtlinks.forEach(qtlink => {
			qtFormatted += `${qtlink.bot}(${qtlink.url}${url}) - `;
		});
		
		const set = [];
		for (let i = 0; i < metadata.links.length; i++) {
			const letiant = metadata.links[i];
			let baseUrl = letiant.baseUrl;
			set.push(`[${letiant.title}](${baseUrl}/cart/${letiant.id}:1)`);
		}
		links = set.join('\n');
	} else {
		links = 'Unavailable';
	}

	myWebhook.on("ready", () => {
		myWebhook.execute({
			embeds: [{
				"title": metadata.title,
				"url": url,
				"color": color,
				"timestamp": new Date().toISOString(),
				"footer": {
					"icon_url":"https://cdn.discordapp.com/embed/avatars/0.png",
					"text": "Shopify Monitor by tyler"
				},
				"thumbnail": {
					"url": metadata.img
				},
				"author": {
					"name": "Shopify Monitor",
					"url": "https://discordapp.com",
					"icon_url": "https://cdn.discordapp.com/embed/avatars/0.png"
				},
				"fields": [{
					"name": "Notification Type",
					"value": type,
					"inline": true
				}, {
					"name": "Stock Count",
					"value": stock,
					"inline": true
				}, {
					"name": "Site",
					"value": brand,
					"inline": true
				}, {
					"name": "Price",
					"value": price,
					"inline": true
				}, {
					"name": "Link",
					"value": url,
					"inline": true
				}, {
					"name": "ATC",
					"value": links,
					"inline": true
				}, {
					"name": "Quick Tasks",
					"value": qtFormatted
					
				}]
			}]
		});
	});
}

Notify.discordTest = function (webhook_url) {
	let myWebhook = new DiscordWebhook(webhook_url);
	myWebhook.on("ready", () => {
		myWebhook.execute({
			content: "Shopify Monitor Test"
		});
	});
}

Notify.slackTest = function (webhook_url) {
	let myWebhook = new DiscordWebhook(webhook_url);
	myWebhook.on("ready", () => {
		myWebhook.execute({
			content: "Shopify Monitor Test"
		});
	});
}

module.exports = Notify;
