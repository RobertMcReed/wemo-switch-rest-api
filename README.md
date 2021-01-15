# Wemo Switch REST API

Crudely written *REST* API to set/get Belkin Wemo smart outlet state. This is not a full-fledged Wemo API, it is merely a way to turn Wemo binary devices on/off and check their state via a HTTP API.

## Setup

Install dependencies with `npm i`.

If you want to protect the endpoints with a bearer token, create a file `.env` at root with the key `SECRET=someValueThatYouChoose`. You can also specify `PORT` if you prefer something other than 3000.

If you want to specify which devices to connect to, create a file `config.json` at root which is a JSON array including objects with the following schema:

```
[
    {
        "name": "The name of your device",
        "rename": "renamed_device"
    },
    {
        "name": "some_other_device"
    }
]
```

`name` must match the name as it is registered with the Wemo app.

`rename` allows you to rename the device with respect to this API.

If no config is specified, all discovered devices will be registered with the API.

If a device with the given name is not discovered, it will not be registered with the API.

If you are curious what devices are available, run `node scripts/discover.js` to see which devices show up on your network. The key `friendlyName` can be used to target a specific device in `config.json`.

## Using

Start the server with `npm start` or `node index.js`.

Send API calls to `http://localhost:{PORT}/{ENDPOINTS}` where `PORT` defaults to `3000`, and `ENDPOINTS` are described below.

### Headers

If you protected your routes by providing a `SECRET`, you must provide a `Bearer` token with your request.

Generate a token by running `node scripts/getToken.js`.

Send this token as an authorization header with your request:

```
{ Authorization: `Bearer ${token}` }
```

## API

### `GET /wemo/devices`
- Get a list of all registered devices

### `GET /wemo/name/:name/state`
- Get the current device state

### `GET /wemo/name/:name/state/insight`
- If the device is an Insight device, return the current stats.

### `POST /wemo/name/:name/state/:value`
- Set the device state (turn it on or off).
- Accepted values are the strings `on`, `1`, `true` for on, and `off`, `0`, `false` for off. Case is ignored.


## Disclaimer

Expected unexpected behavior if you use with non-plug devices. But hey, maybe it will be fine?