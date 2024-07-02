export const color = d3.scaleOrdinal(d3.schemeTableau10);

export function getElementDimensionsByID(element_id) {
  return getElementDimensions(document.getElementById(element_id));
}

export function getElementDimensions(element) {
  let rect = element.getBoundingClientRect();
  return [rect.width, rect.height];
}

export function dateToStr(date) {
  //yyyy-mm-dd format
  return date.toISOString().split("T")[0];
}

export function strToDate(str) {
  //Expected format yyyy-mm-dd
  const [year, month, day] = str.split("-");
  return new Date(year, month - 1, day);
}

export function customTickFormat(d) {
  if ((d < 1000) & (d > -1000)) return d.toString();

  const suffix = " KMBTQ";
  const is_negative = d < 0;
  d = Math.abs(d);

  var i = 0;
  while (d > 1000) {
    d = d / 1000.0;
    i++;
  }
  d = d.toFixed(3) * (is_negative ? -1 : 1);
  return d.toString() + suffix[i];
}
