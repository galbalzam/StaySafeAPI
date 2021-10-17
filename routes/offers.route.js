const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  res.json("All Offers Received !!!");
});

router.post("/new", async (req, res) => {
  const offerData = req.body;
  console.log(offerData);
});

module.exports = router;
