const crypto = require("crypto")
const Cache = require("node-cache")
const globalCache = new Cache({ deleteOnExpire: true, useClones: false })

exports.getFromCache = async (source, uniqueIdentifier) => {
    if (!uniqueIdentifier) uniqueIdentifier = "none"
    return globalCache.get(crypto.createHash("md5").update(uniqueIdentifier).update(source).digest("hex"))
}

exports.cache = async (toCache, ttl, source, uniqueIdentifier) => {
    if (!uniqueIdentifier) uniqueIdentifier = "none"
    let key = crypto.createHash("md5").update(uniqueIdentifier).update(source).digest("hex")
    globalCache.set(key, toCache, ttl)
}
