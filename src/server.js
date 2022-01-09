const express = require("express")
const mongoose = require("mongoose")
const { renderServer } = require("./renderServer/renderServer")
const { setRenderId } = require("./utils/lastRenderId")
const modifyServerPower = require("./renderServer/modules/modifyServerPower")
const app = express()
const config = require("../config.json")
const Settings = require("./models/settings")

// Routes
const rendersRoutes = require("./routes/renders")
const serversRoutes = require("./routes/servers")
const uploadsRoutes = require("./routes/uploads")

let mongoUrl = `mongodb://${config.auth.mongo_username}:${config.auth.mongo_pass}@${config.auth.mongo_url}/${config.auth.mongo_db_name}?authSource=${config.auth.mongo_auth_source}`

app.set("trust proxy", true)

mongoose
    .connect(mongoUrl, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log("[BOOT] Connected to database.")
    })
    .catch(error => {
        console.log("[BOOT] Connection to database failed." + error)
    })

Settings.findOne({ version: "latest" }).then(settings => {
    if (settings === null) {
        let settings = new Settings({
            version: "latest",
            apisToUse: ["beatconnect", "kitsu", "chimu"],
            rejectAllRenders: false
        })
        settings.save()
        console.log("[BOOT] No settings found in database. A new one got generated, with beatconnect, kitsu and chimu as beatmap mirrors to use.")
    }
})

app.use(express.json())
app.use(express.urlencoded())

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    res.setHeader("X-Powered-By", "Express - o!rdr")
    next()
})

app.use("/renders", rendersRoutes)
app.use("/servers", serversRoutes)
app.use("/upload", uploadsRoutes)

app.listen(config.general.api_port, () => {
    console.log(`[BOOT] Listening on port ${config.general.api_port}`)
})

setRenderId()
modifyServerPower("all", "OFFLINE")
renderServer()

module.exports = app

process.on("uncaughtException", err => {
    console.log("[ERROR] Uncaught exception:", err)
})

process.on("unhandledRejection", err => {
    console.log("[ERROR] Unhandled rejection:", err)
})
