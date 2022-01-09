const { default: axios } = require("axios")

module.exports = async beatmapsetId => {
    try {
        let { data: kitsuApiResponse } = await axios.get(`https://kitsu.moe/api/s/${beatmapsetId}`, { timeout: 10000 })
        return {
            apiResponse: kitsuApiResponse,
            downloadUrl: `https://kitsu.moe/d/${beatmapsetId}`,
            filename: beatmapsetId,
            lastBeatmapUpdate: kitsuApiResponse.LastUpdate.replace("Z", "")
        }
    } catch (err) {
        console.log("[renderServer] Got some problems with the kitsu.moe API: " + err)
        return "connect error"
    }
}
