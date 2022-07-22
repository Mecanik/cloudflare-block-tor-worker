/**
 * Author:    	Mecanik (https://mecanik.dev/)
 * Created:   	22.07.2022
 * Updated:   	22.07.2022
 * License: 	Apache License Version 2.0
 * Description: Utilies
 **/

const ipRegex = require('ip-regex');

export default class Utils 
{
	static partition(list = [], n = 1) {
	  const isPositiveInteger = Number.isSafeInteger(n) && n > 0;
	  if (!isPositiveInteger) {
		throw new RangeError('n must be a positive integer');
	  }

	  const q = Math.floor( list.length / n );
	  const r = list.length % n;

	  let i   ; // denotes the offset of the start of the slice
	  let j   ; // denotes the zero-relative partition number
	  let len ; // denotes the computed length of the slice

	  let partitions :any[] = [];
	  for ( i=0, j=0, len=0; i < list.length; i+=len, ++j ) {
		len = j < r ? q+1 : q ;
		let partition :any[] = list.slice( i, i+len ) ; 
		partitions.push( partition ) ;
	  }

	  return partitions;
	};

	// https://stackoverflow.com/questions/56485202/argument-of-type-unknown-is-not-assignable-to-parameter-of-type
	// return an array of all object values...
	// if the object is already an array, the output is the same type.
	// otherwise it's the union of all the known property types
	static vals<T extends object>(
		arr: T
		): Array<T extends Array<infer U> ? U : T[keyof T]> {
		return Object.values(arr); // need es2017 lib for this
	}

	// Flatten an array by one level... 
	static flat<T>(
		arr: Array<T>
		): Array<Extract<T, any[]>[number] | Exclude<T, any[]>> {
		return arr.flat(); // need esnext lib for this
	}

	static async api<T>(url: string): Promise<T> {
		const init = { headers: { 
			"Accept": "application/json", 
			"content-type": "application/json;charset=UTF-8",
			"x-info": "Please don't block me, I am an utility to dissalow TOR on some websites",
			"x-author": "https://mecanik.dev/",
		}, };
		return fetch(url, init)
		  .then(response => {
			if (!response.ok) {
			  throw new Error(response.statusText)
			}
			return response.json().then(data => data as T);
		  })          
	}
	
	
	/**
	 * Parses an array of relays returned by the TOR Api
	 * @note The nodes that haven't been active in the last 3 hours are considered inactive and excluded
	 * @param {array} An array of objects ([{"or_addresses":[],"exit_addresses":[],"last_seen":"","flags":[]}])
	 * @returns {array} An array of objects ([{key: "<ip>", value: "exit/relay"}])
	**/
	static async parseRelays(parsed) 
	{
		let relays = [];
		
		try
		{
			for (let relay of Utils.flat(Utils.vals(parsed)))
			{		
				// Check if still up.
				// Checking 'running' is not reliable, because what if it's offline now but turned back on 5 minutes later?
				if ((Date.parse(relay.last_seen) / 1000) < ((Date.now() / 1000) - 10800)) // 10,800 sec = 180 min = 3 hrs
				{
					continue;
				}
				
				var is_exit = relay.hasOwnProperty("flags") ? relay.flags.includes('Exit') : false;
				
				for (let or_address of Utils.flat(Utils.vals(relay.or_addresses)))
				{
					let or_address_matches :any[] = [];

					const regex = /^\[?([0-9a-f:.]*)]?:\d+$/gm;
					let m;

					while ((m = regex.exec(or_address)) !== null) 
					{
						if (m.index === regex.lastIndex) {
							regex.lastIndex++;
						}

						m.forEach((match, groupIndex) => {
							or_address_matches = [...or_address_matches, match]; 
						});
					}

					if (or_address_matches.length === 2) 
					{
						var address = or_address_matches[1];
						
						// Store IPv4 if valid
						if (ipRegex.v4({exact: true}).test(address)) 
						{
							if(!relays.some(o => address === o.key))
							{
								relays.push({ key: address, value: is_exit ? "Relay+Exit": "Relay"});
							}
						}
						// Store IPv6 if valid
						else if (ipRegex.v6({exact: true}).test(address)) 
						{
							if(!relays.some(o => address === o.key))
							{
								relays.push({ key: address, value: is_exit ? "Relay+Exit": "Relay"});
							}
						}
					}
				}
				
				// if exit_addresses
				if(relay.hasOwnProperty("exit_addresses"))
				{
				  for (let exit_address of Object.values(relay.exit_addresses)) 
				  {
					// Store IPv4
					if (ipRegex.v4({exact: true}).test(exit_address))
					{
						if(!relays.some(o => exit_address === o.key))
						{
							relays.push({ key: exit_address, value: is_exit ? "Relay+Exit": "Relay"});
						}
					}		
					// Store IPv6
					else if (ipRegex.v6({exact: true}).test(exit_address))
					{
						if(!relays.some(o => exit_address === o.key))
						{
							relays.push({ key: exit_address, value: is_exit ? "Relay+Exit": "Relay"});
						}
					}
				  }
				}
			}
		} 
		catch(e) 	
		{
			console.log(e.message);
		}
		
		return relays;
	};

	/**
	 * Parses an array of relays returned by the TOR Api
	 * @note The nodes that haven't been active in the last 3 hours are considered inactive and excluded
	 * @param {array} An array of objects ([{"or_addresses":[],"exit_addresses":[],"last_seen":"","flags":[]}])
	 * @returns {array} An array of objects ([{key: "<ip>", value: "exit/bridge"}])
	**/
	static async parseBridges(parsed) 
	{
		let bridges = [];
		
		try
		{
			for (let bridge of Utils.flat(Utils.vals(parsed)))
			{	
				// Check if still up.
				// Checking 'running' is not reliable, because what if it's offline now but turned back on 5 minutes later?
				if ((Date.parse(bridge.last_seen) / 1000) < ((Date.now() / 1000) - 10800)) // 10,800 sec = 180 min = 3 hrs
				{
					continue;
				}

				var is_exit = bridge.hasOwnProperty("flags") ? bridge.flags.includes('Exit') : false;
				
				// if more than 1 or_address
				for (let or_address of Utils.flat(Utils.vals(bridge.or_addresses)))
				{
					let or_address_matches :any[] = [];

					const regex = /^\[?([0-9a-f:.]*)]?:\d+$/gm;
					let m;

					while ((m = regex.exec(or_address)) !== null) 
					{
						if (m.index === regex.lastIndex) {
							regex.lastIndex++;
						}

						m.forEach((match, groupIndex) => {
							or_address_matches = [...or_address_matches, match]; 
						});
					}

					if (or_address_matches.length === 2) 
					{
						var address = or_address_matches[1];
						
						// Store IPv4
						if (ipRegex.v4({exact: true}).test(address)) 
						{
							if(!bridges.some(o => address === o.key))
							{
								bridges.push({ key: address, value: is_exit ? "Bridge+Exit": "Bridge"});
							}
						}
						// Store IPv6
						else if (ipRegex.v6({exact: true}).test(address)) 
						{
							if(!bridges.some(o => address === o.key))
							{
								bridges.push({ key: address, value: is_exit ? "Bridge+Exit": "Bridge"});
							}
						}
					}
				}
			}
		} 
		catch(e) 	
		{
			console.log(e.message);
		}
		
		return bridges;
	};
	
}