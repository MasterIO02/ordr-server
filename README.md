# o!rdr server

o!rdr is a free and easy-to-use API / website that allows you to render osu! videos of replays using [danser](https://github.com/Wieku/danser-go).
This is an open-source version of the o!rdr server, the official instance is and will always be at https://ordr.issou.best.
This open-source version of the o!rdr server is meant to be used for private purposes (its API / websocket shouldn't be used by the public).
It is different from the official instance, and has useless features for private instances removed from it compared to the official instance.

## What can it do?

This server can automate osu! replay rendering, by using [danser](https://github.com/Wieku/danser-go) with the [o!rdr client](https://github.com/MasterIO02/ordr-client).
It's a "fork" / snapshot of the private official o!rdr instance server at rev15, meaning all video customization features from this version are available on this open-source version.
Compared to the official instance, this open-source version intentionally lacks:

-   Skin management, meaning all skins need to be already available in the rendering clients
-   Score, priority, and average times for clients (the average benchmark FPS is used as priority)
-   Thumbnail generation
-   Link generation / upload to a platform
-   danser auto-updating (the server + client will get updated as soon as possible to work with the latest official danser versions available, but there's no need to update them if you don't need to)
-   Usernames, players, and IP bans
-   Rate limiting POST and GET requests

We are not looking to add those features or any other to this open-source version of the o!rdr server for now.

For every render, the server makes 2 requests to the osu! API for the initial parsing of the replay and fetch map information, and 1 request when trying to distribute a render to a connected client to one of the beatmap mirror API, + download the map if necessary.
The bundled beatmap mirrors API are [beatconnect](https://beatconnect.io/), [Mino](https://catboy.best/).

The o!rdr server exposes an easy-to-use API and a websocket to track render progress in real time.

## How to use it?

### Prerequisites:

-   A MongoDB server with a [replica set](https://docs.mongodb.com/manual/tutorial/deploy-replica-set/), [it can work with only 1 server](https://docs.mongodb.com/manual/tutorial/convert-standalone-to-replica-set/). A replica set is needed to watch for changes on the database. MongoDB Atlas not tested.
-   A web server (nginx, apache, anything that can make a browser download a file via a direct link, replays and beatmaps files provided by FTP)
-   NodeJS v16+ (latest v14 should work, but sometimes has problems with performance tracking and fs operations, v16 is better)

### Installation:

1. Configure your MongoDB server. Make sure you have a replica set, create a database with whatever name you want, and if asked create a collection named "renders"
2. Clone this repository, extract the files to your host
3. Modify the config.json file. Fill all fields in the `auth` section, except the beatconnect API key if you don't want to use beatconnect. The FTP settings are where the maps and replays will be uploaded for the clients to download them.
4. Also fill some fields in the `general` section: all paths and base URLs are needed for the server and clients to work correctly, as well as the pattern for the result videos names. See the config.json documentation section below.
5. Run 'npm install' at the root of the o!rdr server folder to install the required dependecies
6. Run the server with `npm start`

Find the documentation of the API and websocket [here](https://ordr.issou.best/open-docs).

### Configure the client:

The [client](https://github.com/MasterIO02/ordr-client) is what's going to be rendering the videos. Its host needs to have a fairly recent GPU and run with a desktop environment / display connected (if using Linux) to run danser. The installation instructions are located on the client's readme file.

To use a custom server with the client, you need to run it 1 time to let it generate the default config. Then, close it and fill `customServer.apiUrl` and `customServer.clientUrl`. Local networks are supported. Default ports are 3002 for the apiUrl and 8500 for the clientUrl.

### First run

On the first run, if everything is configured correctly, the server is going to generate a configuration document in the `settings` collection in your MongoDB database. You can modify this document while the server is running and the change will be applied in the 30 next seconds.
It is recommended to use MongoDB Compass to make modifications to the database easily.

-   `apisToUse`: array, contains the order to use when querying the beatmap APIs (from where the server will download the maps). Default is beatconnect first (index 0), kitsu second (index 1), chimu third (index 2). You can also use another beatmap mirror, but you will need to create a new file to support it first in `src/renderServer/beatmapApis`. You can use the beatconnect.js file as a template to create it. Feel free to make a pull request to have it added in this repository.
-   `version`: string, the "latest" one will always be selected.
-   `rejectAllRenders`: boolean, if enabled the o!rdr server will reject all renders.

After having made the benchmark and submitted the application for the first client to your server, you will need to enable it in the `servers` collection. Just turn the `enabled` boolean value from false to true of your new client.

The `beatmaps` collection stores the already downloaded beatmaps with their last update time to redownload them if they get updated.
The `renders` collection stores all the renders information. You can trigger the emergency stop for a render from there

## Extensions

You will need to use extensions if you want to do more than what the vanilla o!rdr server can do. Check the files in the `extensions` folder.
Each of them will be run at a specific point in the lifetime of a render: beforeRenderFinished, for example, runs when a render is in the "Finalizing..." state. This is where you should add your logic if you want to generate a link or a thumbnail.
If all you need is the output video in a folder on the server, then you don't need to use extensions.

## config.json file

`auth` section:

-   `mongo_username`: the username that will be used to connect to your MongoDB instance
-   `mongo_auth_source`: If your user has admin privileges, you should use "admin"
-   `mongo_pass`: the password of the user
-   `mongo_url`: the IP:port of the server (no "http://" or "https://")
-   `mongo_db_name`: the name of the database that will be used by the o!rdr server
-   `ftp_host`: the IP of the FTP that the o!rdr server will use to upload maps and replays. The port needs to be 22.
-   `ftp_username` / `ftp_pass`: auth informations
-   `osu_api_key`: your osu! api v1 key
-   `beatconnect_api_key`: your beatconnect API key, if using their mirror

`general` section:

-   `api_port`: the port where the API will run
-   `websocket_port`: the port where the websocket will run
-   `clients_websocket_port`: the port where the clients websocket will run
-   `videos_path`: the path where the videos will be saved
-   `external_map_download_link` the base link that will be used for the clients to download the beatmaps
-   `external_replay_download_link`: the base link that will be used for the clients to download the replays
-   `ftp_map_upload_path`: the path on the FTP where the maps will be saved
-   `ftp_replay_upload_path`: the path on the FTP where the replays will be saved
-   `set_online_client_timeout`: the timeout before a connecting client is set online and ready to receive jobs
-   `minimum_client_version`: the minimum client version required
-   `videos_filename_schema`: the pattern / schema for the output video filename. Written in javascript template string. Available variables: `beatmapDifficultyRating`, `replayUsername`, `artist`, `title`, `difficulty`, `titleModPrefix`, `replayMods`, `accuracy`, `randomString` (4 characters)
    `title_mod_prefix`: the prefix in the title when the replay has mods, is automatically empty if the replay doesn't have mods

Paths and links have to have a "/" at the end.

`other` section:

-   `min_stars_for_motion_blur`: the minimum beatmap stars to allow motion blur. Set 0 to disable
-   `max_song_length`: the maximum song length to allow rendering in seconds
-   `reject_auto_mod`: reject auto mod or not

## Donate

See https://ordr.issou.best/donate and/or the FUNDING.yml file.
