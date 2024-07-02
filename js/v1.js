import * as utils from "./utility.js";
import * as dh from "./data_handler.js";
import * as v2 from "./v2.js";
import * as v3 from "./v3.js";
import * as v4 from "./v4.js";
import * as v5 from "./v5.js";
import * as v6 from "./v6.js";
import * as v7 from "./v7.js";

let svg;
let vis_body;
let vis_header;
let is_stock_selector_open = false;

const vis_id = "v1";
const svg_id = vis_id + "_svg";

const min_selected_stocks = 5;
const max_selected_stocks = 15;

let svg_width;
let x_axis, y_axis;
const svg_height = 120;
const margins = [20, 20, 25, 75]; //top, right, bottom, left

function createControlPanel() {
  vis_header.append(createDateRangeSelection());
  vis_header.appendChild(createButtons());
  updateStockSelectorButton(is_stock_selector_open);
}

function createButton(text, id, on_click) {
  var btn = document.createElement("div");
  btn.setAttribute("class", "button");
  btn.setAttribute("id", id);
  btn.onclick = on_click;
  btn.innerHTML = text;
  return btn;
}

function createButtons() {
  var div = document.createElement("div");
  div.appendChild(
    createButton("Select Stocks", "v1_select_stocks_btn", clickSelectStocksBtn)
  );
  div.appendChild(createButton("Update", "v1_update_btn", clickUpdateBtn));
  return div;
}

function updateStockSelectorButton(is_open = false) {
  var btn = document.getElementById("v1_select_stocks_btn");
  if (is_open)
    btn.innerHTML =
      'Select Stocks <i class="bi bi-chevron-up" style = "-webkit-text-stroke: 1px"></i>';
  else
    btn.innerHTML =
      'Select Stocks <i class="bi bi-chevron-down" style = "-webkit-text-stroke: 1px"></i>';
}

function createDateSelection(title, id, value) {
  var div = document.createElement("div");
  div.setAttribute("class", "date_selection");
  div.innerHTML = title + "       ";

  var date_picker = document.createElement("input");
  date_picker.setAttribute("id", id);
  date_picker.setAttribute("type", "date");
  date_picker.setAttribute("value", value);
  date_picker.setAttribute("min", utils.dateToStr(dh.start_date));
  date_picker.setAttribute("max", utils.dateToStr(dh.end_date));
  div.appendChild(date_picker);
  return div;
}

function createDateRangeSelection() {
  var div = document.createElement("div");
  div.appendChild(
    createDateSelection("From", "from_date", utils.dateToStr(dh.init_from_date))
  );
  div.appendChild(
    createDateSelection("To", "to_date", utils.dateToStr(dh.init_to_date))
  );

  return div;
}

function clickSelectStocksBtn() {
  toggleV1();
  if (is_stock_selector_open) {
    // svg
    //   .selectAll("*")
    //   .transition()
    //   .duration(1000)
    //   .ease(d3.easeExpInOut)
    //   .attr("opacity", 0);
    svg.transition().duration(500).ease(d3.easeExpInOut).attr("height", 0);
  } else updateStockOverview();
  updateStockSelectorButton(is_stock_selector_open);
}

function clickUpdateBtn() {
  update();
}

function clickStockChip(event) {
  const stock_chip = event.target;
  stock_chip.classList.toggle("v1_selected_stock_chip");

  const num_stocks_selected = getNumStocksSelected();
  if (
    (num_stocks_selected < min_selected_stocks) |
    (num_stocks_selected > max_selected_stocks)
  ) {
    stock_chip.classList.toggle("v1_selected_stock_chip");
    $("#v1_num_selection").effect("highlight", { color: "orange" }, 500);
  } else {
    updateStockSelectorInfo();
  }
}

function getNumStocksSelected() {
  return document
    .getElementById("v1_stock_grid")
    .getElementsByClassName("v1_selected_stock_chip").length;
}

function createStockChip(company_obj, is_selected) {
  var stock_chip = document.createElement("div");
  stock_chip.setAttribute("class", "v1_stock_chip");
  stock_chip.setAttribute("value", company_obj["Ticker Symbol"]);
  if (is_selected) stock_chip.classList.toggle("v1_selected_stock_chip");
  stock_chip.innerHTML = company_obj["Ticker Symbol"];
  stock_chip.onclick = clickStockChip;
  return stock_chip;
}

function createStockGrid() {
  const selected_companies = new Set(dh.selected_company_list);
  var stock_grid = document.createElement("div");
  stock_grid.setAttribute("id", "v1_stock_grid");
  for (const company_obj of dh.company_list) {
    const is_selected = selected_companies.has(company_obj["Ticker Symbol"]);
    stock_grid.appendChild(createStockChip(company_obj, is_selected));
  }
  return stock_grid;
}

function createStockSelectorInfo() {
  var div = document.createElement("div");
  div.setAttribute("id", "v1_stock_selector_info");

  var element_1 = document.createElement("div");
  element_1.style.display = "inline-block";
  element_1.innerHTML = `Select ${min_selected_stocks} to ${max_selected_stocks} stocks to visualize`;
  div.appendChild(element_1);

  var element_2 = document.createElement("div");
  element_2.setAttribute("id", "v1_num_selection");
  element_2.innerHTML = `Current selection: 0`;
  div.appendChild(element_2);

  return div;
}

function updateStockSelectorInfo() {
  const element = document.getElementById("v1_num_selection");
  element.innerHTML = `Current selection: ${getNumStocksSelected()}`;
}

function createStockSelector() {
  var stock_selector = document.createElement("div");
  stock_selector.setAttribute("id", "v1_stock_selector");
  stock_selector.appendChild(createStockSelectorInfo());
  stock_selector.appendChild(createStockGrid());
  vis_body.append(stock_selector);
  updateStockSelectorInfo();
}

function toggleV1() {
  is_stock_selector_open = !is_stock_selector_open;
  $("#v1_stock_selector").toggle(500);
  svg
    .transition()
    .duration(500)
    .ease(d3.easeExpInOut)
    .attr("height", svg_height);
}

function updateStockOverview() {
  console.log("updateStockOverview");

  const t = d3.transition().duration(500).ease(d3.easeExpInOut);
  const data = getStockOverviewData();
  if (is_stock_selector_open)
    svg
      .selectAll("*")
      .transition()
      .duration(1000)
      .ease(d3.easeExpInOut)
      .attr("opacity", 1);

  x_axis.domain([dh.getFromDate(), dh.getToDate()]);
  svg.select("#x_axis").transition(t).call(d3.axisBottom(x_axis));

  y_axis.domain([
    d3.min(data, ([key, value]) => {
      return value;
    }),
    d3.max(data, ([key, value]) => {
      return value;
    }),
  ]);
  svg
    .select("#y_axis")
    // .transition(t)
    .call(
      d3
        .axisLeft(y_axis)
        .ticks(5)
        .tickFormat((d) => utils.customTickFormat(d))
    );

  svg.select("#v1_line").remove();
  svg
    .append("path")
    .datum(data)
    .attr("id", "v1_line")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3
        .line()
        .x(function ([key, value]) {
          return x_axis(utils.strToDate(key));
        })
        .y(function ([key, value]) {
          return y_axis(value);
        })
    );
}

function initStockOverview() {
  const [margin_top, margin_right, margin_bottom, margin_left] = margins;
  svg_width = utils.getElementDimensionsByID(svg_id)[0];

  x_axis = d3
    .scaleTime()
    .domain([0, 1])
    .range([margin_left, svg_width - margin_right]);
  y_axis = d3
    .scaleLinear()
    .domain([0, 1])
    .range([svg_height - margin_bottom, margin_top]);

  svg
    .append("g")
    .attr("id", "x_axis")
    .attr("transform", `translate(0,${svg_height - margin_bottom})`)
    .call(d3.axisBottom(x_axis));

  svg
    .append("g")
    .attr("id", "y_axis")
    .attr("transform", `translate(${margin_left},0)`)
    .call(d3.axisLeft(y_axis).ticks(5));

  // svg
  //   .append("text")
  //   .attr("class", "x_label")
  //   .attr("text-anchor", "middle")
  //   .attr("x", svg_width / 2)
  //   .attr("y", svg_height - 10)
  //   .text("X Axis");

  svg
    .append("text")
    .attr("class", "y_label")
    .attr("text-anchor", "middle")
    .attr("x", -svg_height / 2)
    .attr("y", 10)
    .attr("dy", ".75em")
    .attr("transform", "rotate(-90)")
    .text("Total Volume");
}

function getStockOverviewData() {
  const data = new Map();

  const getValue = (key) => {
    if (!data.has(key)) data.set(key, 0);
    return data.get(key);
  };

  for (const stock_data of dh.ticker_to_stock_data.values()) {
    for (const obj of stock_data) {
      data.set(obj["Date"], getValue(obj["Date"]) + Number(obj["Volume"]));
    }
  }
  return data;
}

export function initialize() {
  console.log("Initialize V1");

  vis_body = document
    .getElementById(vis_id)
    .getElementsByClassName("vis_body")[0];

  vis_header = document
    .getElementById(vis_id)
    .getElementsByClassName("vis_header")[0];

  d3.select("#" + vis_id + "_body")
    .append("svg")
    .attr("id", svg_id)
    .attr("width", "100%")
    .attr("height", svg_height)
    .style("display", "block");

  svg = d3.select("#" + svg_id);
  createControlPanel();
  createStockSelector();
  initStockOverview();
}

export function update() {
  console.log("Update V1");
  if (is_stock_selector_open) toggleV1();
  dh.setFromDate();
  dh.setToDate();

  const select_stock_chips = Array.from(
    document
      .getElementById("v1_stock_grid")
      .getElementsByClassName("v1_selected_stock_chip")
  );
  const selected_stock_tickers = select_stock_chips.map((obj) =>
    obj.getAttribute("value")
  );
  dh.updateSelectedCompanyList(selected_stock_tickers).then(() => {
    updateStockOverview();
    v2.update();
    v3.update();
    v4.update();
    v5.update();
    v6.update();
    v7.update();
  });
}
