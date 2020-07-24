# [Network Graph](https://github.com/digitalutsc/dragomans_visualizations/tree/master/Network%20Diagram): D3 force directed graph

### Features:
- Node color represents the juridical status
- Text label represent the family names
- Node size represents the number of dragomans in service
- Edge thickness represents the intensity of marriage ties
- Tooltip
- Legends

### Files
- [forceDirectedGraph.html](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Network%20Diagram/forceDirectedGraph.html): An HTML file that launch the JS file below
- [forceDirected.js](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Network%20Diagram/forceDirected.js): A JS file where the main code goes
- Data:
  - [viz1.json](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Network%20Diagram/viz1.json) (53 dragoman families): Figure 1.3, Intermarriage across Istanbul’s dragomanate, ca. 1570-1720
  - [viz2.json](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Network%20Diagram/viz2.json) (29 dragoman families): Figure 1.2, Families represented in the Venetian dragomanate, ca. 1570-1720

### Demos
- https://dragomans.digitalscholarship.utsc.utoronto.ca/dragomans-visualization-1
- https://dragomans.digitalscholarship.utsc.utoronto.ca/dragomans-visualization-2


# [Kinship Diagram](https://github.com/digitalutsc/dragomans_visualizations/tree/master/Kinship%20Diagram): D3-dag
This code is based on [js_family_tree](https://github.com/BenPortner/js_family_tree) by BenPortner

### Features:
- Dragoman icon indicate whether the person is a dragoman
- Portrait icon indicate whether the person has a portrait
- Node color indicate different families
- Tooltip
- Legends

### Files
- [kinshipDiagram.html](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Kinship%20Diagram/kinshipDiagram.html): An HTML file that launch the JS file below
- [kinshipDiagram.js](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Kinship%20Diagram/kinshipDiagram.js): A JS file where the main code goes
- Data:
  - [kinship1.js](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Kinship%20Diagram/kinship1.js): Figure 2.1, The Borisi-Scoccardi-Mascellini family
  - [kinship2.js](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Kinship%20Diagram/kinship2.js): Figure 2.2 The Brutti-Borisi-Tarsia dragoman dynasty
  - [kinship3.js](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Kinship%20Diagram/kinship3.js): Figure 4.22, The Tarsia-Carli-Mamuca della Torre portraits
    - [kinship3_2.js](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Kinship%20Diagram/kinship3_2.js): Data file for diagram #3, top left island
    - [kinship3_3.js](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Kinship%20Diagram/kinship3_3.js): Data file for diagram #3, top left isolated person
    - [kinship3_4.js](https://github.com/digitalutsc/dragomans_visualizations/blob/master/Kinship%20Diagram/kinship3_4.js): Data file for diagram #3, top right island
- [construct data](https://github.com/digitalutsc/dragomans_visualizations/tree/master/Kinship%20Diagram/construct%20data): Used to generate data for kinship diagrams

### Demos
- http://dragomans.digitalscholarship.utsc.utoronto.ca/kinship-diagram-1
- http://dragomans.digitalscholarship.utsc.utoronto.ca/kinship-diagram-2
- http://dragomans.digitalscholarship.utsc.utoronto.ca/kinship-diagram-3
