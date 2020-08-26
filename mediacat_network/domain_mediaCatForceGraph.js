//------------------------Data File------------------------------------------------
var dataFile = "domain_mediaCatData.json";
//var dataFile = "domain2_mediaCatData.json"


drawNetwork(dataFile);

function drawNetwork(dataFile){

    fetch(dataFile).then(res => res.json()).then(data => {

        data.links.forEach(link => {
            const a = data.nodes[link.source];
            const b = data.nodes[link.target];
            !a.neighbors && (a.neighbors = []);
            !b.neighbors && (b.neighbors = []);
            a.neighbors.push(b);
            b.neighbors.push(a);
      
            !a.links && (a.links = []);
            !b.links && (b.links = []);
            a.links.push(link);
            b.links.push(link);
          });

        const highlightNodes = new Set();
        const highlightLinks = new Set();
        let hoverNode = null;

        const elem = document.getElementById('graph');
    
        const dashLen = 3;
        const gapLen = 2.5;
        const linkWidth = 2;
        const arrowLength = 15;
        const cooldown = 30000;
        const windowWidth = 800;


        const NODE_R = 5;

        //------------------------Floating Window------------------------------------------
        const jsFrame = new JSFrame();
        const frame = jsFrame.create({
            title: 'Instruction',
            appearanceName: "Instruction",
            left: 20, top: 20, width: 250, height: 200,
            movable: true,//Enable to be moved by mouse
            style: {
                backgroundColor: 'rgb(211,211,211)',
            },
            html: '<div style="padding:10px;font-size:12px;color:black;"> Pan and zoom using the mouse \
            </div> <div style="padding:10px;font-size:12px;color:black;"> Left click to see the description of the node </div> \
            <div style="padding:10px;font-size:12px;color:black;"> Right click to zoom and focus on the node</div>\
            <div style="padding:10px;font-size:12px;color:black;"> Size of node represents # of time it got cited </div>\
            <div style="padding:10px;font-size:12px;color:black;"> Same colour represents same domain </div>',
        });
        //Show the window
        frame.showFrameComponent('minimizeButton');
        frame.show();

        //------------------------Diagram Section------------------------------------------
        const Graph = ForceGraph()(elem)
            .backgroundColor('#101020')

            //------------------------Node section------------------------------------------
            .nodeVal(node => {return node.val/40+1})
            .nodeAutoColorBy(node => {return node.site})
            .nodeLabel(node => { node.site})
            .onNodeHover(node => {
                highlightNodes.clear();
                highlightLinks.clear();
                if (node) {
                  highlightNodes.add(node);
                  node.neighbors.forEach(neighbor => highlightNodes.add(neighbor));
                  node.links.forEach(link => highlightLinks.add(link));
                }
                hoverNode = node || null;
                elem.style.cursor = node ? '-webkit-grab' : null;
            })
            .onLinkHover(link => {
                highlightNodes.clear();
                highlightLinks.clear();
        
                if (link) {
                  highlightLinks.add(link);
                  highlightNodes.add(link.source);
                  highlightNodes.add(link.target);
                }
              })
            .nodeCanvasObjectMode(node => highlightNodes.has(node) ? 'before' : undefined)
            .nodeCanvasObject((node, ctx) => {
                // add ring just for highlighted nodes
                ctx.beginPath();
                ctx.arc(node.x, node.y, NODE_R * 1.4, 0, 2 * Math.PI, false);
                ctx.fillStyle = node === hoverNode ? 'red' : 'orange';
                ctx.fill()
            })
            // click to open pop up window for detail description
            .onNodeClick(
            node => {
                    swal.fire({
                        width: windowWidth,
                        title: node.site + " ("+ node.val + " URLs)", 
                        html: 'You can open this site <a href="'+ node.site +'"> here </a>',
                        showCloseButton: true,
                        showConfirmButton: false,
                    });
                })
            .linkDirectionalParticles(4)
            .linkDirectionalParticleWidth(link => highlightLinks.has(link) ? 4 : 0)
            // right click to focus on node
            .onNodeRightClick(node => {
                // Center/zoom on node
                Graph.centerAt(node.x, node.y, 1000);
                Graph.zoom(8, 2000);
            })
            .onNodeDragEnd(node => {
                node.fx = node.x;
                node.fy = node.y;
            })

            //------------------------Link section------------------------------------------
            .linkColor(() => 'rgba(255,255,255,0.2)')
            .linkDirectionalArrowLength(arrowLength)
            .linkLineDash(link => link.dashed && [dashLen, gapLen])
            .linkWidth(link =>{return link.weight/90 +1})

            .cooldownTime(cooldown)
            .linkCurvature(0.2)

            // draw the diagram
            .graphData(data);
        });
}
