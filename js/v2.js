import * as utils from "./utility.js";
import * as dh from "./data_handler.js";

let svg;
let vis_body;
let vis_header;

const vis_id = "v2";
const svg_id = vis_id + "_svg";

const svg_height = 350;
const margins = [20, 20, 30, 50]; //top, right, bottom, left

function getData(data) {
  let final_data = new Array();
  let volumePerDate = new Map();

  data.forEach((value, key) => {
    for (let i = 0; i < value.length; i++) {
      let temp_data = new Map();
      let date = value[i].Date;
      let justDate = new Date(date);
      let volume = +value[i].Volume;

      temp_data.set("ticker", key);
      temp_data.set("date", date);
      temp_data.set("justDate", justDate);
      temp_data.set("volume", volume);
      final_data.push(temp_data);

      let existingVolume = volumePerDate.get(date) || 0;
      volumePerDate.set(date, existingVolume + volume);
    }
  });
  return [final_data, volumePerDate];
}

function normalizeData(data, volumePerDate) {
  let normalize_dataarray = [];

  data.forEach((item) => {
    let justDate = item.get("justDate");
    let date = item.get("date");
    let volume = item.get("volume");
    let totalVolume = volumePerDate.get(date);
    let normalizedVolume = (volume / totalVolume) * 100;
    let ticker = item.get("ticker");

    normalize_dataarray.push({
      ticker: ticker,
      date: date,
      justDate: justDate,
      volume: volume,
      normalizedVolume: normalizedVolume,
    });
  });

  return normalize_dataarray;
}

function drawLegend(svgElement, keys, color, margin_left, margin_top) {
  const legend = svgElement
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${8}, ${margin_top})`);

  keys.forEach((key, i) => {
    const legendItem = legend
      .append("g")
      .attr("transform", `translate(0, ${i * 26})`);

    legendItem
      .append("rect")
      .attr("x", 0)
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", color(i))
      .style("rx", "2px")
      .style("ry", "2px");

    legendItem
      .append("text")
      .attr("x", 18)
      .attr("y", 12)
      .text(key)
      .attr("text-anchor", "start")
      .style("font-size", "14px");
    // .attr("alignment-baseline", "middle");
  });
}

function drawChartV2(svgElement, data, svgElementId, chartColor) {
  const parseDate = d3.timeParse("%Y-%m-%d");

  // console.log(data);

  let local_svg_width = utils.getElementDimensionsByID(svgElementId)[0];
  let local_svg_height = svg_height;

  let [margin_top, margin_right, margin_bottom, margin_left] = margins;
  margin_left += 75;
  let keys = Array.from(new Set(data.map((d) => d.ticker)));
  // console.log(keys);
  // console.log(d3.union(data.map(d => d.ticker)));

  var stackedChart = d3
    .stack()
    // .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderNone)
    .keys(keys)
    .value(([, D], key) => D.get(key).normalizedVolume)(
    d3.index(
      data,
      (d) => d.justDate,
      (d) => d.ticker
    )
  );

  data.forEach((d) => {
    d.date = parseDate(d.date);
  });

  const x = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.date))
    .range([margin_left + 25, local_svg_width - margin_right]);
  const y = d3
    .scaleLinear()
    .domain(d3.extent(stackedChart.flat(2)))
    .range([local_svg_height - margin_bottom, margin_top]);

  svgElement
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${local_svg_height - margin_bottom})`)
    .call(d3.axisBottom(x));

  svgElement
    .append("g")
    .attr("class", "y-axis")
    .attr("transform", `translate(${margin_left + 25}, 0)`)
    .call(d3.axisLeft(y));

  svgElement
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "end")
    .attr("y", margin_left - 10)
    .attr("x", (-local_svg_height + margin_top + margin_bottom) / 2 + 25)
    // .style("font-size", "12px")
    // .style("font-weight", "bold")
    .text("Volume (%)");

  const area = d3
    .area()
    .x((d) => x(d.data[0]))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]));

  svgElement
    .append("g")
    .selectAll()
    .data(stackedChart)
    .join("path")
    .attr("fill", (d, i) => chartColor(i))
    .attr("d", area)
    .append("title")
    .text((d) => d.key);

  drawLegend(svgElement, keys, chartColor, margin_left, margin_top);
}

export function initialize() {
  console.log("Initialize V2");
  let color = utils.color;

  let data = dh.ticker_to_stock_data;
  let stockData = new Map(data);

  let [wrangled_data, volume_per_date] = getData(stockData);
  let normalized_data = normalizeData(wrangled_data, volume_per_date);

  // console.log(normalized_data);

  vis_body = document
    .getElementById(vis_id)
    .getElementsByClassName("vis_body")[0];

  // vis_header = document
  //   .getElementById(vis_id)
  //   .getElementsByClassName("vis_header")[0];

  d3.select("#" + vis_id + "_body")
    .append("svg")
    .attr("id", svg_id)
    .attr("width", "100%")
    .attr("height", svg_height)
    .style("display", "block")
    .transition()
    .duration(500)
    .ease(d3.easeExpInOut);

  svg = d3.select("#" + svg_id);
  drawChartV2(svg, normalized_data, svg_id, color);
}

export function update() {
  console.log("Update V2");

  let color = utils.color;
  let data = dh.ticker_to_stock_data;
  let stockData = new Map(data);

  let [wrangled_data, volume_per_date] = getData(stockData);
  let normalized_data = normalizeData(wrangled_data, volume_per_date);

  // Clear existing charts
  d3.select(vis_body).selectAll("svg").remove();

  d3.select("#" + vis_id + "_body")
    .append("svg")
    .attr("id", svg_id)
    .attr("width", "100%")
    .attr("height", svg_height)
    .style("display", "block")
    .transition()
    .duration(500)
    .ease(d3.easeExpInOut);

  svg = d3.select("#" + svg_id);
  drawChartV2(svg, normalized_data, svg_id, color);
}
