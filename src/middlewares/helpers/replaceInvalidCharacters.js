const sanitize = require("sanitize-filename")

module.exports = async input => {
    let output = input
        .replace(/[?]/g, "")
        .replace(/[!]/g, "")
        .replace(/[+]/g, "")
        .replace(/["]/g, "")
        .replace(/[']/g, "")
        .replace(/[#]/g, "")
        .replace(/[<]/g, "")
        .replace(/[>]/g, "")
        .replace(/[/]/g, "")
        .replace(/[*]/g, "")
        .replace(/[\\]/g, "")
        .replace(/[\^]/g, "")
        .replace(/[%]/g, "")
        .replace(/[:]/g, "")
        .replace(/[{]/g, "")
        .replace(/[}]/g, "")
        .replace(/[`]/g, "")
        .replace(/[%]/g, "")
    output = sanitize(output)
    return output
}
