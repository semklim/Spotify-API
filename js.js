'use strict'

// task1

// base url
const url = 'https://randomuser.me/api/';
//Dom elements
const btn = document.querySelector('.genNew');
const profile = {
picture: document.querySelector('.img'),
number: document.querySelector('.number'),
fl: document.querySelector('.Fio'),
country: document.querySelector('.Country'),
city: document.querySelector('.City'),
mail: document.querySelector('.mail'),
}

let user = {};
// request data of user
function reqUser() {
	let xhr = new XMLHttpRequest();

	xhr.open('GET', url);
	xhr.onload = () => {
		const result = xhr.response;
		user = JSON.parse(result);
		user = user.results[0];
		genNewUser(profile, user);
		localStore(profile);
	}
	xhr.send();
}

function genNewUser(profile, user) {
	profile.picture.innerHTML = `<img src="${user.picture.large}">`;
	profile.number.textContent = user.phone;
	profile.fl.textContent = userFullName(user.name);
	profile.country.textContent = user.location.country;
	profile.city.textContent = user.location.city;
	profile.mail.textContent = user.email;
}

function userFullName(userName) {
	return `${userName.title} ${userName.first} ${userName.last}`
}

// Task 2
function localStore(profile) {
	let randomUser = {};
	const entries = Object.entries(profile);
	entries.forEach(([key, value]) => {
		if (key === 'picture') {
			randomUser[key] = value.innerHTML;
		}else{
			randomUser[key] = value.textContent;
		}
	});
	randomUser = JSON.stringify(randomUser);
	localStorage.setItem('randomUser', randomUser);
}

btn.addEventListener('click', reqUser);


// Task 3
// Using spotify Api
const genresBtns = document.querySelector('.genresBtns');
const genBtn = document.querySelector('.genRecommendations');
let genresArr = new Set();

const API = (function () {
	const limit = 30;
	const client_Id = 'd4c1323a94cb4d3d8bc98068b1784832';
	const client_Secret = 'bfed47cd2c774604a85c38ebbe59f279';
	const urlAuth = 'https://accounts.spotify.com/api/token';
	function _getToken () {
		const configAuth = {
			method: 'POST',
			headers: {
			'Authorization': 'Basic ' + btoa(client_Id + ':' + client_Secret),
			'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: 'grant_type=client_credentials'
		}
		const token = fetch(urlAuth, configAuth)
						.then((data) => data.json())
						.then((accessObject) => accessObject.access_token);
		return token;
	}

	function _getRecomm (token, genres) {
		const market = 'UA';
		genres = genres || 'dance/electronic,rock,chill';
		const urlRecomm = 'https://api.spotify.com/v1/recommendations'
		+`?limit=${limit}`
		+`&market=${market}`
		+'&seed_artists=4NHQUGzhtTLFvgF5SZesLK'
		+`&seed_genres= ${encodeURI(genres)}`
		+'seed_tracks=0c6xIDDpzE81m2q797ordA';
		const config = {
			method: 'GET',
			headers: { 
				'Authorization' : 'Bearer ' + token,
				'Content-Type': 'application/json'
			}
		}

		const tracks = fetch(urlRecomm, config)
						.then((data) => data.json())
						.then((recommendations) => recommendations.tracks);
		return tracks;
	}
	function _getGenres(token) {
		const urlGenres = 'https://api.spotify.com/v1/browse/categories'
		+'?country=UA'
		+'&locale=uk-UA'
		+`&limit=${limit}`
		+'&offset=5';
		const config = {
			method: 'GET',
			headers: { 
				'Authorization' : 'Bearer ' + token,
				'Content-Type': 'application/json'
			}
		}

		const genres = fetch(urlGenres, config)
						.then((data) => data.json())
						.then((genres) => genres.categories.items);
		return genres;
	}

	return{
		getToken() {
			return _getToken();
		},
		getRecomm (token, genres){
			return _getRecomm(token, genres);
		},
		getGenres (token){
			return _getGenres(token);
		}
	}
})();

const UI = (function () {
	const DOMElements = {
		boxGenres: document.querySelector('.music .genresBtns'),
		ul: document.querySelector('.music .recommendations')
	}
	return{
		createGenresBtn (arrGenres) {
			const boxBtns = DOMElements.boxGenres;
			const text = document.createElement('p');
				  text.className = 'howToUse';
				  text.textContent = 'Choose up to 4 genres and click "Gen Recommendations"';
			boxBtns.append(text);
			arrGenres.forEach(({name, id}) => {
				const label = `<label class="genresBtn" option="${id}">
					  <input type="checkbox" class="check_DisplayNone" data-genre-name = "${name}">
					  <span class="genres">${name}</span>
					  </label>`
				boxBtns.insertAdjacentHTML('beforeend', label);
			})
		},
		createLiEl (tracks){
			const mainUl = DOMElements.ul;
			let all_li = ``;
			tracks.forEach(({album:{images, name}, name:trackName, preview_url}) => {
				if (preview_url) {
					all_li += `
					<li class="info musicBox">
					<img src="${images[1].url}" alt="" width="${images[1].width}" height="${images[1].height}">

					<p class="nameAlbum" >Album: ${name}</p>
					<p class="nameTrack" >Track: ${trackName}</p>
					<audio src="${preview_url}" controls></audio>
					</li>
					`
				}
			});
			mainUl.innerHTML = all_li;
		}
	}
})();

// create btn 
(async function addBtnsGenres () {
	const token = await API.getToken();
	const genres = await API.getGenres(token);
	UI.createGenresBtn(genres);
})();


const APP = (function (API, UI) {
	const recommendations = async () => {
		const token = await API.getToken();
		const arr = [...genresArr.values()];
		arr.length = arr.length > 4 ? 4 : arr.length;
		console.log('Your set of genres ', genresArr.size === 0 ? 'dance/electronic,rock,chill' : arr);
		const genres =  arr.join(',');
		const tracks = await API.getRecomm(token, genres);
		UI.createLiEl(tracks);
	}
	return {
		init (){
			recommendations();
		}
	}
})(API, UI);

genresBtns.addEventListener('click', (e) => {
	if(e.target.className === 'check_DisplayNone' && e.target.checked === true){
		const genresName = e.target.getAttribute('data-genre-name');
		genresArr.add(genresName);
	}else if(e.target.className === 'check_DisplayNone' && e.target.checked === false){
		const genresName = e.target.getAttribute('data-genre-name');
		genresArr.delete(genresName);
	}
});

genBtn.addEventListener('click', () => {
	APP.init();
});
