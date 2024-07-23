const { OctaviaDB } = require("octavia-db")
const { OctaviaCode } = require("./codes")

const OCTAVIACONFIG = {
    path: "/octavia-db"
}

// Function to transform data schemes into appropriate types
function modifyDataScheme(dataScheme) {
    const modifiedDataScheme = {}
    const typeMapping = {
        'String': String,
        'Number': Number,
        'Array': Array,
        'Object': Object,
        'Boolean': Boolean
    }

    for (const key in dataScheme) {
        if (dataScheme.hasOwnProperty(key)) {
            const value = dataScheme[key]

            if (typeof value === 'string' && typeMapping[value]) {
                modifiedDataScheme[key] = typeMapping[value]
            } else if (typeof value === 'object' && value !== null) {
                modifiedDataScheme[key] = modifyDataScheme(value) // Recursively modify nested objects
            } else {
                modifiedDataScheme[key] = value // Handle other cases if needed
            }
        }
    }

    return modifiedDataScheme
}

function midWare(req, res, next) {
    const token = req.headers.token

    if (!token || token != OCTAVIACONFIG.token) {
        return res.send({
            ack: false,
            msg: "token error."
        })
    }

    next()
}

function createRouter(config) {
    const express = require("express")
    const router = express.Router()

    router.use(express.json(config.jsonOptions || {}))
    config.midWare && router.use(config.midWare)

    // Handle POST requests to the root endpoint of octavia-db
    router.route(config.path).post(midWare, (req, res) => {
        const { database, password, target, method, request } = req.body
        const DB = new OctaviaDB({
            database, password
        })

        // database operations
        if (target == OctaviaCode.TAR_DATABASE) {
            if (method == OctaviaCode.MET_INFO) {
                return res.send(DB.info())
            } else if (method == OctaviaCode.MET_DELETE) {
                return res.send(DB.delete())
            } else if (method == OctaviaCode.MET_COLLECTION_EXISTS) {
                const collectionName = request.collectionName
                const result = DB.collectionExists(collectionName)

                return res.send({
                    ack: result,
                    msg: `'${collectionName}' collection is ${result ? '' : 'not '}found.`
                })
            } else {
                return res.send({
                    ack: false,
                    msg: `${method} method not found.`
                })
            }
        } else if (target == OctaviaCode.TAR_COLLECTION) {
            let { collectionName, encrypt, data, newData, dataScheme } = request
            const collection = DB.Collection(collectionName, encrypt)
            dataScheme = modifyDataScheme(dataScheme)

            if (method == OctaviaCode.MET_INFO) {
                return res.send(collection.info())
            } else if (method == OctaviaCode.MET_DELETE) {
                return res.send(collection.delete())
            } else if (method == OctaviaCode.MET_INSERT) {
                return res.send(collection.insert(data, dataScheme))
            } else if (method == OctaviaCode.MET_INSERT_MANY) {
                return res.send(collection.insertMany(data, dataScheme))
            } else if (method == OctaviaCode.MET_FIND) {
                return res.send(collection.find(data))
            } else if (method == OctaviaCode.MET_FIND_MANY) {
                return res.send(collection.findMany(data))
            } else if (method == OctaviaCode.MET_UPDATE) {
                return res.send(collection.update(data, newData, dataScheme))
            } else if (method == OctaviaCode.MET_UPDATE_MANY) {
                return res.send(collection.updateMany(data, newData, dataScheme))
            } else if (method == OctaviaCode.MET_REMOVE) {
                return res.send(collection.remove(data))
            } else if (method == OctaviaCode.MET_REMOVE_MANY) {
                return res.send(collection.removeMany(data))
            } else {
                return res.send({
                    ack: false,
                    msg: `${method} method not found.`
                })
            }
        } else {
            return res.send({
                ack: false,
                msg: `${target} target not found.`
            })
        }
    })

    router.use((err, req, res, next) => {
        if (Object.keys(err).includes("ack") && Object.keys(err).includes("code")) {
            res.status(502).send(err)
        } else {
            res.status(502).send({
                code: "ERR_DATABASE_API",
                ack: false,
                msg: `Failed to perform task. ${err.message}`
            })
        }

        next()
    })

    return router
}

module.exports = {
    init(options) {
        if (typeof options === 'object' && !Array.isArray(options)) {
            Object.assign(OCTAVIACONFIG, options)
            return createRouter(OCTAVIACONFIG)
        }
    },
    OctaviaDB
}