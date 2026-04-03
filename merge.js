const fs = require("fs");

let A = require("./A.json");
let D1 = require("./D1.json");
let D2 = require("./D2.json");

// Fix wrong key
function fix(data) {
  return data.map(item => ({
    block: item["﻿block"], // remove hidden char
    floor: item.floor,
    date: item.date
  }));
}

let final = [
  ...fix(A),
  ...fix(D1),
  ...fix(D2)
];

fs.writeFileSync("schedule.json", JSON.stringify(final, null, 2));

console.log("✅ schedule.json created");