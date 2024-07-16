# pip3 install networkx matplotlib scipy
import json
import networkx as nx
import matplotlib.pyplot as plt

# Load the JSON data
with open('graphData.json', 'r') as file:
    data = json.load(file)

# Create a graph
G = nx.Graph()

# Add nodes
for node in data['nodes']:
    G.add_node(node['id'], name=node['data']['response'])

# Add edges
for link in data['links']:
    G.add_edge(link['source'], link['target'])

# Create a larger figure
plt.figure(figsize=(20, 10))

# Use a different layout algorithm
# pos = nx.spring_layout(G, k=0.5, iterations=50)
pos = nx.kamada_kawai_layout(G)



# Draw the graph
nx.draw(G, pos, 
        node_color='lightblue',
        node_size=1000,
        with_labels=False,
        width=0.5,
        alpha=0.7)

# Add labels with smaller font and slight offset
labels = nx.get_node_attributes(G, 'name')
label_pos = {k: (v[0], v[1]+0.02) for k, v in pos.items()}  # offset labels
nx.draw_networkx_labels(G, label_pos, labels, font_size=6)

# Remove axis
plt.axis('off')

# Adjust the plot layout and display
plt.tight_layout()
plt.show()