# Jsonld-vis-Example
Example of the jsonvis visualizer tool, found at https://github.com/science-periodicals/jsonld-vis

To use, install d3 and express:
- npm i d3
- npm i express

Then open the jsonld folder, and run 'npm start' to start up the server. You can then see the live page at http://127.0.0.1:3000/    

To find and edit new graphs, use the example.min.js source folder. Example graph code:  

```javascript
_d2.default.json('./example_json_files/example_tor.json', function (err, data) {
  if (err) return console.warn(err);
  _d2.default.jsonldVis(data, '#graph-tor', { w: 700, h: 300, maxLabelWidth: 200, minRadius: 5,
											transitionDuration: 1000, transitionEase: 'cubic-in-out',
											scalingFactor: 1});
});
```

