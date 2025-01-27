import express from "express";
import bodyParser from "body-parser";
import axios from "axios";

const app = express();
const localPort = 3000;

let roverManifests = {};
let manifestsLoaded = false;
const DEFAULT_CAMERA = null;

const APP_DETAILS = {
    title: "Mars Rover Photos",
    heading: "Explore Mars",
    heading2: "NASA API - Mars Rover Photos",
    intro: "The following site was created as a personal project utilizing the NASA API for Mars Rover Photos and is built with Node.js, ExpressJS, Axios and TailwindCSS."
}

const BASE_URL = "https://mars-photos.herokuapp.com/api/v1/";
const ROVERS_ARR = ["perseverance","curiosity"];
const ROVERS_META = {
    perseverance: {
        description: "NASA’s Perseverance rover, launched in 2020, explores Mars’ Jezero Crater to study its geology, search for signs of ancient life, and collect soil samples for future return. It’s equipped with advanced tech for scientific exploration.",
        bgImg: "https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01288/ids/edr/browse/ncam/NLF_1288_0781288608_691ECM_N0602250NCAM02288_10_195J01_1200.jpg"
    },
    curiosity: {
        description: "NASA’s Curiosity rover, launched in 2011, is a car-sized robot exploring Mars’ Gale Crater. Its mission is to study the planet’s climate and geology, search for signs of ancient life, and assess conditions for future human exploration.",
        bgImg: "https://mars.nasa.gov/mars2020-raw-images/pub/ods/surface/sol/01288/ids/edr/browse/ncam/NLF_1288_0781283332_488ECM_N0602014NCAM13288_01_195J01_1200.jpg"
    }
}

function formatDate(d) {
    return new Date(d).toDateString();
}

function getCameras(photos) {
    const uniqueCameraNames = [];
    const cameras = [];
    // Loop through photos to get all available cameras used in photos argument
    for (const photo of photos) {
        if (!uniqueCameraNames.includes(photo.camera.name)) {
            uniqueCameraNames.push(photo.camera.name);
            cameras.push(
                {
                    name: photo.camera.name,
                    full_name: photo.camera.full_name
                }
            );
        }
    }
    // Sort camera names in alphabetical order
    return cameras.sort((a, b) => a.name.localeCompare(b.name));
}

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req,res) => {
    // Loop through rovers array and call the manifests endpoint
    if (!manifestsLoaded) {
        for (let i = 0; i < ROVERS_ARR.length; i++) {
            try {
                const result = await axios.get(BASE_URL + '/manifests/' + ROVERS_ARR[i]);
                let manifest = result.data.photo_manifest;
                roverManifests[ROVERS_ARR[i]] = {
                    shortName: manifest.name.toLowerCase(),
                    fullName: manifest.name,
                    launch: manifest.launch_date,
                    launchFormatted: formatDate(manifest.launch_date),
                    landing: manifest.landing_date,
                    landingFormatted: formatDate(manifest.landing_date),
                    status: manifest.status.toUpperCase(),
                    maxDate: manifest.max_date,
                    totalPhotos: manifest.total_photos.toLocaleString(),
                    description: ROVERS_META[ROVERS_ARR[i]].description,
                    bg: ROVERS_META[ROVERS_ARR[i]].bgImg
                };
                if ((i + 1) === ROVERS_ARR.length) {
                    manifestsLoaded = true;
                    res.render("index.ejs", {
                        app: APP_DETAILS,
                        showIntro: true,
                        roversArr: ROVERS_ARR,
                        data: roverManifests
                    });
                }
            } catch (error) {
                console.error(error);
                res.render("index.ejs", {
                    app: APP_DETAILS,
                    showIntro: false,
                    roversArr: ROVERS_ARR,
                    error: error
                });
                break;
            }
        };
    } else { // Display page with downloaded data
        res.render("index.ejs", {
            app: APP_DETAILS,
            showIntro: true,
            roversArr: ROVERS_ARR,
            data: roverManifests
        });
    }
});

app.get("/rovers/:roverName", async (req,res) => {
    const rover = req.params.roverName;
    const manifest = roverManifests[rover];
    try {
        const result = await axios.get(BASE_URL + '/rovers/' + rover + "/latest_photos");
        const latestPhotos = result.data.latest_photos;
        const cameraArr = getCameras(latestPhotos);

        res.render("rover.ejs", {
            app: APP_DETAILS,
            showIntro: false,
            selectedCamera: DEFAULT_CAMERA,
            roversArr: ROVERS_ARR,
            rover: manifest,
            selectedDate: manifest.maxDate,
            maxDate: manifest.maxDate,
            cameras: cameraArr,
            photos: latestPhotos
        });
    } catch (error) {
        console.error(error);
        res.render("index.ejs", {
            app: APP_DETAILS,
            showIntro: false,
            roversArr: ROVERS_ARR,
            error: error
        });
    }
});


app.post("/rovers/:roverName/photos", async (req,res) => {
    const selectedDate = req.body.earthDate;
    const selectedCamera = req.body.camera || DEFAULT_CAMERA;

    try {
        const result = await axios.get(BASE_URL + '/rovers/' + req.params.roverName + '/photos', {
            params: {
                earth_date: selectedDate,
                // camera: selectedCamera
            }
        });
        
        let photosArr = result.data.photos;
        const cameraArr = getCameras(photosArr);

        // Filter photo results by camera if selected
        if (selectedCamera !== null) {
            photosArr = photosArr.filter(photo => photo.camera.name === selectedCamera);
        }
        
        // Render rover page with rover data and queried photos
        res.render("rover.ejs", {
            app: APP_DETAILS,
            showIntro: false,
            selectedCamera: selectedCamera,
            roversArr: ROVERS_ARR,
            rover: roverManifests[req.params.roverName],
            selectedDate: selectedDate || roverManifests[req.params.roverName].maxDate,
            cameras: cameraArr,
            photos: photosArr
        });
    } catch (error) {
        console.error(error);
        res.render("rover.ejs", {
            app: APP_DETAILS,
            showIntro: false,
            roversArr: ROVERS_ARR,
            error: error,
            tryAgainUrl: req.url
        });
    }

});

app.listen(process.env.PORT || localPort);