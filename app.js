// Left to-dos:

// 1. Add firebase and save + pull data
// 2. Small refinements in UI (images, responsiveness, etc.....)
// 3. Validations:
//    3.a. auth validations
//    3.b. offers data validations

const express = require("express");
const cors = require("cors");
const server = express();

const offersRoute = require("./routes/offers.route");
const authRoute = require("./routes/index");

server.use(cors());
server.use(express.json());

const PORT = process.env.PORT || 3001;

server.use("/offers", offersRoute);
server.use("/", authRoute);

server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
