app.get("/", async (req,res) => {
    // res.send('Loading manifests...');
    for (let i = 0; i < roversArr.length; i++) {
        try {
            const result = await axios.get(BASE_URL + '/manifests/' + roversArr[i], {
                // params: {
                //     api_key: API_KEY
                // }
            });
            let manifest = result.data.photo_manifest;
            roversManifest[rover] = {
                shortName: manifest.name.toLowerCase(),
                fullName: manifest.name,
                launch: manifest.launch_date,
                launchFormatted: formatDate(manifest.launch_date),
                landing: manifest.landing_date,
                status: manifest.status,
                maxDate: manifest.max_date,
                photos: manifest.total_photos
                // TODO: Incorporate way to get available camera list when manifest is up
            };
            if ((i + 1) === roversArr.length) {
                console.log('Manifests loaded from Heroku');
                res.render("rovers.ejs", { rovers: roversArr, data: roversManifest });
            }
        } catch (error) {
            console.log("Manifests Error message: " + error.message);
            // console.log("Error code: " + error.code);
            // console.log("Error status: " + error.status);
            //* Temporary while Manifests endpoint is down
            res.render("index.ejs", { rovers: roversArr, data: roversManifest });
            // res.render("index.ejs", { error: error.message });
            break;
        }
    };
});