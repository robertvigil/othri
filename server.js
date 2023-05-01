#!/usr/bin/env node
"use strict";

const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000

app.use(express.static('.'))

app.use('*',function (req, res) { // if still not handled, show error
  res.send("invalid path!");
});

app.listen(PORT, () => {
  console.log(`listening at http://localhost:${PORT}`)
})
