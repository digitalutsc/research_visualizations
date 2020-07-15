// extend javascript array class by a remove function
// copied from https://stackoverflow.com/a/3955096/12267732

//check https://stackoverflow.com/questions/60107431/d3-tree-with-collapsing-boxes-using-d3-version-4
Array.prototype.remove = function () {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

// mark unions
for (var k in data.unions) {
    data.unions[k].isUnion = true
}
// mark persons
for (var k in data.persons) {
    data.persons[k].isUnion = false
}

// Set the dimensions and margins of the diagram
var screen_width = 1120,
    screen_height = 800;

var rectHeight = 32, 
    rectWidth = 123;

var nodeX = (rectWidth/5+ 10)*-1, 
    nodeY = (rectHeight/2 )*-1;

// initialize panning, zooming
var zoom = d3.zoom()
    .on("zoom", _ => g.attr("transform", d3.event.transform));


// initialize tooltips
var tip = d3.tip()
    .attr('class', 'd3-tip')
    .direction('e')
    .offset([0, 5])
    .html(
        function (d) {
            if (d.data.isUnion) return;
            var content = "<b>" + d.data.name + "</b>"

            if (d.data.class.includes("dragoman") == true){
                content += "<b> is a dragoman </b>"}

            content += `<br> ID: ` + d.data.id + `<br></span>`;
            if (d.data.class.includes("portrait") == true){
                content += `<img src="https://dragomans.digitalscholarship.utsc.utoronto.ca/sites/default/files/Fig.0.2.Dragoman%20from%20Mamuca%20della%20Torre%201723%20ONB%20574.jpg" width=150 height=200> <br>`}

            
            return content.replace(new RegExp("null", "g"), "?")
        }
    );


// append the svg object to the body of the page
// assigns width and height
// activates zoom/pan and tooltips
const svg = d3.select("#kingship-diagram-1").append("svg")
    .attr("width", screen_width)
    .attr("height", screen_height)
    .call(zoom)
    .call(tip)

// append group element
const g = svg.append("g");

// helper variables
var i = 0,
    duration = 750,
    x_sep = 160,
    y_sep = 50;

// declare a dag layout
var tree = d3.sugiyama()
    .nodeSize([y_sep, x_sep])
    .layering(d3.layeringSimplex())
    .decross(d3.decrossTwoLayer)
    .coord(d3.coordVert())
    .separation(
        (a, b) => { return 0.1 }
    );

// make dag from edge list
dag = d3.dagConnect()(data.links);

// in order to make the family tree work, the dag
// must be a node with id undefined. create that node if
// not done automaticaly
if(dag.id !=undefined){
    root = dag.copy();
    root.id = undefined;
    root.children = [dag];
    dag = root;
}

// prepare node data
var all_nodes = dag.descendants()
all_nodes.forEach(n => {
    n.data = data.persons[n.id] ? data.persons[n.id] : data.unions[n.id];
    n._children = n.children; // all nodes collapsed by default
    n.children = [];
    n.inserted_nodes = [];
    n.inserted_roots = [];
    n.neighbors = [];
    n.visible = false;
    n.inserted_connections = [];
});

// find root node and assign data
root = all_nodes.find(n => n.id == data.start);
root.visible = true;
root.neighbors = getNeighbors(root);
root.x0 = screen_width * 0.2;
root.y0 = screen_height * 0.6;

// overwrite dag root nodes
dag.children = [root];



// draw dag
uncollapse(root);
update(root);


// collapse a node
function collapse(d) {
    // remove root nodes and circle-connections
    var remove_inserted_root_nodes = n => {
        // remove all inserted root nodes
        dag.children = dag.children.filter(c => !n.inserted_roots.includes(c));
        // remove inserted connections
        n.inserted_connections.forEach(
            arr => {
                // check existence to prevent double entries
                // which will cause crashes
                if (arr[0].children.includes(arr[1])) {
                    arr[0]._children.push(arr[1]);
                    arr[0].children.remove(arr[1]);
                }
            }
        )
        // repeat for all inserted nodes
        n.inserted_nodes.forEach(remove_inserted_root_nodes);
    };
    remove_inserted_root_nodes(d);

    // collapse neighbors which are visible and have been inserted by this node
    var vis_inserted_neighbors = d.neighbors.filter(n => n.visible & d.inserted_nodes.includes(n));
    vis_inserted_neighbors.forEach(
        n => {
            // tag invisible
            n.visible = false;
            // if child, delete connection
            if (d.children.includes(n)) {
                d._children.push(n);
                d.children.remove(n);
            }
            // if parent, delete connection
            if (n.children.includes(d)) {
                n._children.push(d);
                n.children.remove(d);
            }
            // if union, collapse the union
            if (n.data.isUnion) {
                collapse(n);
            }
            // remove neighbor handle from clicked node
            d.inserted_nodes.remove(n);
        }
    );
}

// uncollapse a node
function uncollapse(d, make_roots) {
    if (d == undefined) return;
    // neighbor nodes that are already visible (happens when 
    // circles occur): make connections, save them to
    // destroy / rebuild on collapse
    var extended_neighbors = d.neighbors.filter(n => n.visible)
    extended_neighbors.forEach(
        n => {
            // if child, make connection
            if (d._children.includes(n)) {
                d.inserted_connections.push([d, n]);
            }
            // if parent, make connection
            if (n._children.includes(d)) {
                d.inserted_connections.push([n,d]);
            }
        }
    )

    // neighbor nodes that are invisible: make visible, make connections, 
    // add root nodes, add to inserted_nodes
    var collapsed_neighbors = d.neighbors.filter(n => !n.visible);
    collapsed_neighbors.forEach(
        n => {
            // collect neighbor data
            n.neighbors = getNeighbors(n);
            // tag visible
            n.visible = true;
            // if child, make connection
            if (d._children.includes(n)) {
                d.children.push(n);
                d._children.remove(n);
            }
            // if parent, make connection
            if (n._children.includes(d)) {
                n.children.push(d);
                n._children.remove(d);
                // insert root nodes if flag is set
                if (make_roots & !d.inserted_roots.includes(n)) {
                    d.inserted_roots.push(n);
                }
            }
            // if union, uncollapse the union
            if (n.data.isUnion) {
                uncollapse(n, true);
            }
            // save neighbor handle in clicked node
            d.inserted_nodes.push(n);
        }
    )

    // make sure this step is done only once
    if (!make_roots) {
        var add_root_nodes = n => {
            // add previously inserted root nodes (partners, parents)
            n.inserted_roots.forEach(p => dag.children.push(p));
            // add previously inserted connections (circles)
            n.inserted_connections.forEach(
                arr => {
                    // check existence to prevent double entries
                    // which will cause crashes
                    if (arr[0]._children.includes(arr[1])) {
                        arr[0].children.push(arr[1]);
                        arr[0]._children.remove(arr[1]);
                    }
                }
            )
            // repeat with all inserted nodes
            n.inserted_nodes.forEach(add_root_nodes)
        };
        add_root_nodes(d);
    }
}

function is_extendable(node) {
    return node.neighbors.filter(n => !n.visible).length > 0
}

function getNeighbors(node, error) {
    if (error) throw error
    if (node.data.isUnion) {
        return getChildren(node)
            .concat(getPartners(node))
    }
    else {
        return getOwnUnions(node)
            .concat(getParentUnions(node))
    };
}

function getParentUnions(node) {
    if (node == undefined) return [];
    if (node.data.isUnion) return [];
    var u_id = node.data.parent_union;
    if (u_id) {
        var union = all_nodes.find(n => n.id == u_id);
        return [union].filter(u => u != undefined);
    }
    else return [];
}

function getParents(node) {
    var parents = [];
    if (node.data.isUnion) {
        node.data.partner.forEach(
            p_id => parents.push(all_nodes.find(n => n.id == p_id))
        );
    }
    else {
        var parent_unions = getParentUnions(node);
        parent_unions.forEach(
            u => parents = parents.concat(getParents(u))
        );
    }
    return parents.filter(p => p != undefined)
}

function getOtherPartner(node, union_data) {
    var partner_id = union_data.partner.find(
        p_id => p_id != node.id & p_id != undefined
    );
    return all_nodes.find(n => n.id == partner_id)
}

function getPartners(node) {
    var partners = [];
    // return both partners if node argument is a union
    if (node.data.isUnion) {
        node.data.partner.forEach(
            p_id => partners.push(all_nodes.find(n => n.id == p_id))
        )
    }
    // return other partner of all unions if node argument is a person
    else {
        var own_unions = getOwnUnions(node);
        own_unions.forEach(
            u => {
                partners.push(getOtherPartner(node, u.data))
            }
        )
    }
    return partners.filter(p => p != undefined)
}

function getOwnUnions(node) {
    if (node.data.isUnion) return [];
    unions = [];
    node.data.own_unions.forEach(
        u_id => unions.push(all_nodes.find(n => n.id == u_id))
    );
    return unions.filter(u => u != undefined)
}

function getChildren(node) {
    var children = [];
    if (node.data.isUnion) {
        children = node.children.concat(node._children);
    }
    else {
        own_unions = getOwnUnions(node);
        own_unions.forEach(
            u => children = children.concat(getChildren(u))
        )
    }
    // sort children by birth year, filter undefined
    children = children
        .filter(c => c != undefined)
        .sort((a, b) => Math.sign((getBirthYear(a) || 0) - (getBirthYear(b) || 0)));
    return children
}

function getBirthYear(node) {
    return new Date(node.data.birthyear || NaN).getFullYear()
}

function getDeathYear(node) {
    return new Date(node.data.deathyear || NaN).getFullYear()
}

function find_path(n) {
    var parents = getParents(n);
    var found = false;
    var result = null;
    parents.forEach(
        p => {
            if (p && !found) {
                if (p.id == "profile-89285291") {
                    found = true;
                    result = [p, n];
                }
                else {
                    result = find_path(p);
                    if (result) {
                        found = true;
                        result.push(n)
                    }
                }
            }
        }
    )
    return result
}

function expandAll(root){
    
}

function update(source) {

    // Assigns the x and y position for the nodes
    var dag_tree = tree(dag),
        nodes = dag.descendants(),
        links = dag.links();


    // ****************** Nodes section ***************************

    // Update the nodes...
    var node = g.selectAll('g.node')
        .data(nodes, function (d) { return d.id || (d.id = ++i); })

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr("transform", function (d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on('click', click)
        .on('mouseover', tip.show)
        .on('mouseout', tip.hide)
        .attr('visible', true);

    // Add Circle for the nodes
    nodeEnter.append('rect')
        .attr('class', 'node')
        .attr("width", rectWidth)
        .attr("height", rectHeight)
        .attr("x", nodeX)
        .attr("y", nodeY)
        .attr('rx', 5)
        .style("fill", function(d) { return d.data.familyColor});

    nodeEnter.append("svg:image")
        .attr("xlink:href",  function(d) {
            if (d.data.isUnion) return;
            if (d.data.class.includes("dragoman") == true) return href="https://dragomans.digitalscholarship.utsc.utoronto.ca/sites/default/files/icon_dragoman_hat.png";})
        .attr("x", function(d) { return nodeX - 18;})
        .attr("y", function(d) { return nodeY;})
        .attr("height", 17)
        .attr("width", 15);
        
    nodeEnter.append("svg:image")
        .attr("xlink:href",  function(d) {
            if (d.data.isUnion) return;
            if (d.data.class.includes("portrait") == true) return href="https://dragomans.digitalscholarship.utsc.utoronto.ca/sites/default/files/icon_portrait.png";})
        .attr("x", function(d) { return nodeX - 18;})
        .attr("y", function(d) { return nodeY + 15;})
        .attr("height", 17)
        .attr("width", 17);
    
    // Add names as node labels
    nodeEnter.append('text')
        .attr("dy", ".35em")
        .attr("x", nodeX+5)
        .attr("y", nodeY + 10)
        .attr("text-anchor", "start")
        .text(function(d) {
            if (d.data.isUnion) return;
            return d.data.forename})
        
        .append("tspan")
        .attr("dy", "1.25em")
        .attr("x", nodeX+5)
        .attr("text-anchor", "start")
        .text(function (d) {
            if (d.data.isUnion) return;
            return d.data.surname
        });

    // UPDATE
    var nodeUpdate = nodeEnter.merge(node);

    // Transition to the proper position for the node
    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + d.y + "," + d.x + ")";
        });

    // Update the node attributes and style
    nodeUpdate.select('rect.node')
        .attr('width', d => rectWidth * !d.data.isUnion + 0 * d.data.isUnion)
        .attr('height', d => rectHeight * !d.data.isUnion + 0 * d.data.isUnion)
        .style("stroke", function (d) {
            return is_extendable(d) ? "black" : "transparent";
        })
        .style("stroke-dasharray", "0.25em")
        .attr('cursor', 'pointer');


    // Remove any exiting nodes
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + source.y + "," + source.x + ")";
        })
        .attr('visible', false)
        .remove();

    // On exit reduce the node circles size to 0
    nodeExit.select('circle')
        .attr('r', 2e-6);
        

    // On exit reduce the opacity of text labels
    nodeExit.select('text')
        .style('fill-opacity', 2e-6);

    // ****************** Links section ***************************

    // Update the links...
    var link = g.selectAll('path.link')
        .data(links, function (d) { return d.source.id + d.target.id });
        
        

    // Enter any new links at the parent's previous position.
    var linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        //.style("stroke", function(d){return d.target.data.familyColor})
        .attr('d', function (d) {
            var o = { x: source.x0, y: source.y0 }
            return diagonal(o, o)});

    // UPDATE
    var linkUpdate = linkEnter
        .merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', d => diagonal(d.source, d.target));

    // Remove any exiting links
    var linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function (d) {
            var o = { x: source.x, y: source.y }
            return diagonal(o, o)
        })
        .remove();

    // expanding a big subgraph moves the entire dag out of the window
    // to prevent this, cancel any transformations in y-direction
    svg.transition()
        .duration(duration)
        .call(
            zoom.transform,
            d3.zoomTransform(g.node()).translate(-(source.y - source.y0), -(source.x - source.x0)),
        );

    // Store the old positions for transition.
    nodes.forEach(function (d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });


    // Creates a curved (diagonal) path from parent to the child nodes
    function diagonal(s, d) {
        path = `M ${s.y} ${s.x}
                C ${(s.y + d.y+ 180) / 2} ${s.x},
                    ${(s.y + d.y - 50) / 2} ${d.x},
                    ${d.y} ${d.x}`
        return path
    }

    // Toggle unions, children, partners on click.
    function click(d) {

        // do nothing if node is union
        if (d.data.isUnion) return;

        // uncollapse if there are uncollapsed unions / children / partners
        if (is_extendable(d)) uncollapse(d)
        // collapse if fully uncollapsed
        else collapse(d)

        update(d);
    }
}


// ****************** Legends section ***************************
var textX = 40,
    textY = 600,

    rectX = 10,
    rectY = textY -10,
    alignment = 15,
    width = 23,
    height = 10;

svg.append("text").attr("x", rectX).attr("y", textY-alignment).text("Node Color by Surname:").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 0*alignment).text("Borisi").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 1*alignment).text("Brutti").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 2*alignment).text("Mascellini").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 3*alignment).text("Mamuca della Torre").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 4*alignment).text("Tarsia").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 5*alignment).text("Carli").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 6*alignment).text("Theÿls").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 7*alignment).text("Pisani").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", textX).attr("y", textY + 8*alignment).text("Olivieri").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", rectX).attr("y", textY+ 10*alignment).text("Note: Families that are not listed ").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');
svg.append("text").attr("x", rectX).attr("y", textY+ 11*alignment).text("above are set to a random color").style("font-size", "15px").attr("alignment-baseline","middle").style('fill', 'black');

svg.append("rect").attr("x", rectX).attr("y", rectY + 0*alignment).attr("width",width).attr("height",height).style("fill","#5983D9");
svg.append("rect").attr("x", rectX).attr("y", rectY + 1*alignment).attr("width",width).attr("height",height).style("fill","#A63D33");
svg.append("rect").attr("x", rectX).attr("y", rectY + 2*alignment).attr("width",width).attr("height",height).style("fill","#D9AE89");
svg.append("rect").attr("x", rectX).attr("y", rectY + 3*alignment).attr("width",width).attr("height",height).style("fill","#8b0000");
svg.append("rect").attr("x", rectX).attr("y", rectY + 4*alignment).attr("width",width).attr("height",height).style("fill","#228B22");
svg.append("rect").attr("x", rectX).attr("y", rectY + 5*alignment).attr("width",width).attr("height",height).style("fill","#800080");
svg.append("rect").attr("x", rectX).attr("y", rectY + 6*alignment).attr("width",width).attr("height",height).style("fill","#20B2AA");
svg.append("rect").attr("x", rectX).attr("y", rectY + 7*alignment).attr("width",width).attr("height",height).style("fill","#ff8c009");
svg.append("rect").attr("x", rectX).attr("y", rectY + 8*alignment).attr("width",width).attr("height",height).style("fill","#e75480");

