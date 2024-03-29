//------------------------Data File------------------------------------------------
var dataFile = "url_mediaCatData.json";
//var dataFile = "test_mediaCatData.json";
//var dataFile = "keywords_mediaCatData.json";
//var dataFile = "url_fewer_nodes_mediaCatData.json"


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
        const diagramByDomain = "domain_mediaCatData.json";
        const diagramByKeyword = "keywords_mediaCatData.json";

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
            .nodeVal(node => {
                if (dataFile == diagramByDomain){return node.val/40+1}
                else if (dataFile == diagramByKeyword) {return node.val/50}
                else {return node.val}
            })
            .nodeAutoColorBy(node => {
                if (dataFile == diagramByKeyword) {return node.keyword}
                else {return node.site}
            })
            .nodeLabel(node => {
                if (dataFile == diagramByDomain){return node.site}
                if (dataFile == diagramByKeyword){return node.keyword}
                else {return node.title}
            })
            .onNodeHover(node => elem.style.cursor = node ? 'pointer' : null)
            // click to open pop up window for detail description
            .onNodeClick(
            node => {
                if (dataFile == diagramByDomain){
                    swal.fire({
                        width: windowWidth,
                        title: node.site + " ("+ node.val + " URLs)", 
                        html: 'You can open this site <a href="'+ node.site +'"> here </a>',
                        showCloseButton: true,
                        showConfirmButton: false,
                    });
                }
                else if (dataFile == diagramByKeyword){
                    swal.fire({
                        width: windowWidth,
                        title: node.keyword,
                        showCloseButton: true,
                        showConfirmButton: false,
                    });
                }
                else{
                    swal.fire({
                        width: windowWidth,
                        title: node.title,
                        html: '<p>You can open this URL <a href="'+ node.url +'" target="_blank"> here </a></p>',
                        footer: '<p>Authors: '+ node.authors 
                            +'<br> Date Published: '+ node.date_published 
                            +'<br>Matched Keywords: '+node.matched_keywords
                            +'<br># of referring sites: '+ (node.val-1) +'</p>',
                        showCloseButton: true,
                        showConfirmButton: false,
                    });
                }
            })
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
            .linkWidth(link =>{
                if (dataFile == diagramByDomain){return link.weight/90 +1}
                else{return linkWidth}
            })

            .cooldownTime(cooldown)
            .linkCurvature(0.2)

            // draw the diagram
            .graphData(data);

        });
}
