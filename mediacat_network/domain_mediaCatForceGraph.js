//------------------------Data File------------------------------------------------
var dataFile = "domain_mediaCatData.json";


drawNetwork(dataFile);

function drawNetwork(dataFile){

    fetch(dataFile).then(res => res.json()).then(data => {

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
            // node size
            .nodeVal(node => {return node.val/40+1})
            // node colour
            //.nodeAutoColorBy(node => {return node.site})
            .nodeColor(node => {return node.color})
            // mouseover to show site name
            .nodeLabel(node => {return node.site})
            .onNodeHover(node => elem.style.cursor = node ? 'pointer' : null)
            
            // click to open pop up window for detail description
            .onNodeClick(
                node => {
                    swal.fire({
                        width: windowWidth,
                        title: node.site + " ("+ node.val + " URLs)", 
                        html: '<p>You can open this site <a href="'+ node.site +'"> here</a>' 
                        + '<br><br>Referring Sites: ' + node.referring_domain + '</p>',
                        showCloseButton: true,
                        showConfirmButton: false,
                    });
                })
            .linkDirectionalParticles(1)
            .linkDirectionalParticleSpeed(0.007)
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
        
            // set link length
            Graph.d3Force('center', null);
            Graph.d3Force('link').distance(link => link.weight/50*9 + 80);

            // fit to canvas when engine stops
            Graph.onEngineStop(() => Graph.zoomToFit(400));

        });
}
