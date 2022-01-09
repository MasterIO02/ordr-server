const config = require("../../../config.json")
const { default: axios } = require("axios")

module.exports = async beatmapsetId => {
    try {
        let { data: beatconnectApiResponse } = await axios.get(
            `https://beatconnect.io/api/beatmap/${beatmapsetId}/?token=${config.auth.beatconnect_api_key}`,
            { timeout: 10000 }
        )
        return {
            apiResponse: beatconnectApiResponse,
            downloadUrl: `https://beatconnect.io/b/${beatmapsetId}/${beatconnectApiResponse.unique_id}`,
            filename: beatmapsetId,
            lastBeatmapUpdate: beatconnectApiResponse.last_updated
        }
    } catch (err) {
        console.log("[renderServer] Got some problems with the beatconnect API: " + err)
        return "connect error"
    }
}
