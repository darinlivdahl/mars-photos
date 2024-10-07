import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import axios from "axios";

const app = express();
const localPort = 3000;

let roversManifest = {};
let manifestsLoaded = false;
const DEFAULT_CAMERA = null;

const APP_DETAILS = {
    title: "Mars Rover Photos",
    heading: "Explore Mars",
    heading2: "NASA API - Mars Rover Photos",
    intro: "The following site was created as a personal project utilizing the NASA API for Mars Rover Photos and is built with Node.js, ExpressJS, Axios and TailwindCSS."
}

const BASE_URL = "https://mars-photos.herokuapp.com/api/v1/";
const ROVERS_ARR = ["perseverance","curiosity","opportunity","spirit"];
const ROVERS_META = {
    perseverance: {
        description: "NASA’s Perseverance rover, launched in 2020, explores Mars’ Jezero Crater to study its geology, search for signs of ancient life, and collect soil samples for future return. It’s equipped with advanced tech for scientific exploration.",
        bgImg: "https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01288/ids/edr/browse/ncam/NLF_1288_0781288608_691ECM_N0602250NCAM02288_10_195J01_1200.jpg"
    },
    curiosity: {
        description: "NASA’s Curiosity rover, launched in 2011, is a car-sized robot exploring Mars’ Gale Crater. Its mission is to study the planet’s climate and geology, search for signs of ancient life, and assess conditions for future human exploration.",
        bgImg: "https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01288/ids/edr/browse/ncam/NLF_1288_0781283332_488ECM_N0602014NCAM13288_01_195J01_1200.jpg"
    },
    opportunity: {
        description: "NASA’s Mars rover Opportunity, part of the Mars Exploration Rover (MER) mission, landed on the Red Planet in 2004. It explored Mars for over 14 years, far surpassing its expected 90-day mission. Opportunity made key discoveries about Mars’ geology and water history.",
        bgImg: "https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01288/ids/edr/browse/ncam/NLF_1288_0781283489_496ECM_N0602014NCAM13288_10_195J01_1200.jpg"
    },
    spirit: {
        description: "Spirit was one of NASA’s Mars Exploration Rovers, landing on Mars in January 2004. Designed for a 90-day mission, it operated for over 6 years, exploring Gusev Crater. It made significant discoveries about Mars’ geology before getting stuck in 2009.",
        bgImg: "https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01288/ids/edr/browse/ncam/NRF_1288_0781283695_512ECM_N0602014NCAM13288_04_195J01_1200.jpg"
    },
}

function formatDate(d) {
    return new Date(d).toDateString();
}

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req,res) => {
    // Loop through rovers array and call the latest_photos endpoint
    if (!manifestsLoaded) {
        for (let i = 0; i < ROVERS_ARR.length; i++) {
            try {
                const result = await axios.get(BASE_URL + '/rovers/' + ROVERS_ARR[i] + '/latest_photos');
                let manifest = result.data.latest_photos[0].rover;
                roversManifest[ROVERS_ARR[i]] = {
                    shortName: manifest.name.toLowerCase(),
                    fullName: manifest.name,
                    launch: manifest.launch_date,
                    launchFormatted: formatDate(manifest.launch_date),
                    landing: manifest.landing_date,
                    landingFormatted: formatDate(manifest.landing_date),
                    status: manifest.status.toUpperCase(),
                    maxDate: manifest.max_date,
                    totalPhotos: manifest.total_photos.toLocaleString(),
                    cameras: manifest.cameras,
                    photos: result.data.latest_photos,
                    description: ROVERS_META[ROVERS_ARR[i]].description,
                    bg: ROVERS_META[ROVERS_ARR[i]].bgImg
                };
                if ((i + 1) === ROVERS_ARR.length) {
                    manifestsLoaded = true;
                    res.render("index.ejs", {
                        app: APP_DETAILS,
                        showIntro: true,
                        roversArr: ROVERS_ARR,
                        data: roversManifest
                    });
                }
            } catch (error) {
                console.error(error.message);
                res.render("index.ejs", { error: error.message });
                break;
            }
        };
    } else { // Display page with downloaded data
        res.render("index.ejs", {
            app: APP_DETAILS,
            showIntro: true,
            roversArr: ROVERS_ARR,
            data: roversManifest
        });
    }
});

app.get("/rovers/:roverName", (req,res) => {
    const rover = req.params.roverName;
    const manifest = roversManifest[rover];

    res.render("rover.ejs", {
        app: APP_DETAILS,
        showIntro: false,
        selectedCamera: DEFAULT_CAMERA,
        roversArr: ROVERS_ARR,
        rover: manifest,
        selectedDate: manifest.maxDate,
        photos: manifest.photos
    });
});

app.post("/rovers/:roverName/photos", async (req,res) => {
    const selectedDate = req.body.earthDate;
    const selectedCamera = req.body.camera || DEFAULT_CAMERA;

    try {
        const result = await axios.get(BASE_URL + '/rovers/' + req.params.roverName + '/photos', {
            params: {
                earth_date: selectedDate,
                camera: selectedCamera
            }
        });
        // console.log('result is: ' + JSON.stringify(result.data));

        // Render rover page with rover data and queried photos
        res.render("rover.ejs", {
            app: APP_DETAILS,
            showIntro: false,
            selectedCamera: selectedCamera,
            roversArr: ROVERS_ARR,
            rover: roversManifest[req.params.roverName],
            selectedDate: selectedDate || roversManifest[req.params.roverName].maxDate,
            photos: result.data.photos
        });
    } catch (error) {
        console.error(error.message);
        res.render("rover.ejs", { error: error.message });
    }

});

app.listen(process.env.PORT || localPort);