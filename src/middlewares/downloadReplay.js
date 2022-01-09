const config = require("../../config.json")
const multer = require("multer")
const path = require("path")
let Client = require("ssh2-sftp-client")
let sftp = new Client()
const fs = require("fs")
const randomstring = require("randomstring")
const wget = require("wget-improved")
const crypto = require("crypto")

sftp.connect({
    host: config.auth.ftp_host,
    port: "22",
    username: config.auth.ftp_username,
    password: config.auth.ftp_pass
})

let output = process.cwd() + "/src/middlewares/replays/",
    filename,
    randomizedString

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, output)
    },
    filename: async (req, file, cb) => {
        filename = `${crypto.createHash("md5").update(file.originalname).digest("hex")}-${randomizedString}.osr`
        cb(null, filename)
    }
})

exports.generateRandomString = (req, res, next) => {
    randomizedString = randomstring.generate(4)
    next()
}

exports.saveFile = multer({
    storage: storage,
    limits: {
        fileSize: 250000000
    },
    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname)
        if (ext !== ".osr") {
            return cb("[o!rdr] Invalid replay file. Extension must be .osr")
        }
        cb(null, true)
    }
}).single("replayFile")

exports.saveExternalReplay = async (req, res, next) => {
    if (!req.file && !req.body.replayURL) return res.send("No replay file provided.")
    try {
        if (req.body.replayURL) {
            let newFilename
            if (req.body.replayURL.endsWith(".osr")) {
                let filenameRegex = /[^/\\&?]+\.\w{3,4}(?=([?&].*$|$))/
                filename = filenameRegex.exec(req.body.replayURL)[0]
            } else {
                let filenameRegex = /[^/]+(?=$)/
                filename = filenameRegex.exec(req.body.replayURL)[0]
            }

            newFilename = `${crypto.createHash("md5").update(filename).digest("hex")}-${randomizedString}.osr`
            req.filename = newFilename // to save the correct filename to the database in the renders controller
            filename = newFilename // to upload with the new filename to the FTP

            let download = wget.download(req.body.replayURL, `${output}/${newFilename}`)
            download.on("error", err => {
                console.log(`[express] POST /renders:saveExternalReplay - URL:${req.body.replayURL}: ${err}`)
                return res.status(500).json({
                    message: "Cannot save replay.",
                    errorCode: 2
                })
            })
            download.on("end", () => {
                next()
            })
        } else {
            next()
        }
    } catch {
        res.send("Invalid replay URL.")
    }
}

exports.uploadFileToServer = async (req, res, next) => {
    let data = fs.createReadStream(output + filename)
    let remote = `${config.general.ftp_replay_upload_path}${filename}`

    async function uploadReplay() {
        try {
            await sftp.put(data, remote)
            return true
        } catch {
            return false
        }
    }

    let response = await uploadReplay()
    if (response) {
        checkIfReplayExists()
    } else {
        // we try again
        let resp = await uploadReplay()
        if (resp) {
            checkIfReplayExists()
        } else {
            console.log("[express] POST /renders:uploadFileToServer - Cannot upload replay file to ftp server, uploadReplay returning false")
            return res.status(500).json({
                message: "Failed to prepare the render. Maybe try again to send this replay?",
                errorCode: 23
            })
        }
    }

    async function checkIfReplayExists() {
        let download = wget.download(`${config.general.external_replay_download_link}${filename}`, `${output}${filename}-check`)
        download.on("error", async err => {
            console.log("[express] POST /renders:uploadFileToServer - Cannot upload replay file to ftp server.", err)
            return res.status(500).json({
                message: "Failed to prepare the render. Maybe try again to send this replay?",
                errorCode: 23
            })
        })
        download.on("end", () => {
            try {
                fs.rmSync(`${output}${filename}-check`)
                next()
            } catch (err) {
                console.log("[express] POST /renders:uploadFileToServer - Cannot upload replay file to ftp server.", err)
                return res.status(500).json({
                    message: "Failed to prepare the render. Maybe try again to send this replay?",
                    errorCode: 23
                })
            }
        })
    }
}
