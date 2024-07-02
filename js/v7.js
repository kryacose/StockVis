import * as utils from "./utility.js";
import * as dh from "./data_handler.js";

let svg;
let vis_body;
let vis_header;
const vis_id = "v7";
const svg_id = vis_id + "_svg";

var xScale, xAxis, yScale, yAxis;
var formatDecimal = d3.format(",.2f");
var outputFormat = d3.timeFormat("%d %b %Y");

let selctedDropdown;
let tooltip;

var margin = { top: 20, left: 90, bottom: 50, right: 50 };
var width = 944;
var height = 300;

export function initialize() {
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
    .attr("height", 300)
    .style("display", "block");

  svg = d3.select("#" + svg_id);
  xScale = d3
    .scaleTime()
    .domain([dh.getFromDate(), dh.getToDate()])
    .range([margin.left, width - margin.right]);
  yScale = d3
    .scaleLinear()
    .domain([0, 1])
    .range([height - margin.bottom, margin.top]);

  tooltip = d3
    .select("#" + vis_id + "_body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
}

export function update() {
  createDropdown(dh.ticker_to_stock_data);
  prepareData(selctedDropdown);
  console.log("Update V7");
}

let dropdown = document.createElement("select");
dropdown.id = "v7-stock-dropdown";

function createDropdown(data) {
  const stockNames = Array.from(data.keys());
  dropdown.innerHTML = "";

  stockNames.forEach((stockName) => {
    const option = document.createElement("option");
    option.value = stockName;
    option.text = stockName;
    dropdown.appendChild(option);
  });

  vis_header.appendChild(dropdown);
  selctedDropdown = getSelectedStock();
}

function getSelectedStock() {
  dropdown = document.querySelector("#v7 select");
  dropdown.addEventListener("change", function () {
    let data;
    dh.ticker_to_stock_data.forEach((companyData, ticker) => {
      if (ticker === dropdown.value) {
        data = companyData.map((d) => ({
          date: d.Date,
          open: +d.Open,
          high: +d.High,
          low: +d.Low,
          close: +d.Close,
          volume: +d.Volume,
        }));
      }
    });
    prepareData(dropdown.value);
  });
  return dropdown.value;
}

function parseDatefun(dateString) {
  if (typeof dateString === "string") {
    var parts = dateString.split("-");
    return new Date(parts[0], parts[1] - 1, parts[2]);
  } else {
    return dateString;
  }
}

let strokeWdith;
let BinSize;

function prepareData(selectedDropdown) {
  svg.selectAll("*").remove();
  let data = [];
  dh.ticker_to_stock_data.forEach((companyData, ticker) => {
    if (ticker === selectedDropdown) {
      BinSize = Math.max(1, Math.ceil(companyData.length / 35));
      // console.log(companyData.length, BinSize);
      data = companyData.map((d) => ({
        date: parseDatefun(d.Date),
        close: d.Close,
        open: d.Open,
        high: d.High,
        low: d.Low,
      }));
    }
  });

  const bins = d3.timeDay.range(dh.getFromDate(), dh.getToDate(), BinSize);
  const binnedData = bins
    .map((bin) => {
      const filteredData = data.filter(
        (d) => d.date >= bin && d.date < d3.timeDay.offset(bin, BinSize)
      );
      if (filteredData.length > 0) {
        return {
          date: d3.timeDay.offset(bin, BinSize / 2),
          start_date: bin,
          end_date: d3.timeDay.offset(bin, BinSize),
          open: filteredData[0].open,
          high: d3.max(filteredData, (d) => d.high),
          low: d3.min(filteredData, (d) => d.low),
          close: filteredData[filteredData.length - 1].close,
        };
      } else {
        return null;
      }
    })
    .filter((d) => d !== null);

  buildChart(binnedData);
}

function buildChart(data) {
  svg.selectAll("*").remove();

  var timeRange = d3.extent(data, (d) => parseDatefun(d.date));
  var timeDifference = timeRange[1] - timeRange[0];

  xScale.domain([
    d3.timeDay.offset(dh.getFromDate(), -BinSize / 2),
    d3.timeDay.offset(dh.getToDate(), +BinSize / 2),
  ]);
  yScale.domain([d3.min(data, (d) => d.low), d3.max(data, (d) => d.high)]);

  xAxis = d3.axisBottom(xScale).tickSizeOuter(0).tickFormat(outputFormat);
  yAxis = d3
    .axisLeft(yScale)
    .tickFormat(formatDecimal)
    .tickSizeInner(-width + margin.left + margin.right);

  //x-axis tick format
  if (timeDifference <= 86400000) {
    xAxis.tickFormat(d3.timeFormat("%d %b"));
  } else if (timeDifference > 86400000 && timeDifference < 12873600000) {
    xAxis.tickFormat(d3.timeFormat("%b %d"));
  } else if (timeDifference >= 12873600000) {
    xAxis.tickFormat(d3.timeFormat("%b, %Y"));
  }

  svg
    .append("g")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(0)")
    .style("text-anchor", "end")
    .attr("font-size", "12px")
    .attr("dx", "1.2em")
    .attr("dy", "1.4em");

  svg
    .append("g")
    .attr("id", "yAxis")
    .attr("class", "y-axis")
    .attr("transform", "translate(" + margin.left + "," + 0 + ")")
    .call(yAxis)
    .selectAll(".tick line")
    .style("opacity", 0.3)
    .attr("stroke-dasharray", "2,2");

  svg
    .append("text")
    .attr("class", "y label")
    .attr("text-anchor", "end")
    .attr("x", -height / 2 + 40)
    .attr("y", 30)
    .attr("transform", "rotate(-90)")
    .text("Price ($)");

  var mainGroup = svg
    .append("g")
    .attr("id", "mainGroup")
    .attr("transform", "translate(" + margin.left + "," + 0 + ")");

  var eventGroup = mainGroup.append("g").attr("id", "event-overlay");

  var canvasGroup = eventGroup.append("g").attr("id", "circleGroup");

  function getTextWidth(text, font) {
    var textWidth = 0;
    var context = document.createElement("canvas").getContext("2d");
    context.font = font;
    textWidth = context.measureText(text).width;
    return textWidth;
  }

  var crosshair = eventGroup.append("g").attr("id", "crosshair");

  var eventRect = eventGroup.append("rect");

  var crosshairSettings = {
    xLabelTextOffset: height + 12,
    yLabelTextOffset: -9,
    ylabelWidth: 43,
    xlabelWidth: getTextWidth("30 September 2000", "8px sans-serif"),
    labelHeight: 16,
    labelColor: "#aaa",
    labelStrokeColor: "none",
    labelStrokeWidth: "0.5px",
  };

  crosshair.append("line").attr("id", "focusLineX").attr("class", "focusLine");
  crosshair.append("line").attr("id", "focusLineY").attr("class", "focusLine");

  crosshair
    .append("rect")
    .attr("id", "focusLineXLabelBackground")
    .attr("class", "focusLineLabelBackground")
    .attr("fill", crosshairSettings.labelColor)
    .attr("stroke", crosshairSettings.labelStrokeColor)
    .attr("stroke-width", crosshairSettings.labelStrokeWidth)
    .attr("width", crosshairSettings.xlabelWidth)
    .attr("height", crosshairSettings.labelHeight);

  crosshair
    .append("text")
    .attr("id", "focusLineXLabel")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .attr("color", "#000000")
    .attr("alignment-baseline", "central");

  var ylabel = crosshair.append("g").attr("id", "yLabelGroup");
  ylabel
    .append("rect")
    .attr("id", "focusLineYLabelBackground")
    .attr("class", "focusLineLabelBackground")
    .attr("fill", crosshairSettings.labelColor)
    .attr("stroke", crosshairSettings.labelStrokeColor)
    .attr("stroke-width", crosshairSettings.labelStrokeWidth)
    .attr("width", crosshairSettings.ylabelWidth)
    .attr("height", crosshairSettings.labelHeight);

  ylabel
    .append("text")
    .attr("id", "focusLineYLabel")
    .attr("class", "label")
    .attr("text-anchor", "end")
    .attr("color", "#000000")
    .attr("alignment-baseline", "central");

  setCrosshair(width, 0);

  var candleSettings = {
    stroke: "black",
    up: "#aaa",
    down: "#d30000",
    hover: "#ffffff",
    lineMode: false,
    boxWidth: Math.min(
      15,
      (width - margin.left - margin.right) / (data.length + 5) - 2
    ),
  };

  svg
    .selectAll(".wick")
    .data(data)
    .enter()
    .append("line")
    .attr("class", "wick")
    .attr("x1", function (d, i) {
      return xScale(parseDatefun(d.date));
    })
    .attr("y1", function (d) {
      return yScale(d.high);
    })
    .attr("x2", function (d, i) {
      return xScale(parseDatefun(d.date));
    })
    .attr("y2", function (d) {
      return yScale(d.low);
    })
    .style("stroke", function (d) {
      return "black";
    })
    .style("stroke-width", 1);

  svg
    .selectAll(".box")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "box")
    .attr(
      "x",
      (d) => xScale(parseDatefun(d.date)) - candleSettings.boxWidth / 2
    )
    .attr("y", (d) => yScale(Math.max(d.open, d.close)))
    .attr("width", candleSettings.boxWidth)
    .attr("height", (d) =>
      Math.max(1, Math.abs(yScale(d.close) - yScale(d.open)))
    )
    .style("fill", (d) => (d.close > d.open ? "green" : "red"))
    .style("stroke", "black")
    .style("opacity", 1)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(
        `Start Date: ${outputFormat(d.start_date)}<br>
        End Date: ${outputFormat(d.end_date)}<br>
        Open: $${Number(d.open).toFixed(2)}<br>
        Close: $${Number(d.close).toFixed(2)}<br>
        High: $${d.high.toFixed(2)}<br>
        Low: $${d.low.toFixed(2)}`
      );
      handleMouseMove(event);
    })
    .on("mousemove", (event) => handleMouseMove(event))
    .on("mouseout", () => handleMouseOut());

  var els = candleSettings.lineMode
    ? canvasGroup.selectAll("line")
    : canvasGroup.selectAll("rect");
  els
    .on("mouseover", function (d, i) {
      d3.select(this)
        .attr("cursor", "pointer")
        .style("stroke", candleSettings.hover);
      crosshair.style("display", null);
      setCrosshair(
        xScale((d) => outputFormat(d.date)),
        yScale(d.close)
      );
    })
    .on("mouseout", function (d, i) {
      d3.select(this)
        .style("fill", function (d) {
          return d.close > d.open ? candleSettings.up : candleSettings.down;
        })
        .style("stroke", candleSettings.stroke)
        .style("stroke-width", "1px");
    });

  eventRect
    .attr("width", width)
    .attr("height", height)
    .style("opacity", 0.0)
    .attr("fill", "#ffffff")
    .style("display", null)
    .on("mouseover", function () {
      if (crosshair) {
        crosshair.style("display", null);
      }
    })
    .on("mouseout", function () {
      if (crosshair) {
        crosshair.style("display", "none");
      }
    })
    .on("mousemove", function (event) {
      var mouse = d3.pointer(event);
      var x = mouse[0];
      var y = mouse[1];
      setCrosshair(x, y);
    });

  function setCrosshair(x, y) {
    d3.select("#focusLineX")
      .attr("x1", x)
      .attr("y1", 0)
      .attr("x2", x)
      .attr("y2", height - margin.bottom + 14)
      .attr("stroke", crosshairSettings.labelColor);

    d3.select("#focusLineY")
      .attr("x1", -6)
      .attr("y1", y)
      .attr("x2", width)
      .attr("y2", y)
      .attr("stroke", crosshairSettings.labelColor);

    d3.select("#focusLineXLabel")
      .attr("x", x)
      .attr("y", height - margin.bottom + 25)
      .text(outputFormat(xScale.invert(x + margin.left)))
      .style("font-size", "10px");
    d3.select("#focusLineXLabelBackground")
      .attr(
        "transform",
        "translate( " +
          (x - crosshairSettings.xlabelWidth * 0.5) +
          " , " +
          (height - margin.bottom + 14) +
          " )"
      )
      .text(outputFormat(xScale.invert(x)));
    d3.select("#focusLineYLabel")
      .attr("transform", "translate( " + -3 + ", " + y + ")")
      .text(formatDecimal(yScale.invert(y)))
      .style("font-size", "10px");
    d3.select("#focusLineYLabelBackground")
      .attr("transform", "translate( " + -45 + ", " + (y - 10) + ")")
      .text(yScale.invert(y));
  }
}

function handleMouseMove(event) {
  tooltip
    .style("left", event.pageX + 12 + "px")
    .style("top", event.pageY + "px");
}

function handleMouseOut() {
  tooltip.transition().duration(500).style("opacity", 0);
}
