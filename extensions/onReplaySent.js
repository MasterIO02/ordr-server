/*
 * This extension is called when a replay is sent, after the initial parsing and checks, as an express middleware.
 * The render data isn't saved yet to the database.
 */

module.exports = async (req, res, next) => {
    // req.data -> the POST request data
    // req.replay -> the parsed replay
    // see http://expressjs.com/en/api.html#res.send to send an http status code to the request.

    // move to next middleware (save the render data to the database)
    next()
}
