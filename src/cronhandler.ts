/**
 * Author:    	Mecanik (https://mecanik.dev/)
 * Created:   	22.07.2022
 * Updated:   	22.07.2022
 * License: 	Apache License Version 2.0
 * Description: Main trigger (cron) handler
 **/
 
import Utils from './Utils'

export class RelaysData 
{
	or_addresses: string[];
	exit_addresses: string[];
	flags: string[];
	last_seen: string;
};

export class BridgesData 
{
	or_addresses: string[];
	exit_addresses: string[];
	flags: string[];
	last_seen: string;
};

export class MainData
{
	version: string;
	build_revision: string;
	relays_published: string;
	relays: RelaysData[];
	bridges_published: string;
	bridges: BridgesData[];
};

export async function cronRequest(event) 
{
   	try
	{
		const url = "https://onionoo.torproject.org/details?fields=or_addresses,exit_addresses,flags,last_seen";
		
		let data  = await Utils.api<MainData>(url);
		
		console.log(`[data] retrieved relays: ${Object.keys(data.relays).length}, bridges: ${Object.keys(data.bridges).length}`);
		
		if(data)
		{
			// Parse the IP's
			let relays = await Utils.parseRelays(data.relays);
			const relays_total = Object.keys(relays).length;
			
			console.log(`[relays_total]: ${relays_total}`);
		
			// Parse the IP's
			let bridges = await Utils.parseBridges(data.bridges);
			const bridges_total = Object.keys(bridges).length;
				
			console.log(`[bridges_total]: ${bridges_total}`);

			// Fastest solution I could find.
			relays.push(...bridges);
			
			console.log(`[merged]: ${Object.keys(relays).length}`);
			
			// Fastest solution I could find.
			let obj = relays.reduce((obj, item) => (obj[item.key] = item.value, obj) ,{});
			
			let saved_ok = await TOR_COMBINED_LIST.put("ipset", JSON.stringify(obj), {
				// This is just some extra information in case you need it...
				// Free of cost of course...
				metadata: { 
					info: JSON.stringify(new Object({
						'relays': relays_total,
						'bridges': bridges_total,
						'relays_published': data.relays_published,
						'bridges_published': data.bridges_published,
					}))
				},
				// This is to ensure that if something goes wrong with the cron and the list was not updated in a week, the list will expire. 
				// It wouldn't be a good idea to keep blocking IP's if we don't know that they are still part of the TOR Network. 
				// Ammend this as needed...
				expirationTtl: 604800
			});
			
			console.log(`[saved_ok]: ${saved_ok}`);
		}
	} 
	catch(e) 	
	{
		console.log(e.message);
		//console.log(e.stack);
	}
}