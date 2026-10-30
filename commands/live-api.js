const axios = require('axios');

const OPTS = { timeout: 15000, headers: { 'User-Agent': 'ZEPHYR-MD', Accept: 'application/json' } };

function send(sock, from, msg, text) {
    return sock.sendMessage(from, { text }, { quoted: msg });
}

async function get(url, extra = {}) {
    const res = await axios.get(url, { ...OPTS, ...extra });
    return res.data;
}

async function sendImage(sock, from, msg, url, caption) {
    const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000, headers: { 'User-Agent': 'ZEPHYR-MD' } });
    await sock.sendMessage(from, { image: Buffer.from(res.data), caption }, { quoted: msg });
}

async function catfact(sock, from, msg) {
    const data = await get('https://catfact.ninja/fact');
    await send(sock, from, msg, '*Cat Fact*\n' + (data.fact || 'No fact'));
}

async function dogfact(sock, from, msg) {
    const data = await get('https://dogapi.dog/api/v2/facts');
    const fact = data?.data?.[0]?.attributes?.body || 'No fact';
    await send(sock, from, msg, '*Dog Fact*\n' + fact);
}

async function dadjoke(sock, from, msg) {
    const data = await get('https://icanhazdadjoke.com/', { headers: { Accept: 'application/json', 'User-Agent': 'ZEPHYR-MD' } });
    await send(sock, from, msg, '*Dad Joke*\n' + (data.joke || 'No joke'));
}

async function jokeapi(sock, from, msg) {
    const data = await get('https://v2.jokeapi.dev/joke/Any?safe-mode');
    const text = data.type === 'twopart' ? data.setup + '\n' + data.delivery : (data.joke || 'No joke');
    await send(sock, from, msg, '*Joke*\n' + text);
}

async function pokemon(sock, from, msg, q) {
    const name = String(q || 'pikachu').trim().toLowerCase();
    const data = await get('https://pokeapi.co/api/v2/pokemon/' + encodeURIComponent(name));
    const types = (data.types || []).map(t => t.type.name).join(', ');
    await send(sock, from, msg, '*Pokemon*\nName: ' + data.name + '\nID: ' + data.id + '\nHeight: ' + data.height + '\nWeight: ' + data.weight + '\nTypes: ' + types);
}

async function crypto(sock, from, msg, q) {
    const coin = String(q || 'bitcoin').trim().toLowerCase();
    const data = await get('https://api.coingecko.com/api/v3/simple/price?ids=' + encodeURIComponent(coin) + '&vs_currencies=usd,zar');
    const row = data[coin];
    if (!row) return send(sock, from, msg, 'Unknown coin. Example: .crypto bitcoin');
    await send(sock, from, msg, '*Crypto*\n' + coin + '\nUSD: $' + row.usd + '\nZAR: R' + row.zar);
}

async function githubuser(sock, from, msg, q) {
    const user = String(q || 'torvalds').trim();
    const data = await get('https://api.github.com/users/' + encodeURIComponent(user));
    await send(sock, from, msg, '*GitHub User*\n' + data.login + '\nName: ' + (data.name || '-') + '\nBio: ' + (data.bio || '-') + '\nRepos: ' + data.public_repos + '\nFollowers: ' + data.followers + '\n' + data.html_url);
}

async function country(sock, from, msg, q) {
    const name = String(q || 'South Africa').trim();
    const data = await get('https://restcountries.com/v3.1/name/' + encodeURIComponent(name));
    const c = data[0];
    const cap = (c.capital || []).join(', ');
    const cur = Object.values(c.currencies || {}).map(x => x.name).join(', ');
    await send(sock, from, msg, '*Country*\n' + c.name.common + '\nCapital: ' + cap + '\nRegion: ' + c.region + '\nPopulation: ' + c.population + '\nCurrency: ' + cur);
}

async function iss(sock, from, msg) {
    const data = await get('https://api.wheretheiss.at/v1/satellites/25544');
    await send(sock, from, msg, '*ISS Location*\nLat: ' + data.latitude.toFixed(4) + '\nLon: ' + data.longitude.toFixed(4) + '\nAlt: ' + data.altitude.toFixed(1) + ' km\nSpeed: ' + data.velocity.toFixed(1) + ' km/h');
}

async function numbers(sock, from, msg, q) {
    const n = parseInt(q, 10);
    const url = n ? 'http://numbersapi.com/' + n + '/trivia' : 'http://numbersapi.com/random/trivia';
    const data = await axios.get(url, { timeout: 15000, responseType: 'text' });
    await send(sock, from, msg, '*Numbers*\n' + data.data);
}

async function agify(sock, from, msg, q) {
    const name = String(q || '').trim();
    if (!name) return send(sock, from, msg, 'Usage: .agify Samkelo');
    const data = await get('https://api.agify.io?name=' + encodeURIComponent(name));
    await send(sock, from, msg, '*Agify*\nName: ' + data.name + '\nPredicted age: ' + data.age);
}

async function genderize(sock, from, msg, q) {
    const name = String(q || '').trim();
    if (!name) return send(sock, from, msg, 'Usage: .genderize Samkelo');
    const data = await get('https://api.genderize.io?name=' + encodeURIComponent(name));
    await send(sock, from, msg, '*Genderize*\nName: ' + data.name + '\nGender: ' + data.gender + '\nProbability: ' + Math.round((data.probability || 0) * 100) + '%');
}

async function nationalize(sock, from, msg, q) {
    const name = String(q || '').trim();
    if (!name) return send(sock, from, msg, 'Usage: .nationalize Samkelo');
    const data = await get('https://api.nationalize.io?name=' + encodeURIComponent(name));
    const top = (data.country || []).slice(0, 3).map(c => c.country_id + ' ' + Math.round(c.probability * 100) + '%').join('\n');
    await send(sock, from, msg, '*Nationalize*\nName: ' + data.name + '\n' + (top || 'No data'));
}

async function waifu(sock, from, msg) {
    const data = await get('https://api.waifu.pics/sfw/waifu');
    await sendImage(sock, from, msg, data.url, '*Waifu*');
}

async function neko(sock, from, msg) {
    const data = await get('https://api.waifu.pics/sfw/neko');
    await sendImage(sock, from, msg, data.url, '*Neko*');
}

async function coffee(sock, from, msg) {
    await sendImage(sock, from, msg, 'https://coffee.alexflipnote.dev/random', '*Coffee*');
}

async function duck(sock, from, msg) {
    const data = await get('https://random-d.uk/api/v2/random');
    await sendImage(sock, from, msg, data.url, '*Duck*');
}

async function yesnoimg(sock, from, msg) {
    const data = await get('https://yesno.wtf/api');
    await sendImage(sock, from, msg, data.image, '*Yes/No*\n' + String(data.answer || '').toUpperCase());
}

async function cocktail(sock, from, msg, q) {
    const name = String(q || '').trim();
    const url = name
        ? 'https://www.thecocktaildb.com/api/json/v1/1/search.php?s=' + encodeURIComponent(name)
        : 'https://www.thecocktaildb.com/api/json/v1/1/random.php';
    const data = await get(url);
    const drink = data.drinks && data.drinks[0];
    if (!drink) return send(sock, from, msg, 'No cocktail found.');
    await send(sock, from, msg, '*Cocktail*\n' + drink.strDrink + '\nGlass: ' + drink.strGlass + '\n' + (drink.strInstructions || '').slice(0, 400));
}

async function meal(sock, from, msg) {
    const data = await get('https://www.themealdb.com/api/json/v1/1/random.php');
    const m = data.meals[0];
    await send(sock, from, msg, '*Meal*\n' + m.strMeal + '\nCategory: ' + m.strCategory + '\nArea: ' + m.strArea + '\n' + (m.strInstructions || '').slice(0, 400));
}

async function earthquake(sock, from, msg) {
    const data = await get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
    const rows = (data.features || []).slice(0, 5).map((f, i) => {
        const p = f.properties;
        return (i + 1) + '. M' + p.mag + ' ' + p.place;
    });
    await send(sock, from, msg, '*Earthquakes (24h)*\n' + (rows.join('\n') || 'None'));
}

async function spacex(sock, from, msg) {
    const data = await get('https://api.spacexdata.com/v5/launches/latest');
    await send(sock, from, msg, '*SpaceX Latest*\n' + data.name + '\nDate: ' + data.date_utc + '\nSuccess: ' + (data.success ? 'Yes' : 'No') + '\nDetails: ' + String(data.details || '-').slice(0, 300));
}

async function dogimg(sock, from, msg) {
    const data = await get('https://dog.ceo/api/breeds/image/random');
    await sendImage(sock, from, msg, data.message, '*Dog*');
}

async function catimg(sock, from, msg) {
    const data = await get('https://api.thecatapi.com/v1/images/search');
    await sendImage(sock, from, msg, data[0].url, '*Cat*');
}

async function kanye(sock, from, msg) {
    const data = await get('https://api.kanye.rest/');
    await send(sock, from, msg, '*Kanye*\n' + data.quote);
}

async function holidays(sock, from, msg, q) {
    const code = String(q || 'ZA').trim().toUpperCase();
    const year = new Date().getFullYear();
    const data = await get('https://date.nager.at/api/v3/PublicHolidays/' + year + '/' + encodeURIComponent(code));
    const lines = (data || []).slice(0, 12).map(h => h.date + ' - ' + h.localName);
    await send(sock, from, msg, '*Holidays ' + code + '*\n' + lines.join('\n'));
}

async function university(sock, from, msg, q) {
    const name = String(q || 'Cape Town').trim();
    const data = await get('http://universities.hipolabs.com/search?name=' + encodeURIComponent(name));
    const lines = (data || []).slice(0, 8).map((u, i) => (i + 1) + '. ' + u.name + ' (' + (u.country || '') + ')');
    await send(sock, from, msg, '*Universities*\n' + (lines.join('\n') || 'None'));
}

async function urban(sock, from, msg, q) {
    const term = String(q || '').trim();
    if (!term) return send(sock, from, msg, 'Usage: .urban yeet');
    const data = await get('https://api.urbandictionary.com/v0/define?term=' + encodeURIComponent(term));
    const def = data.list && data.list[0];
    if (!def) return send(sock, from, msg, 'No definition.');
    await send(sock, from, msg, '*Urban*\n' + def.word + '\n' + String(def.definition).replace(/\[|\]/g, '').slice(0, 500));
}

async function bitcoin(sock, from, msg) {
    const data = await get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,zar');
    await send(sock, from, msg, '*Bitcoin*\nUSD: $' + data.bitcoin.usd + '\nZAR: R' + data.bitcoin.zar);
}

async function activity(sock, from, msg) {
    const data = await get('https://www.boredapi.com/api/activity');
    if (!data || !data.activity) {
        const fallback = ['Walk outside', 'Read 10 pages', 'Drink water', 'Stretch for 2 minutes'];
        return send(sock, from, msg, '*Activity*\n' + fallback[Math.floor(Math.random() * fallback.length)]);
    }
    await send(sock, from, msg, '*Activity*\n' + data.activity);
}

function wrap(fn) {
    return async (sock, from, msg, q) => {
        try {
            await fn(sock, from, msg, q);
        } catch (e) {
            await send(sock, from, msg, 'API failed: ' + (e.message || e));
        }
    };
}

module.exports = {
    catfact: wrap(catfact),
    dogfact: wrap(dogfact),
    dadjoke: wrap(dadjoke),
    jokeapi: wrap(jokeapi),
    pokemon: wrap(pokemon),
    crypto: wrap(crypto),
    githubuser: wrap(githubuser),
    country: wrap(country),
    iss: wrap(iss),
    numbers: wrap(numbers),
    agify: wrap(agify),
    genderize: wrap(genderize),
    nationalize: wrap(nationalize),
    waifu: wrap(waifu),
    neko: wrap(neko),
    coffee: wrap(coffee),
    duck: wrap(duck),
    yesnoimg: wrap(yesnoimg),
    cocktail: wrap(cocktail),
    meal: wrap(meal),
    earthquake: wrap(earthquake),
    spacex: wrap(spacex),
    dogimg: wrap(dogimg),
    catimg: wrap(catimg),
    kanye: wrap(kanye),
    holidays: wrap(holidays),
    university: wrap(university),
    urban: wrap(urban),
    bitcoin: wrap(bitcoin),
    activity: wrap(activity)
};
