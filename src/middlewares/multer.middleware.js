// import multer from "multer"

// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, "./public/temp")
//     },
// filename: function (req, file, cb) {
// const uniqueSuffix = Date.now() + '-' + Math.round
// (Math. random() * 1E9)
// cb(null, uniqueSuffix + "-" + file.originalname)
// }
// })
// export const upload = multer ({ storage })

import multer from "multer"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
    console.log("multer destination hit!")  // ADD THIS
    cb(null, path.join(__dirname, "../../public/temp"))
},
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

export const upload = multer({ storage })