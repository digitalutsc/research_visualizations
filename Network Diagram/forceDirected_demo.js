var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var color = d3.scaleOrdinal()                                                       //set node color below
    .domain(["Venetian Colonial","Venetian Citizen", "Ottoman", "Unknown","Other"])
    .range(["#5983D9", "#A63D33", "#D9AE89", "#45554E","#593640"]);

var simulation = d3.forceSimulation()
    .force("link", d3.forceLink().id(function(d) { return d.id; }))
    .force("charge", d3.forceManyBody().strength(-230))                             //set distance between nodes here
    .force("x", d3.forceX(width/2))
    .force("y", d3.forceY(height/2));


d3.json("https://raw.githubusercontent.com/digitalutsc/dragomans_visualizations/master/viz1.json.json", function(error, graph) {                                       //set input data file here
  if (error) throw error;

  var link = svg.append("g")
      .attr("class", "links")
    .selectAll("line")
    .data(graph.links)
    .enter().append("line")
      .attr("stroke-width", function(d) { return 3.8*d.weight; });                //set edge thickness here

  var node = svg.append("g")
      .attr("class", "nodes")
    .selectAll("g")
    .data(graph.nodes)
    .enter().append("g")    

  var circles = node.append("circle")
      .attr("r", function(d){return 4*d.node_size})                                 // set node radius here
      .attr("fill", function(d) { return color(d.subjecthood) })              
      .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));
      
  var labels = node.append("text")
      .text(function(d) {return d.label;})
      .attr('x', 13)
      .attr('y', 5)
      .style("font-size",function(d){return 1.5*(d.node_size + 7) + "px";})        //set label text size here

  node.append("title")
      .text(function(d) { return d.labels; })
      
  simulation
      .nodes(graph.nodes)
      .on("tick", ticked);

  simulation.force("link")
      .links(graph.links);

  function ticked() {
    link
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .attr('class', 'link')
   node
        .attr("transform", function(d) {
          return "translate(" + d.x + "," + d.y + ")";
        })
    }
});

function dragstarted(d) {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d.fx = d.x;
  d.fy = d.y;
}

function dragged(d) {
  d.fx = d3.event.x;
  d.fy = d3.event.y;
}

function dragended(d) {
  if (!d3.event.active) simulation.alphaTarget(0);
  //d.fx = null;
  //d.fy = null;
}

var sequentialScale = d3.scaleOrdinal(d3.schemeSet3)                                //set ledgend lables below
    .domain(["Venetian Colonial","Venetian Citizen", "Ottoman", "Unknown","Other"])
    .range(["#5983D9", "#A63D33", "#D9AE89", "#45554E","#593640"]);

svg.append("g")
    .attr("class", "legendSequential")
    .attr("transform", "translate("+(width-140)+","+(height-200)+")")
    .style("font-size", function(d){return 20});

var legendSequential = d3.legendColor()
      .shapeWidth(30)
      .cells(11)
      .orient("vertical")
          .title("Subjecthood by color:")
          .titleWidth(140)
      .scale(sequentialScale) 
  
svg.select(".legendSequential")
    .call(legendSequential); 
