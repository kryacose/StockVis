import * as utils from "./utility.js";
import * as dh from "./data_handler.js";

let svg;
let vis_body;
let vis_header;

const vis_id = "v4";
const svg_id = vis_id + "_svg";

let svg_width;
let x_axis, y_axis;
const svg_height = 120;
const margins = [20, 20, 25, 60]; //top, right, bottom, left
const color = utils.color;

function drawChartV4(svgElement, data, svgElementId, chartColor) {
  data.forEach((d) => {
    d.parsedDate = d3.timeParse("%Y-%m-%d")(d.Date);
    d.Volume = +d.Volume;
    d.High = +d.High;
    d.Low = +d.Low;
    d.TradedValue = (d.Volume * (d.High + d.Low)) / 2;
  });

  const [margin_top, margin_right, margin_bottom, margin_left] = margins;
  let local_svg_width = utils.getElementDimensionsByID(svgElementId)[0];
  let local_svg_height = svg_height;

  let x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.parsedDate))
    .range([margin_left, local_svg_width - margin_right]);

  let maxTradedValue = d3.max(data, (d) => +d.TradedValue);
  let niceyScale = d3.scaleLinear().domain([0, maxTradedValue]).nice();

  let y = d3
    .scaleLinear()
    .domain(niceyScale.domain())
    .range([local_svg_height - margin_bottom, margin_top]);

  const tickValues = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => +d.TradedValue)])
    .ticks(6);

  svgElement
    .append("g")
    .attr("transform", `translate(0, ${local_svg_height - margin_bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

  svgElement
    .append("g")
    .attr("transform", `translate(${margin_left}, 0)`)
    .call(
      d3
        .axisLeft(y)
        .tickValues(tickValues)
        .tickFormat((d) => d3.format(".0f")(d / 1000000000) + "B")
    );

  svgElement
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", 20)
    .attr("x", -margin_top - 25)
    .style("font-size", "9px")
    // .style("font-weight", "bold")
    .text("Value");

  svgElement
    .append("path")
    .datum(data)
    .attr("fill", chartColor)
    .attr("stroke", chartColor)
    .attr("stroke-width", 1)
    .attr(
      "d",
      d3
        .area()
        .x((d) => x(d.parsedDate))
        .y0(y(0))
        .y1((d) => y(d.TradedValue))
    );
}

export function initialize() {
  console.log("Initialize V4");
  let data = dh.ticker_to_stock_data;
  let stockData = new Map(data);

  vis_body = document
    .getElementById(vis_id)
    .getElementsByClassName("vis_body")[0];
  vis_body.style.height = "240px";
  vis_body.style.overflowY = "auto";
  let index = 0;
  stockData.forEach((value, key) => {
    // console.log(`Creating chart for ${key}`);
    let individual_svg_id = `${svg_id}_${key}`;
    let individual_svg = d3
      .select(vis_body)
      .append("svg")
      .attr("id", individual_svg_id)
      .attr("width", "100%")
      .attr("height", svg_height)
      .style("display", "block");

    let charcolor = color(index % d3.schemeTableau10.length);

    individual_svg
      .append("rect")
      .attr("x", 20)
      .attr("y", 4)
      .attr("width", 40)
      .attr("height", 15)
      .attr("fill", charcolor)
      .attr("rx", 2)
      .attr("ry", 2);

    individual_svg
      .append("text")
      .attr("x", 25)
      .attr("y", 15)
      .text(key)
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "white");

    drawChartV4(individual_svg, value, individual_svg_id, charcolor);
    index++;
  });
}

export function update() {
  console.log("Update V4");
  let data = dh.ticker_to_stock_data;
  let stockData = new Map(data);

  // Clear existing charts
  d3.select(vis_body).selectAll("svg").remove();

  let index = 0;
  stockData.forEach((value, key) => {
    let individual_svg_id = `${svg_id}_${key}`;
    let individual_svg = d3
      .select(vis_body)
      .append("svg")
      .attr("id", individual_svg_id)
      .attr("width", "100%")
      .attr("height", svg_height)
      .style("display", "block");

    let charcolor = color(index % d3.schemeTableau10.length);

    individual_svg
      .append("rect")
      .attr("x", 10)
      .attr("y", 2)
      .attr("width", 50)
      .attr("height", 15)
      .attr("fill", charcolor)
      .attr("rx", 2)
      .attr("ry", 2);

    individual_svg
      .append("text")
      .attr("x", 15)
      .attr("y", 13)
      .text(key)
      .attr("font-size", "11px")
      .attr("font-weight", "bold")
      .attr("fill", "white");

    drawChartV4(individual_svg, value, individual_svg_id, charcolor);
    index++;
  });
}
