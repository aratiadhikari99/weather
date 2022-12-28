const config = {
    countryURL: "https://api.countrystatecity.in/v1/countries",
    countryKEY: "Mmh4UTg2cURpUm14ZnJsaTE0a05zd1ltMFNDS0laakpwTERzYUdjSw==",
    weatherURL: "http://api.openweathermap.org/data/2.5/",
    weatherKEY: "83c5bc24242529002d2bf9cbaf0686b9"
}

const getcountries = async (fieldName, ...args) => {
    let apiEndPoint;
    switch (fieldName) {
        case 'countries': apiEndPoint = config.countryURL
            break;
        case 'states': apiEndPoint = `${config.countryURL}/${args[0]}/states`
            break;
        case 'cities': apiEndPoint = `${config.countryURL}/${args[0]}/states/${args[1]}/cities`
        default:
    }
    const response = await fetch(apiEndPoint,
        {
            headers: { "X-CSCAPI-KEY": config.countryKEY }
        });
    if (response.status != 200) {
        throw new Error(`Something went wrong ${response.status}`)
    }
    const countries = await response.json();
    return countries;
};

const getWeather = async (cityName, ccode, units = "metric") => {
    const apiEndPoint = `${config.weatherURL}weather?q=${cityName},${ccode.toLowerCase()}&APPID=${config.weatherKEY}&units=${units}`
    try{
        const response = await fetch(apiEndPoint)
    if (response.status != 200) {
        if(response.status==404){
            weatherDIV.innerHTML=`<div class="alert-danger">
            <h3>Oops! No data available</h3>
            </div>`
        }else{
            throw new Error(`Something went wrong status code: ${response.status}`)
        } 
    }
    const weather = await response.json()
    return weather;
    }catch(error){
        console.log(error);
    } 
};
const getDateTime = (unixTimeStamp) => {
    const milliseconds = unixTimeStamp * 1000;
    const dateObject = new Date(milliseconds)
    const options = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    }
    const IDateFormat = dateObject.toLocaleDateString('en-US', options)
    return IDateFormat;
}
const tempCard = (val, unit="cel") => {
    const flag = unit == "far" ? "°F" : "°C";
    return `<div id="tempcard">
        <h6 class="card-subtitle mb2 ${unit}">${val.temp}</h6>
        <p class="card-text">Feels Like: ${val.temp}${flag}</p>
        <p class="card-text">Max:  ${val.temp_max} ${flag}, Min:  ${val.temp_min} ${flag}</p>
    </div>`
}
const displayWeather = (data) => {
    const weatherWidget = `<div class="card">
    <div class="card-body">
        <h5 class="card-title">${data.name}, ${data.sys.country}<span class="float-end units"><a href="#" class ="unitlink active" data-unit="cel">°C</a> | <a href="#" class="unitlink" data-unit="far">°F</a>
        </h5>
        <p>${getDateTime(data.dt)}</p>
        <div id="tempcard">${tempCard(data.main)}</div>
        ${data.weather.map(w => `<div id="img-container">${w.main} <img src="https://openweathermap.org/img/wn/${w.icon}.png" /></div>
        <p>${w.description}</p>`).join('\n')}
    </div>
</div>`
    weatherDIV.innerHTML = weatherWidget;
};

const getLoader=()=>{
    return `<div class="spinner-grow text-danger" role="status">
    <span class="visually-hidden">Loading...</span>
  </div>`
}

const countriesListDropdown = document.querySelector("#countrylist")
const statesListDropdown = document.querySelector("#statelist")
const citiesListDropdown = document.querySelector("#citylist")
const weatherDIV = document.querySelector("#weatherwidget")

document.addEventListener('DOMContentLoaded', async () => {
    const countries = await getcountries('countries');
    let countriesOptions = "";
    if (countries) {
        countriesOptions += `<option value="">Country</option>`
        countries.forEach((country) => {
            countriesOptions += `<option value="${country.iso2}">${country.name}</option>`
        })
        countriesListDropdown.innerHTML = countriesOptions;
    }
    countriesListDropdown.addEventListener("change", async function () {
        const selectedCountryCode = this.value;
        const states = await getcountries("states", selectedCountryCode);
        //console.log(states)
        let statesOptions = "";
        if (states) {
            statesOptions += `<option value="">State</option>`
            states.forEach((state) => {
                statesOptions += `<option value="${state.iso2}">${state.name}</option>`
            })
            statesListDropdown.innerHTML = statesOptions;
            statesListDropdown.disabled = false;
        }
    });
    statesListDropdown.addEventListener("change", async function () {
        const selectedCountryCode = countriesListDropdown.value;
        const selectedStateCode = this.value;
        const cities = await getcountries(
            "cities",
            selectedCountryCode,
            selectedStateCode
        );
        //console.log(cities)
        let citiesOptions = "";
        if (cities) {
            citiesOptions += `<option value="">City</option>`
            cities.forEach((city) => {
                citiesOptions += `<option value="${city.name}">${city.name}</option>`
            })
            citiesListDropdown.innerHTML = citiesOptions;
            citiesListDropdown.disabled = false;
        }
    });
    citiesListDropdown.addEventListener('change', async function () {
        const selectedCountryCode = countriesListDropdown.value;
        const selectedCity = this.value;
        weatherDIV.innerHTML=getLoader();
        const weatherInfo = await getWeather(selectedCity, selectedCountryCode);
        displayWeather(weatherInfo);
    });

    document.addEventListener("click", async (e) => {
        if (e.target.classList.contains("unitlink")) {
            const unitValue = e.target.getAttribute("data-unit");
            const selectedCountryCode = countriesListDropdown.value;
            const selectedCity = citiesListDropdown.value;
            const unitFlag = unitValue == "far" ? "imperial" : "metric";
            const weatherInfo = await getWeather(selectedCity, selectedCountryCode, unitFlag);
            const weatherTemp = tempCard(weatherInfo.main, unitValue);
            document.querySelector("#tempcard").innerHTML = weatherTemp;

            document.querySelectorAll('.unitlink').forEach(link=>{
                link.classList.remove('active');
            });
            e.target.classList.add('active');
        }
    });
});

