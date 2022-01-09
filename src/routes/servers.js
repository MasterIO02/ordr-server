const express = require("express")
const router = express.Router()
const ServersController = require("../controllers/servers")

router.post("", ServersController.createServer)

router.get("", ServersController.getServers)

module.exports = router
