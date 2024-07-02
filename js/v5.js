import * as utils from "./utility.js";
import * as dh from "./data_handler.js";

let svg;
let vis_body;
let vis_header;
let data = {};
var companyColorMap = {};
var companyNames = [
  "AAPL",
  "ADBE",
  "ADI",
  "ADSK",
  "AKAM",
  "AMAT",
  "AMD",
  "AMZN",
  "ASML",
  "AVGO",
  "CDNS",
  "CDW",
  "CHKP",
  "CRWD",
  "CSCO",
  "CSGP",
  "CTSH",
  "DDOG",
  "DOCU",
  "ETSY",
  "FTNT",
  "GOOGL",
  "HUBS",
  "ILMN",
  "INTC",
  "INTU",
  "KLAC",
  "LRCX",
  "MELI",
  "META",
  "MRNA",
  "MSFT",
  "MU",
  "NOW",
  "NVDA",
  "OKTA",
  "PANW",
  "PYPL",
  "QCOM",
  "SHOP",
  "SNOW",
  "SNPS",
  "SPLK",
  "TEAM",
  "TWLO",
  "TXN",
  "VEEV",
  "VRSN",
  "ZM",
  "ZS",
];
var totalArticles = 50000;
const vis_id = "v5";
const svg_id = vis_id + "_svg";
var currentVis;
var sliderValue = 300;
var tooltip;
var searchVal = "none";

export function initialize() {
  console.log("Initialize V5");
  console.log(dh.selected_company_list);
  console.log(dh.news_data);

  var v5Div = d3.select("#v5");

  vis_header = document
    .getElementById(vis_id)
    .getElementsByClassName("vis_header")[0];

  var flexContainer = v5Div
    .append("div")
    .style("display", "flex")
    .style("width", "100%");

  var v5BodyDiv = v5Div
    .append("div")
    .attr("id", "v5_body")
    .style("display", "flex")
    .style("width", "100%");

  var checkboxesDiv = v5BodyDiv
    .append("div")
    .attr("id", "checkboxes")
    .style("width", "12%")
    .style("padding-left", "4px")
    .style("height", "280px")
    .style("overflow-y", "auto")
    .style("background-color", "white")
    .style("border-radius", "0px 0px 0px 5px");

  var svgContainer = v5BodyDiv
    .append("div")
    .style("width", "100%")
    .append("svg")
    .attr("id", svg_id)
    .attr("width", "100%")
    .attr("height", "100%")
    .style("background-color", "white")
    .style("border-radius", "0px 0px 5px 0px");
  addControlsToHeader();
  svg = d3.select("#" + svg_id);

  tooltip = v5BodyDiv
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("pointer-events", "none");
}

export function update() {
  console.log("Update V5");
  updateDynamicContent(totalArticles, 300);
  createColorScale();
  addCheckboxes(companyColorMap);
  currentVis = dh.selected_company_list;
  if (Object.keys(dh.news_data).length > 0) {
    filterData(searchVal);
  }
}

function createColorScale() {
  companyColorMap = {};
  var colorScale = [
    "#ce6dbd",
    "#ad494a",
    "#8ca252",
    "#8c6d31",
    "#a55194",
    "#7b4173",
    "#637939",
    "#5254a3",
    "#d6616b",
    "#b5cf6b",
    "#843c39",
    "#bd9e39",
    "#e7ba52",
    "#393b79",
    "#6b6ecf",
  ];
  dh.selected_company_list.forEach(function (company, index) {
    companyColorMap[company] = colorScale[index % 11];
  });
}

function addControlsToHeader() {
  var headerDiv = d3.select("#v5_header");

  // var leftDiv = headerDiv.append("div");

  // var rightDiv = headerDiv.append("div").style("display", "block");

  // leftDiv
  //   .append("label")
  //   .attr("for", "search-bar")
  //   .text("Search:")
  //   .style("margin-right", "5px")
  //   .style("font-weight", "bold");

  var input = headerDiv
    .append("input")
    .attr("type", "text")
    .attr("id", "search-bar")
    .attr("placeholder", "Search...")
    .style(
      "background",
      `url('images/magnifying_glass_icon.svg') no-repeat 96%`
    )
    // .style("background-blend-mode", "overlay")
    .style("background-color", "white")
    .style("background-size", "16px 16px")
    .style("border", "1px solid #ccc")
    .style("padding", "5px")
    .style("padding-right", "10px")
    .style("height", "32px")
    .style("font-size", "14px")
    .style("border-radius", "4px");

  input.on("keypress", function (event) {
    if (event.keyCode === 13) {
      handleSearch(this.value);
    }
  });

  input.on("click", function (event) {
    const clickX = event.pageX - this.getBoundingClientRect().left;
    const iconAreaStart = this.offsetWidth - 30;
    if (clickX >= iconAreaStart) {
      handleSearch(this.value);
    }
  });

  var newsCountDiv = headerDiv.append("div");
  newsCountDiv
    .append("label")
    .attr("for", "range-slider")
    .text("No. of news:")
    .style("margin-right", "10px")
    .style("padding-top", "5px");
  // .style("font-weight", "bold");

  newsCountDiv
    .append("input")
    .attr("type", "range")
    .attr("id", "range-slider")
    .attr("min", "0")
    .attr("max", "800")
    .attr("value", "300")
    .style("vertical-align", "middle")
    .style("width", "170px")
    .on("input", function () {
      sliderValue = this.value;
      d3.select("#slider-value").text(`${sliderValue}`);
      updateDynamicContent(totalArticles, sliderValue);
      filterData(searchVal);
    });

  newsCountDiv
    .append("span")
    .attr("id", "slider-value")
    .text("300")
    .style("margin-left", "10px")
    // .style("margin-right", "10px")
    .style("font-weight", "normal");

  newsCountDiv
    .append("span")
    .attr("id", "total-news-count")
    .text("")
    .style("margin-right", "10px")
    .style("font-weight", "normal");

  headerDiv
    .append("span")
    .attr("id", "display-percentage")
    .text("Display: ")
    .style("padding-top", "5px");
}

function updateDynamicContent(totalArticles, sliderValue) {
  d3.select("#total-news-count").text(` / ${totalArticles}`);
  if (sliderValue >= totalArticles) {
    var displayPercentage = 100;
  } else {
    var displayPercentage = ((sliderValue / totalArticles) * 100).toFixed(2);
  }
  d3.select("#display-percentage").text(`Display: ${displayPercentage}%`);
}

function addCheckboxes(companyColorMap) {
  var checkboxesDiv = d3.select("#checkboxes");
  checkboxesDiv.selectAll("*").remove();

  const selectAllLabel = checkboxesDiv
    .insert("label", ":first-child")
    .style("margin", "1px 5px 1px 0px")
    .style("padding", "0px 4px");
  selectAllLabel
    .append("input")
    .attr("type", "checkbox")
    .property("checked", true)
    .style("width", "14px")
    .style("height", "14px")
    .on("click", function () {
      if (this.checked)
        $("#checkboxes").find(".fancy_checkbox.unselected").click();
      else $("#checkboxes").find(".fancy_checkbox:not(.unselected)").click();
    });

  selectAllLabel
    .append("span")
    .text("Select All")
    .style("margin-left", "5px")
    .style("font-size", "14px");

  dh.selected_company_list.forEach((name) => {
    const label = checkboxesDiv
      .append("div")
      .style("padding", "0px 0px 0px 4px")
      .style("margin", "1px 5px 0px 0px")
      .style("border-radius", "4px");

    label
      .append("div")
      .attr("id", `v5_${name}_fancy_checkbox`)
      .attr("class", "fancy_checkbox")
      .attr("value", name)
      .on("click", function () {
        const is_unselected = d3.select(this).classed("unselected");
        d3.select(this).classed("unselected", !is_unselected);
        updateCompanyVisibility(name, is_unselected);
      })
      .style("background-color", utils.color(name))
      .style("margin-right", "4px");

    label
      .append("span")
      .text(name)
      .style("font-size", "14px")
      .style("color", "black")
      // .style("margin-bottom", "4px")
      .style("vertical-align", "top");
  });
}

function updateCompanyVisibility(companyName, isVisible) {
  if (isVisible) {
    currentVis.push(companyName);
  } else {
    currentVis = currentVis.filter((item) => item !== companyName);
  }
  filterData(searchVal);
}

function updateVisualization(isChecked) {
  if (isChecked) {
    currentVis = dh.selected_company_list;
  } else {
    currentVis = [];
  }
  filterData(searchVal);
}

function handleSearch(val) {
  searchVal = val;
  filterData(searchVal);
}

function filterData(topic) {
  var filteredCompanies;
  var start_date = dh.getFromDate();
  var end_date = dh.getToDate();
  // console.log(start_date, end_date);
  filteredCompanies = Object.keys(dh.news_data)
    .filter((key) => currentVis.includes(key))
    .reduce((obj, key) => {
      const companyData = dh.news_data[key];
      const filteredDates = Object.entries(companyData)
        .filter(([date]) => {
          const currentDate = new Date(date);
          return currentDate >= start_date && currentDate <= end_date;
        })
        .reduce((acc, [date, data]) => {
          acc[date] = data;
          return acc;
        }, {});
      if (Object.keys(filteredDates).length > 0) {
        obj[key] = filteredDates;
      }

      return obj;
    }, {});
  createArticleList(filteredCompanies, sliderValue, topic);
}

function createArticleList(filteredCompanies, sliderValue, topic) {
  // console.log(topic, topic.length);
  var articles = [];
  for (var company in filteredCompanies) {
    var companyData = filteredCompanies[company];
    for (var date in companyData) {
      var article = {
        company: company,
        date: new Date(date),
        title: companyData[date].title,
        views: companyData[date].views,
      };
      articles.push(article);
    }
  }
  if (topic == "none" || topic.length == 0) {
    articles = articles.slice(0, sliderValue);
    updateDynamicContent(50000, sliderValue);
    drawBubbles(articles);
  } else {
    var searchWord = topic.toLowerCase();
    var filteredArticles = articles.filter((article) => {
      return article.title.toLowerCase().includes(searchWord);
    });
    updateDynamicContent(filteredArticles.length, sliderValue);
    filteredArticles = filteredArticles.slice(0, sliderValue);
    drawBubbles(filteredArticles);
  }
}

function drawBubbles(articles) {
  svg.selectAll("*").remove();

  const svgWidth = 800;
  const svgHeight = 250;
  const margin = { top: 10, right: 10, bottom: 40, left: 50 };
  const centerY = svgHeight / 2;

  var dateExtent = d3.extent(articles, (d) => d.date);
  var xScale = d3
    .scaleTime()
    .domain(dateExtent)
    .range([margin.left, svgWidth - margin.right]);

  const radiusScale = d3
    .scaleSqrt()
    .domain([
      d3.min(articles, (d) => d.views),
      d3.max(articles, (d) => d.views),
    ])
    .range([0.2, 10]);

  const simulation = d3
    .forceSimulation(articles)
    .force("x", d3.forceX((d) => xScale(d.date)).strength(0.1))
    .force("y", d3.forceY(centerY).strength(0.1))
    .force(
      "collide",
      d3
        .forceCollide()
        .radius((d) => radiusScale(d.views))
        .iterations(4)
    );

  const bubbles = svg
    .selectAll(".bubble")
    .data(articles)
    .enter()
    .append("circle")
    .attr("class", "bubble")
    .attr("cx", (d) => -500)
    .attr("cy", centerY)
    .attr("r", (d) => radiusScale(d.views))
    .attr("fill", (d) => utils.color(d.company))
    .attr("opacity", 0.8)
    .on("mouseover", handleMouseover)
    .on("mouseout", handleMouseOut);

  simulation.on("tick", () => {
    bubbles.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });

  setTimeout(() => {
    simulation.stop();
  }, 3000);

  var xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %y"));

  svg
    .append("g")
    .attr("transform", `translate(0, ${svgHeight - margin.bottom + 10})`)
    .call(xAxis);
}

function handleMouseover(event, d) {
  d3.select(this).attr("stroke", "red").attr("stroke-width", 2);

  var date = new Date(d.date);
  var year = date.getFullYear();
  var month = String(date.getMonth() + 1).padStart(2, "0");
  var day = String(date.getDate()).padStart(2, "0");

  var formattedDate = `${year}-${month}-${day}`;

  tooltip.transition().duration(200).style("opacity", 0.9);

  tooltip
    .html(
      `<strong>${d.title}</strong><br>Date: ${formattedDate}&nbsp;&bull;&nbsp;Company: ${d.company}&nbsp;&bull;&nbsp;Views: ${d.views}`
    )
    .style("left", event.pageX + 10 + "px")
    .style("top", event.pageY - 30 + "px");
}

function handleMouseOut(event, d) {
  d3.select(this).attr("stroke", "white").attr("stroke-width", 0);
  tooltip.transition().duration(200).style("opacity", 0);
}
