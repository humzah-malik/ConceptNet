export default App

import MindMap from './MindMap';

function App() {
  const sampleGraph = {
    nodes: [
      { id: 1, label: 'Python', weight: 10 },
      { id: 2, label: 'Django', weight: 6 }
      // …
    ],
    links: [
      { source: 1, target: 2, weight: 0.8, relation: 'web framework' }
      // …
    ]
  };

  return (
    <div className="p-6">
-     {/* your old JSX */}
+     <MindMap graph={sampleGraph} />
    </div>
  );
}
