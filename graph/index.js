const NODE_COLOR = 0xc6492c; // (#C6492C)
const NODE_SIZE = 15;
const NODE_HOVER_COLOR = 0xffe213; // (#ffe213)
const NODE_CONNECTION_COLOR = 0xaab172; // (#AAB172)
const LINK_FROM_COLOR = 0x732196; // (#732196)
const LINK_TO_COLOR = 0xc6492c; // (#C6492C)
const LINK_CONNECTION_FROM_COLOR = 0xffffff; // (#ffffff)
const LINK_CONNECTION_TO_COLOR = 0xffe213; // (#ffe213)
const SPRING_LENGTH = 110;
const SPRING_COEFF = 0.000001;
const GRAVITY = -2;
const THETA = 0.1;
const DRAG_COEFF = 0.3;
const TIME_STEP = 1;

var createSettingsView = require("config.pixel");
var query = require("query-string").parse(window.location.search.substring(1));
const json = require("../graphData.json");
var graph = getGraphFromQueryString(query);
var renderGraph = require("ngraph.pixel");
var addCurrentNodeSettings = require("./nodeSettings.js");
var THREE = require("three");
var createLayout = require("pixel.layout");

const layout = createLayout(graph);

var renderer = renderGraph(graph, {
  node: () => {
    return {
      color: NODE_COLOR,
      size: NODE_SIZE,
    };
  },
  link: () => {
    return {
      fromColor: LINK_FROM_COLOR,
      toColor: LINK_TO_COLOR,
    };
  },
});

var simulator = renderer.layout().simulator;
simulator.springLength(SPRING_LENGTH);
simulator.springCoeff(SPRING_COEFF);
simulator.gravity(GRAVITY);
simulator.theta(THETA);
simulator.dragCoeff(DRAG_COEFF);
simulator.timeStep(TIME_STEP);
renderer.focus();

// var settingsView = createSettingsView(renderer);
// var gui = settingsView.gui();

// var nodeSettings = addCurrentNodeSettings(gui, renderer);

renderer.on("nodehover", showNodeDetails);
renderer.on("nodeclick", resetNodeDetails);

function showNodeDetails(node) {
  if (!node) return;

  // nodeSettings.setUI(node);
  resetNodeDetails();

  var nodeUI = renderer.getNode(node.id);
  nodeUI.color = NODE_HOVER_COLOR;

  if (graph.getLinks(node.id)) {
    graph.getLinks(node.id).forEach(function (link) {
      var toNode = link.toId === node.id ? link.fromId : link.toId;
      var toNodeUI = renderer.getNode(toNode);
      toNodeUI.color = NODE_CONNECTION_COLOR;

      var linkUI = renderer.getLink(link.id);
      linkUI.fromColor = LINK_CONNECTION_FROM_COLOR;
      linkUI.toColor = LINK_CONNECTION_TO_COLOR;
    });
  }
  showNodePanel(node);
}

function resetNodeDetails() {
  graph.forEachNode(function (node) {
    var nodeUI = renderer.getNode(node.id);
    nodeUI.color = NODE_COLOR;
  });
  graph.forEachLink(function (link) {
    var linkUI = renderer.getLink(link.id);
    linkUI.fromColor = LINK_FROM_COLOR;
    linkUI.toColor = LINK_TO_COLOR;
  });

  if (document.getElementById("nodePanel")) {
    document.getElementById("nodePanel").remove();
  }

  showInitialNodePanel();
}

function getGraphFromQueryString(query) {
  var graphGenerators = require("ngraph.generators");
  var createGraph = graphGenerators[query.graph] || graphGenerators.grid;
  return query.graph
    ? createGraph(getNumber(query.n), getNumber(query.m), getNumber(query.k))
    : populateGraph();
}

function getNumber(string, defaultValue) {
  var number = parseFloat(string);
  return typeof number === "number" && !isNaN(number)
    ? number
    : defaultValue || 10;
}

function populateGraph() {
  var createGraph = require("ngraph.graph");
  var g = createGraph();

  var nodes = json.nodes;
  var links = json.links;

  nodes.forEach(function (node) {
    g.addNode(node.id, node.data);
  });
  links.forEach(function (link) {
    g.addLink(link.source, link.target);
  });

  return g;
}

function intersect(from, to, r) {
  var dx = from.x - to.x;
  var dy = from.y - to.y;
  var dz = from.z - to.z;
  var r1 = Math.sqrt(dx * dx + dy * dy + dz * dz);
  var teta = Math.acos(dz / r1);
  var phi = Math.atan2(dy, dx);

  return {
    x: r * Math.sin(teta) * Math.cos(phi) + to.x,
    y: r * Math.sin(teta) * Math.sin(phi) + to.y,
    z: r * Math.cos(teta) + to.z,
  };
}

function flyTo(camera, to, radius) {
  if (!to || to.x === undefined || to.y === undefined || to.z === undefined) {
    console.error("Invalid target position:", to);
    return;
  }

  var from = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };

  var cameraOffset = radius / Math.tan((Math.PI / 180.0) * camera.fov * 0.5);
  var cameraEndPos = intersect(from, to, cameraOffset);

  if (!cameraEndPos) {
    console.error("Failed to calculate camera end position.");
    return;
  }

  camera.position.set(to.x, to.y, to.z);
  // camera.lookAt(new THREE.Vector3(to.x, to.y, to.z));
}

function showNodePanel(node) {
  if (document.getElementById("nodePanel")) {
    document.getElementById("nodePanel").remove();
  }
  var panel = document.createElement("div");
  panel.style.position = "absolute";
  panel.style.top = "0";
  panel.style.left = "0";
  panel.style.color = "white";
  panel.style.padding = "10px";
  panel.style.marginLeft = "20px";
  panel.style.width = "300px";
  panel.style.fontFamily = "'Tiempos Headline', sans-serif";
  panel.style.maxHeight = "65%";
  panel.id = "nodePanel";
  panel.innerHTML = "<h1>" + node.data.name + "</h1>";
  if (node.data.major) {
    panel.innerHTML += "<h3>Major: " + node.data.major + "</h3>";
  }

  if (graph.getLinks(node.id)) {
    panel.innerHTML += `<p>Potential connections: ${
      graph.getLinks(node.id).length
    }</p>`;
    panel.innerHTML += `<h3>Top match:</h3>`;
    var topMatch = document.createElement("div");
    topMatch.style.display = "flex";
    topMatch.style.flexDirection = "column";
    topMatch.style.gap = "5px";
    topMatch.style.marginBottom = "10px";
    var link = graph.getLinks(node.id)[0];
    var toNode = link.toId === node.id ? link.fromId : link.toId;
    var toNodeData = graph.getNode(toNode).data;
    topMatch.innerHTML = `<strong>${toNodeData.name}</strong>`;
    topMatch.addEventListener("click", function () {
      showNodeDetails(graph.getNode(toNode));
    });
    panel.appendChild(topMatch);
  }

  document.body.appendChild(panel);
}

function showInitialNodePanel() {
  var panel = document.createElement("div");
  panel.style.position = "absolute";
  panel.style.top = "0";
  panel.style.left = "0";
  panel.style.color = "white";
  panel.style.padding = "10px";
  panel.style.marginLeft = "20px";
  panel.style.width = "300px";
  panel.style.fontFamily = "'Tiempos Headline', sans-serif";
  panel.id = "nodePanel";
  panel.innerHTML = "<h2>Hover over a node to see more details</h2>";
  document.body.appendChild(panel);
}

function getRandomNodeId() {
  console.log(json.nodes);
  if (json.nodes.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * json.nodes.length);
  return json.nodes[randomIndex];
}

function cycleThroughNodes() {
  setInterval(() => {
    const randomNode = getRandomNodeId();
    if (randomNode) {
      showNodeDetails(randomNode);
    }
  }, 5000);
}

cycleThroughNodes();

showInitialNodePanel();
