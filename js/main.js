import * as utils from "./utility.js";
import * as dh from "./data_handler.js";
import * as v1 from "./v1.js";
import * as v2 from "./v2.js";
import * as v3 from "./v3.js";
import * as v4 from "./v4.js";
import * as v5 from "./v5.js";
import * as v6 from "./v6.js";
import * as v7 from "./v7.js";

document.addEventListener("DOMContentLoaded", function () {
  createLayout();
  dh.initialize().then(() => {
    v1.initialize();
    v2.initialize();
    v3.initialize();
    v4.initialize();
    v5.initialize();
    v6.initialize();
    v7.initialize();
    v1.update();
    // v2.update();
    // v3.update();
    // v4.update();
    // v5.update();
    // v6.update();
    v7.update();
  });
});

function createLayout() {
  createVisBlock("column_1", "v1", "Overview");
  createVisBlock("column_1", "v2", "Volume Distribution");
  createVisBlock("column_1", "v5", "News");
  createVisBlock("column_1", "v7", "Stock Price");
  createTitle("column_2", "stockvis");
  createVisBlock("column_2", "v3", "Traded Volume");
  createVisBlock("column_2", "v4", "Traded Value");
  createVisBlock("column_2", "v6", "Transaction Data");
}

function createBlock(parent_id, id) {
  var div = document.createElement("div");
  div.setAttribute("id", id);
  div.setAttribute("class", "block");
  document.getElementById(parent_id).appendChild(div);
}

// function createTitle(parent_id, id) {
//   createBlock("column_2", "stockvis");
//   document.getElementById(id).innerHTML = "<h1>StockVis</h1>";
// }

function createTitle(parent_id, id) {
  createBlock(parent_id, id);
  var img = document.createElement("img");
  img.setAttribute("src", "images/logo.jpeg");
  img.setAttribute("alt", "StockVis Logo");
  img.style.width = "470px";
  // img.style.height = "90px";
  document.getElementById(id).appendChild(img);
}

function createVisBlock(parent_id, id, name = "Visualization") {
  createBlock(parent_id, id);
  createVisBlockHeader(id, name);
  createVisBody(id);
}

function createVisBlockHeader(parent_id, name) {
  var div = document.createElement("div");
  div.setAttribute("class", "vis_header");
  div.setAttribute("id", parent_id + "_header");
  createVisBlockTitle(div, name, parent_id);
  document.getElementById(parent_id).appendChild(div);
}

function createVisBlockTitle(parent, name, vis_id) {
  var div = document.createElement("div");
  div.setAttribute("id", vis_id + "_title");
  div.setAttribute("class", "vis_title");
  div.setAttribute("class", "button");

  div.onclick = () => {
    $("#" + vis_id)
      .children()
      .not("#" + vis_id + "_header")
      .toggle(200);
  };
  div.innerHTML = name;
  parent.appendChild(div);
}

function createVisBody(parent_id) {
  var div = document.createElement("div");
  div.setAttribute("class", "vis_body");
  div.setAttribute("id", parent_id + "_body");
  document.getElementById(parent_id).appendChild(div);
}
