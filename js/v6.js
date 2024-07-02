import * as utils from "./utility.js";
import * as dh from "./data_handler.js";

let svg;
let vis_body;
let vis_header;
let svg_width, svg_height;
let tooltip;

const vis_id = "v6";
const svg_id = vis_id + "_svg";
const chord_radius = 120;
const arc_width = 8;
const arc_chord_padding = 0;
const arc_margin = 4;

let selected_company_indexes;
let final_stock_holdings;
let full_transaction_matrix;
let simple_transaction_matrix;

export function initialize() {
  console.log("Initialize V6");
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
    .attr("height", 400)
    .style("display", "block");

  tooltip = d3
    .select("#" + vis_id + "_body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  svg = d3.select("#" + svg_id);
  [svg_width, svg_height] = utils.getElementDimensionsByID(svg_id);
}

function drawLegend() {
  const bar_height = 12;
  const margin_left = 4;
  const margin_top = 4;
  svg
    .append("rect")
    .attr("x", margin_left)
    .attr("y", margin_top)
    .attr("width", 59)
    .attr("height", bar_height)
    .style("fill", utils.color("x"));
  svg
    .append("text")
    .attr("x", margin_left + 4)
    .attr("y", margin_top)
    .attr("dy", ".92em")
    .text("% Hop out")
    .attr("fill", "white")
    .style("font-size", "10px");

  svg
    .append("rect")
    .attr("x", margin_left + 59)
    .attr("y", margin_top)
    .attr("width", 40)
    .attr("height", bar_height)
    .style("fill", utils.color("x"))
    .style("opacity", 0.6);
  svg
    .append("text")
    .attr("x", margin_left + 62)
    .attr("y", margin_top)
    .attr("dy", ".92em")
    .text("% Sell")
    .attr("fill", "white")
    .style("font-size", "10px");

  svg
    .append("rect")
    .attr("x", margin_left)
    .attr("y", margin_top + bar_height + 2)
    .attr("width", 52)
    .attr("height", bar_height)
    .style("fill", utils.color("x"));
  svg
    .append("text")
    .attr("x", margin_left + 4)
    .attr("y", margin_top + bar_height + 2)
    .attr("dy", ".92em")
    .text("% Hop in")
    .attr("fill", "white")
    .style("font-size", "10px");

  svg
    .append("rect")
    .attr("x", margin_left + 52)
    .attr("y", margin_top + bar_height + 2)
    .attr("width", 42)
    .attr("height", bar_height)
    .style("fill", utils.color("x"))
    .style("opacity", 0.6);
  svg
    .append("text")
    .attr("x", margin_left + 55)
    .attr("y", margin_top + bar_height + 2)
    .attr("dy", ".92em")
    .text("% Buy")
    .attr("fill", "white")
    .style("font-size", "10px");

  svg
    .append("rect")
    .attr("x", margin_left)
    .attr("y", margin_top + 2 * bar_height + 4)
    .attr("width", 75)
    .attr("height", bar_height)
    .style("fill", utils.color("x"));
  svg
    .append("text")
    .attr("x", margin_left + 4)
    .attr("y", margin_top + 2 * bar_height + 4)
    .attr("dy", ".92em")
    .text("Final Holdings")
    .attr("fill", "white")
    .style("font-size", "10px");

  svg
    .append("rect")
    .attr("x", margin_left)
    .attr("y", margin_top + 3 * bar_height + 6)
    .attr("width", 75)
    .attr("height", bar_height)
    .style("fill", utils.color("x"))
    .style("opacity", 0.6);
  svg
    .append("text")
    .attr("x", margin_left + 4)
    .attr("y", margin_top + 3 * bar_height + 6)
    .attr("dy", ".92em")
    .text("Transanctions")
    .attr("fill", "white")
    .style("font-size", "10px");
}

function defaultMatrix() {
  const size = selected_company_indexes.length;
  var matrix = Array.from(Array(size), (_) => Array(size).fill(0));
  for (var ii = 0; ii < size; ii++)
    matrix[ii][ii] = final_stock_holdings[selected_company_indexes[ii]];
  return matrix;
}

function makeValidMatrix(matrix) {
  var res = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(matrix);
  for (const row of res) {
    if (Object.values(row).some((x) => isNaN(x))) return defaultMatrix();
  }
  return matrix;
}

export function update() {
  svg.selectAll("*").remove();
  drawLegend();
  console.log("Update V6");
  updateSelectedCompanyIndexes();
  preprocessFundData();
  const matrix = makeValidMatrix(simple_transaction_matrix);
  var res = d3.chord().padAngle(0.05).sortSubgroups(d3.descending)(
    simple_transaction_matrix
  );

  //Add the chords
  svg
    .datum(res)
    .append("g")
    .selectAll("path")
    .data(function (d) {
      return d;
    })
    .enter()
    .append("path")
    .attr("d", d3.ribbon().radius(chord_radius))
    .style("fill", (d) => {
      return getColorFromIndex(d.target.index);
    })
    .style("opacity", 0.6)
    .attr("transform", `translate(${svg_width / 2}, ${svg_height / 2})`)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(
        `${
          dh.company_list[selected_company_indexes[d.target.index]][
            "Ticker Symbol"
          ]
        } \u21E8 ${
          dh.company_list[selected_company_indexes[d.source.index]][
            "Ticker Symbol"
          ]
        }<br>
         Amount: $${simple_transaction_matrix[d.source.index][d.target.index]}`
      );
      handleMouseMove(event);
    })
    .on("mousemove", (event) => handleMouseMove(event))
    .on("mouseout", () => handleMouseOut());

  var group = svg
    .datum(res)
    .append("g")
    .selectAll("g")
    .data(function (d) {
      return d.groups;
    })
    .enter();

  //Add the arcs
  group
    .append("g")
    .append("path")
    .style("fill", (d) => {
      return getColorFromIndex(d.index);
    })
    // .style("stroke", "black")
    .attr(
      "d",
      d3
        .arc()
        .innerRadius(chord_radius + arc_chord_padding)
        .outerRadius(chord_radius + arc_chord_padding + arc_width)
        .cornerRadius(0)
    )
    .attr("transform", `translate(${svg_width / 2}, ${svg_height / 2})`)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(
        `${
          dh.company_list[selected_company_indexes[d.index]]["Ticker Symbol"]
        } <br>
         Final Holdings: $${
           final_stock_holdings[selected_company_indexes[d.index]]
         }`
      );
      handleMouseMove(event);
    })
    .on("mousemove", (event) => handleMouseMove(event))
    .on("mouseout", () => handleMouseOut());

  // Add the ticks
  group
    .selectAll(".group-tick")
    .data(function (d) {
      const data = groupTicks(d, 25);
      return data;
    })
    .enter()
    .append("g")
    .attr("transform", (d) => {
      return (
        `translate(${svg_width / 2}, ${svg_height / 2})` +
        `rotate(${(d.angle * 180) / Math.PI - 90})` +
        `translate(${
          chord_radius + arc_chord_padding + arc_width + arc_margin
        }, 0)`
      );
    })
    .append("line")
    .attr("x2", 2 * arc_width + arc_margin)
    .attr("stroke", "black");

  // Add the labels of a few ticks:
  group
    .selectAll(".group-tick-label")
    .data(function (d) {
      return groupTicks(d, 25);
    })
    .enter()
    .filter(function (d) {
      return d.value % 5 === 0;
    })
    .append("g")
    .attr(
      "transform",
      (d) =>
        `translate(${svg_width / 2}, ${svg_height / 2})` +
        `rotate(${(d.angle * 180) / Math.PI - 90})` +
        `translate(${
          chord_radius + arc_chord_padding + 2 * arc_width + 2 * arc_margin + 4
        }, 0)`
    )
    .append("text")
    .attr("x", 8)
    .attr("dy", ".35em")
    .attr("transform", function (d) {
      return d.angle > Math.PI ? "rotate(180) translate(-16)" : null;
    })
    .style("text-anchor", function (d) {
      return d.angle > Math.PI ? "end" : null;
    })
    .text(function (d) {
      if (d.value == 0) {
        const stock_ticker =
          dh.company_list[selected_company_indexes[d.index]]["Ticker Symbol"];
        if (d.angle > Math.PI) return `\u{2191}${stock_ticker}`;
        else return `${stock_ticker}\u{2193}`;
      } else return `${d.value}%`;
    })
    .style("font-size", "8px")
    .style("font-weight", (d) => {
      if (d.value == 0) return "bold";
      else return "normal";
    });

  //Add the Enter arcs
  draw_outer_arcs(
    group,
    chord_radius + arc_chord_padding + arc_width + arc_margin,
    arc_width,
    (index) => {
      index = selected_company_indexes[index];
      return (
        sumRow(full_transaction_matrix, index) -
        full_transaction_matrix[index][index]
      );
    },
    (d, value_fn) => {
      const ticker =
        dh.company_list[selected_company_indexes[d.index]]["Ticker Symbol"];
      return `${((value_fn(d.index) / d.value) * 100).toFixed(
        2
      )}% of ${ticker} holdings was bought during this period`;
    }
  ).style("opacity", 0.5);

  draw_outer_arcs(
    group,
    chord_radius + arc_chord_padding + arc_width + arc_margin,
    arc_width,
    (index) => {
      return (
        sumRow(simple_transaction_matrix, index) -
        simple_transaction_matrix[index][index]
      );
    },
    (d, value_fn) => {
      const ticker =
        dh.company_list[selected_company_indexes[d.index]]["Ticker Symbol"];
      return `${((value_fn(d.index) / d.value) * 100).toFixed(
        2
      )}% of ${ticker} holdings entered during this period from other selected stocks`;
    }
  ).style("opacity", 1);

  //Add the Exit arcs
  draw_outer_arcs(
    group,
    chord_radius + arc_chord_padding + 2 * arc_width + 2 * arc_margin,
    arc_width,
    (index) => {
      index = selected_company_indexes[index];
      return (
        sumCol(full_transaction_matrix, index) -
        full_transaction_matrix[index][index]
      );
    },
    (d, value_fn) => {
      const ticker =
        dh.company_list[selected_company_indexes[d.index]]["Ticker Symbol"];
      return `${((value_fn(d.index) / d.value) * 100).toFixed(
        2
      )}% of ${ticker} holdings was sold during this period`;
    }
  ).style("opacity", 0.5);

  draw_outer_arcs(
    group,
    chord_radius + arc_chord_padding + 2 * arc_width + 2 * arc_margin,
    arc_width,
    (index) => {
      return (
        sumCol(simple_transaction_matrix, index) -
        simple_transaction_matrix[index][index]
      );
    },
    (d, value_fn) => {
      const ticker =
        dh.company_list[selected_company_indexes[d.index]]["Ticker Symbol"];
      return `${((value_fn(d.index) / d.value) * 100).toFixed(
        2
      )}% of ${ticker} holdings exited during this period to other selected stocks`;
    }
  ).style("opacity", 1);
}

function draw_outer_arcs(
  group,
  inner_radius,
  arc_width,
  get_value,
  get_tooltip = (d, v) => {
    return "not defined";
  }
) {
  return group
    .append("g")
    .append("path")
    .style("fill", (d) => {
      return getColorFromIndex(d.index);
    })
    .attr(
      "d",
      d3
        .arc()
        .endAngle((d) => {
          const angle_width = d.endAngle - d.startAngle;
          return Math.min(
            d.endAngle,
            d.startAngle + (get_value(d.index) / d.value) * angle_width
          );
        })
        .innerRadius(inner_radius)
        .outerRadius(inner_radius + arc_width)
        .cornerRadius(0)
    )
    .attr("transform", `translate(${svg_width / 2}, ${svg_height / 2})`)
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(get_tooltip(d, get_value));
      handleMouseMove(event);
    })
    .on("mousemove", (event) => handleMouseMove(event))
    .on("mouseout", () => handleMouseOut());
}

function groupTicks(d, step) {
  const angle_diff = ((d.endAngle - d.startAngle) * 180) / Math.PI;
  if (angle_diff < 10) step = 100;
  else if (angle_diff < 30) step = 50;
  else step = 25;
  var k = (d.endAngle - d.startAngle) / d.value;
  return d3.range(0, 101, step).map(function (value) {
    return {
      value: value,
      angle: d.value * (value / 100) * k + d.startAngle,
      index: d.index,
    };
  });
}

function updateSelectedCompanyIndexes() {
  selected_company_indexes = [];
  for (const ticker of dh.selected_company_list) {
    selected_company_indexes.push(dh.ticker_to_index.get(ticker));
  }
  selected_company_indexes.sort();
}

function getFilteredFundData() {
  const from_date = utils.dateToStr(dh.getFromDate());
  const to_date = utils.dateToStr(dh.getToDate());
  let filtered_fund_data = [];
  for (const data of dh.fund_data) {
    if ((data["date"] >= from_date) & (data["date"] <= to_date))
      filtered_fund_data.push(data);
  }
  return filtered_fund_data;
}

function updateFinalStockHoldings(filtered_fund_data) {
  const last_transaction = filtered_fund_data[filtered_fund_data.length - 1];
  let values_at_end = last_transaction["values"];

  values_at_end[last_transaction["from"]] -= last_transaction["amount"];
  values_at_end[last_transaction["to"]] += last_transaction["amount"];

  final_stock_holdings = values_at_end;
}

function getFullTransactionMatrix(filtered_fund_data) {
  let transaction_matrix = Array.from(Array(50), (_) => Array(50).fill(0));

  for (const data of filtered_fund_data) {
    transaction_matrix[data["from"]][data["to"]] += data["amount"];
    // transaction_matrix[data["to"]][data["from"]] += data["amount"];
  }
  return transaction_matrix;
}

function simplifyTransactionMatrix(transaction_matrix) {
  const selected_indexes = new Set(selected_company_indexes);

  //Remove transactions of unselected stocks
  for (let ii = 0; ii < transaction_matrix.length; ii++) {
    const ii_is_selected = selected_indexes.has(ii);
    for (let jj = 0; jj < transaction_matrix[0].length; jj++) {
      const jj_is_selected = selected_indexes.has(jj);
      if (!ii_is_selected & !jj_is_selected) transaction_matrix[ii][jj] = 0;
    }
  }

  //Compute final transactions
  // for (var ii = 0; ii < transaction_matrix.length; ii++) {
  //   for (var jj = ii + 1; jj < transaction_matrix.length; jj++) {
  //     if (transaction_matrix[ii][jj] >= transaction_matrix[jj][ii]) {
  //       transaction_matrix[jj][ii] =
  //         transaction_matrix[ii][jj] - transaction_matrix[jj][ii];
  //       transaction_matrix[ii][jj] = 0;
  //     } else {
  //       transaction_matrix[ii][jj] =
  //         transaction_matrix[jj][ii] - transaction_matrix[ii][jj];
  //       transaction_matrix[jj][ii] = 0;
  //     }
  //   }
  // }

  //Add Final stock holdings
  for (var ii = 0; ii < final_stock_holdings.length; ii++)
    transaction_matrix[ii][ii] = final_stock_holdings[ii];

  //Filter out unselected stocks
  let simple_transaction_matrix = [];
  for (const ii of selected_company_indexes) {
    let arr = [];
    for (const jj of selected_company_indexes) {
      arr.push(transaction_matrix[ii][jj]);
    }
    simple_transaction_matrix.push(arr);
  }

  // Calculate unchanges stock value
  for (var ii = 0; ii < simple_transaction_matrix.length; ii++) {
    const enter_sum =
      sumRow(simple_transaction_matrix, ii) - simple_transaction_matrix[ii][ii];
    simple_transaction_matrix[ii][ii] -= enter_sum;
  }

  return simple_transaction_matrix;
}

function sumRow(matrix, index) {
  return matrix[index].reduce((a, b) => a + b, 0);
}
function sumCol(matrix, index) {
  var sum = 0;
  for (var ii = 0; ii < matrix.length; ii++) sum += matrix[ii][index];
  return sum;
}

function preprocessFundData() {
  const filtered_fund_data = getFilteredFundData();
  updateFinalStockHoldings(filtered_fund_data);
  full_transaction_matrix = getFullTransactionMatrix(filtered_fund_data);
  simple_transaction_matrix = simplifyTransactionMatrix(
    full_transaction_matrix
  );
}

function getColorFromIndex(index) {
  return utils.color(
    dh.company_list[selected_company_indexes[index]]["Ticker Symbol"]
  );
}

function handleMouseMove(event) {
  tooltip
    .style("left", event.pageX + 12 + "px")
    .style("top", event.pageY + "px");
}

function handleMouseOut() {
  tooltip.transition().duration(500).style("opacity", 0);
}
