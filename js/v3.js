import * as utils from "./utility.js";
import * as dh from "./data_handler.js";

let svg;
let vis_body;
let vis_header;

const vis_id = "v3";
const svg_id = vis_id + "_svg";

let svg_width;
let x_axis, y_axis;
const svg_height = 120;
const margins = [20, 20, 25, 60]; //top, right, bottom, left
const color = utils.color;

function getMaxClosingPrice(data) {
  return d3.max(data, (d) => +d["Close"]);
}

function calculateMonthlyAverage(data) {
  let monthlyAverages = {};
  data.forEach((d) => {
    let month = d3.timeMonth(d.parsedDate);
    if (!monthlyAverages[month]) {
      monthlyAverages[month] = { total: 0, count: 0 };
    }
    monthlyAverages[month].total += +d["Close"];
    monthlyAverages[month].count++;
  });
  return Object.keys(monthlyAverages).map((month) => {
    return {
      month: new Date(month),
      average: monthlyAverages[month].total / monthlyAverages[month].count,
    };
  });
}

function normalizeValues(averages, yScale, maxClosingPrice) {
  return averages.map((d) => {
    return {
      month: d.month,
      normalizedAverage: yScale(
        (d.average / maxClosingPrice) * d3.max(yScale.domain())
      ),
    };
  });
}

function drawChartV3(svgElement, data, svgElementId, chartColor) {
  const linecolor = "red";
  // Data parsing
  data.forEach((d) => {
    d.parsedDate = d3.timeParse("%Y-%m-%d")(d.Date);
    d.Volume = +d.Volume;
  });

  const [margin_top, margin_right, margin_bottom, margin_left] = margins;
  let local_svg_width = utils.getElementDimensionsByID(svgElementId)[0];
  let local_svg_height = svg_height;

  let x = d3
    .scaleBand()
    .domain(data.map((d) => d3.timeMonth(d.parsedDate)))
    .range([margin_left, local_svg_width - margin_right])
    .padding(0.2);

  let y = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.Volume)])
    .range([local_svg_height - margin_bottom, margin_top]);

  // Append x-axis to the svgElement
  svgElement
    .append("g")
    .attr("transform", `translate(0,${local_svg_height - margin_bottom})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%b")));

  // Append y-axis to the svgElement
  svgElement
    .append("g")
    .attr("transform", `translate(${margin_left},0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(6)
        .tickFormat((d) => {
          return d3.format(".0f")(d / 1000000) + "M";
        })
    );

  svgElement
    .append("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-90)")
    .attr("y", 20)
    .attr("x", -margin_top - 25)
    .style("font-size", "9px")
    // .style("font-weight", "bold")
    .text("Volume");

  // Drawing bar chart
  svgElement
    .selectAll(".bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", (d) => x(d3.timeMonth(d.parsedDate)))
    .attr("width", x.bandwidth())
    .attr("y", (d) => y(d.Volume))
    .attr("height", (d) => local_svg_height - margin_bottom - y(d.Volume))
    .attr("fill", chartColor);

  let maxClosingPrice = getMaxClosingPrice(data);

  // Calculate monthly averages
  let monthlyAverages = calculateMonthlyAverage(data);
  let normalizedAverages = normalizeValues(monthlyAverages, y, maxClosingPrice);

  // Line generator for averages
  let line = d3
    .line()
    .x((d) => x(d.month) + x.bandwidth() / 2) // Adjust to center
    .y((d) => d.normalizedAverage);

  // Draw line
  svgElement
    .append("path")
    .datum(normalizedAverages)
    .attr("fill", "none")
    .attr("stroke", linecolor)
    .attr("d", line);

  // Draw circles
  svgElement
    .selectAll(".dot")
    .data(normalizedAverages)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", (d) => x(d.month) + x.bandwidth() / 2) // Adjust to center
    .attr("cy", (d) => d.normalizedAverage)
    .attr("r", 3)
    .attr("fill", linecolor);
}

export function initialize() {
  console.log("Initialize V3");
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

    drawChartV3(individual_svg, value, individual_svg_id, charcolor);
    index++;
  });
}

export function update() {
  console.log("Update V3");
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

    drawChartV3(individual_svg, value, individual_svg_id, charcolor);
    index++;
  });
}
