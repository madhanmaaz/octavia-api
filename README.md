# octavia-api
octavia-api is an API for an octavia-client.

# Installation
To install the Octavia-API module, run the following command in your terminal:
```bash
npm install octavia-api
```

# Getting Started.

use with octavia-client. [octavia-client](https://www.npmjs.com/package/octavia-client)

```js
const express = require("express")
const octaviaAPI = require("octavia-api")
const app = express()

app.use(octaviaAPI.init({
    token: "my-super-password-123",
}))

app.listen(3000)
```

#### Options
```js
app.use(octaviaAPI.init({
    path: "/octavia-db"
    token: "my-super-password-123",
    jsonOptions: {
        // express.json options
    },
    midWare(req, res, next) {
        // your midWare
        next()
    }
}))
```