<template>
	<q-page>
		<template v-if="loaded">
			<div v-if="bars.length != 0">
				<q-list bordered separator>
					<div v-for="listing in bars" :key=listing.barId>
						<q-item style="height: 100px;" @click="$router.push('/details/'+listing.barId)" clickable v-ripple>
							<q-item-section avatar>
								<q-avatar square>
									<q-img :ratio="1" loading :src="listing.barPhoto" />
								</q-avatar>
							</q-item-section>

							<q-item-section>
								<q-item-label class="text-h6">{{ listing.name }}</q-item-label>
								<q-item-label caption lines="1">{{ listing.contact.address.city }}, {{ listing.contact.address.state }}</q-item-label>
								<q-item-label caption lines="1">~{{calculateDistance(listing.coordinates.lat, listing.coordinates.lon)}} mi away</q-item-label>
								<q-item-label caption lines="1">
								<span class="q-px-xs" v-for="(category, idx) in listing.categories" :key="idx">
									<q-badge class="q-px-sm" color="primary">{{category}}</q-badge>
								</span>
								</q-item-label>
							</q-item-section>

							<q-item-section side>
								<q-item-label>
									<q-badge :color="isOpenBadgeColor(listing)" :label="isOpen(listing)"></q-badge>
								</q-item-label>
							</q-item-section>
						</q-item>
					</div>
				</q-list>
			</div>
			<div v-else>
				<div class="fixed-center text-subtitle2">No bars in this category</div>
			</div>
		</template>

		<template v-else>
			<span class="absolute-center">
				<q-spinner
				color="primary" 
				size="3em"/>
			</span>
		</template>

	</q-page>
</template>

<script>
export default {
	name: 'CategorySearch',
	data () {
		return {
			loaded:  false,
			bars: [],
			usersLat: null,
			usersLon: null,
		}
	},
	mounted: function(){
		this.getLocation()

	},
	created: function () {
		this.getID()
	},
	methods: {
		//gets the current users location
		getLocation() {
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					 (position) => {
						 this.usersLat = position.coords.latitude
						 this.usersLon = position.coords.longitude
						 console.log("Users Latitude: " + this.usersLat + "Users Longitude: " + this.usersLon);
					//do work work here
						/*
						$.post("url-here", {
							long: position.coords.longitude,
							lat: position.coords.latitude
						}).done(function (response) {
							alert(responsse)
						});
						*/
					},
					function (error) {
						alert(error.message);
					}, {
						enableHighAccuracy: true
						, timeout: 5000
					}
				);
			} else {
				alert("Geolocation is not supported by this browser.");
			}
		},
		//calc the difference between the user and the bar
		calculateDistance(barLat, barLon) {
			var R = 6371; // Radius of the earth in km
			var dLat = (barLat - this.usersLat) * Math.PI / 180;  // deg 2 rad below
			var dLon = (barLon - this.usersLon) * Math.PI / 180;
			var a = 
				0.5 - Math.cos(dLat)/2 + 
				Math.cos(this.usersLat * Math.PI / 180) * Math.cos(barLat * Math.PI / 180) * 
				(1 - Math.cos(dLon))/2;

			return this.roundedToFixed((R * 2 * Math.asin(Math.sqrt(a)))/1.609); // divide by 1.609 to convert to miles

		},
		roundedToFixed(_float, _digits=1){ //funstion to round to 1 decimal place
			var rounder = Math.pow(10, _digits);
			return (Math.round(_float * rounder) / rounder).toFixed(_digits);
		},
		calcTime(city, offset) {

			d = new Date();

			utc = d.getTime() + (d.getTimezoneOffset() * 60000);

			nd = new Date(utc + (3600000*offset));

			return "The local time in " + city + " is " + nd.toLocaleString();

		},
		//determines if a bar is open or not
		isOpen (obj) {
			var today = this.returnToday()
			//console.log(obj)
			//console.log(obj.hours[today].isOpen)
			if (obj.hours[today].isOpen == "Open") {
				let openTime = obj.hours[today].open
				let closeTime = obj.hours[today].close
				if (this.checkInInterval(openTime, closeTime)) {
					//console.log("return opened")
					return "Open"
				} else {
					return "Closed"
				}
			} else {
				//console.log("return closed")
				return "Closed"
			}
			//console.log("is open: " + obj.hours[today])
		},
		isOpenBadgeColor (obj) {
			var today = this.returnToday()
			//console.log(obj)
			//console.log(obj.hours[today].isOpen)
			if (obj.hours[today].isOpen == "Open") {
				let openTime = obj.hours[today].open
				let closeTime = obj.hours[today].close
				if (this.checkInInterval(openTime, closeTime)) {
					//console.log("return opened")
					return "green"
				} else {
					return "red"
				}
			} else {
				//console.log("return closed")
				return "red"
			}
			//console.log("is open: " + obj.hours[today])
		},
		//checks to determine if a time is within a certain interval
		checkInInterval(startTime, endTime, nowTime = this.getCurrentTime()) {
			if (startTime < endTime) {
				return nowTime >= startTime && nowTime <= endTime
			}
			else {//Over midnight
				return nowTime >= startTime || nowTime <= endTime
			}
		},
		getCurrentTime(){
			var today = new Date();
			//var date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
			var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
			return time
		},
		returnToday() {
			var d = new Date();
			var days = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
			return days[d.getDay()];
		},
		getID () {
			var current = this.$route.name.toLowerCase()

			/*
			if(current.includes(" ")) {
				current = this.current.replace(/\s/g,"-")
			}*/

			this.queryBars(current)

		},
		queryBars (category) {
			var cat = category
			var col = this.$db.collection('bars')
			const query = col.where('categories', 'array-contains', cat)
			query.get().then(snapshot => {
				snapshot.docs.forEach(doc => {
					console.log(doc.data())
					this.bars.push(doc.data())
				})
			}).then(() => {
				this.loaded = true
			}).catch((err) => {
				console.log(err)
			})
			console.log(this.bars)
		}
	}
}
</script>