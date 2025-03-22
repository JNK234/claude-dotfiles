"""
Visualization module for creating interactive visualizations of medical diagnosis data.
"""
import streamlit as st
import networkx as nx
import matplotlib.pyplot as plt
import pandas as pd
import re
import tempfile
import os
import base64
import logging
from io import BytesIO
from pyvis.network import Network
import tempfile
import os
from App.models.azure import AzureModel

class Visualizer:
    """
    Creates visualizations for medical diagnosis data including causal graphs,
    treatment comparisons, and other visual representations.
    """
    
    def __init__(self):
        """Initialize the visualizer."""
        try:
            self.azure_model = AzureModel()
            self.use_llm = True
        except Exception as e:
            logging.warning(f"Failed to initialize Azure LLM: {str(e)}. Falling back to rule-based methods.")
            self.use_llm = False
    
    def create_interactive_causal_graph(self, causal_links_text):
        """
        Create an interactive causal graph visualization using PyVis.
        
        Args:
            causal_links_text (str): Text containing causal links
            
        Returns:
            str: Path to the HTML file containing the interactive graph
        """
        # Parse causal links from text (reuse existing method)
        links = self._parse_causal_links(causal_links_text)
        
        # Create a PyVis network
        net = Network(height="600px", width="100%", directed=True)
        
        # Track nodes to avoid duplicates
        added_nodes = set()
        
        # Add nodes and edges
        for link in links:
            cause = link['cause']
            effect = link['effect']
            
            # Add nodes if they don't exist
            if cause not in added_nodes:
                cause_type = self._determine_node_type(cause)
                net.add_node(cause, label=cause, title=cause, color=self._get_color_for_type(cause_type))
                added_nodes.add(cause)
                
            if effect not in added_nodes:
                effect_type = self._determine_node_type(effect)
                net.add_node(effect, label=effect, title=effect, color=self._get_color_for_type(effect_type))
                added_nodes.add(effect)
            
            # Add edge
            net.add_edge(cause, effect, title=f"{cause} → {effect}")
        
        # Set physics layout options for better readability
        net.set_options("""
        {
          "physics": {
            "hierarchicalRepulsion": {
              "centralGravity": 0.0,
              "springLength": 100,
              "springConstant": 0.01,
              "nodeDistance": 120
            },
            "solver": "hierarchicalRepulsion",
            "stabilization": {
              "iterations": 100
            }
          },
          "layout": {
            "hierarchical": {
              "enabled": true,
              "direction": "LR",
              "sortMethod": "directed"
            }
          },
          "interaction": {
            "hover": true,
            "navigationButtons": true,
            "keyboard": true
          }
        }
        """)
        
        # Create temp file for the HTML output
        with tempfile.NamedTemporaryFile(delete=False, suffix='.html') as temp_file:
            html_path = temp_file.name
        
        # Save the network
        net.save_graph(html_path)
        
        return html_path
    
    def create_causal_graph(self, causal_links_text):
        """
        Create a causal graph visualization from causal links text.
        
        Args:
            causal_links_text (str): Text containing causal links
            
        Returns:
            matplotlib.figure.Figure: The causal graph figure
        """
        # Parse causal links from text
        links = self._parse_causal_links(causal_links_text)
        
        # Create a directed graph
        G = nx.DiGraph()
        
        # Add nodes and edges
        for link in links:
            G.add_edge(link['cause'], link['effect'])
        
        # Create figure
        fig, ax = plt.subplots(figsize=(10, 8))
        
        # Set up the layout
        pos = nx.spring_layout(G, seed=42)
        
        # Draw nodes with different colors based on type
        node_colors = []
        for node in G.nodes():
            node_type = self._determine_node_type(node)
            node_colors.append(self._get_color_for_type(node_type))
        
        # Draw the graph
        nx.draw_networkx_nodes(G, pos, node_size=700, node_color=node_colors, alpha=0.8, ax=ax)
        nx.draw_networkx_edges(G, pos, width=2, alpha=0.7, edge_color='gray', arrows=True, ax=ax)
        nx.draw_networkx_labels(G, pos, font_size=10, font_weight='bold', ax=ax)
        
        # Set title and remove axis
        plt.title("Causal Relationships", fontsize=16)
        plt.axis('off')
        
        return fig
    
    def _parse_causal_links_with_llm(self, causal_links_text):
        """
        Parse causal links from text using Azure LLM.
        
        Args:
            causal_links_text (str): Text containing causal links
            
        Returns:
            list: List of dictionaries with cause and effect
        """
        try:
            # Create a prompt for the LLM
            prompt = [
                ("system", """You are a medical expert specialized in identifying causal relationships in medical text.
                Your task is to extract cause-effect relationships from the provided text.
                For each causal relationship you identify, output it in the following JSON format:
                {"cause": "cause text", "effect": "effect text"}
                
                If there are multiple relationships, output one JSON object per line.
                Only extract explicit causal relationships where one medical concept directly causes or leads to another.
                Do not infer relationships that are not clearly stated in the text.
                Do not include any explanations or additional text in your response, only the JSON objects."""),
                ("user", f"Extract all causal relationships from the following medical text:\n\n{causal_links_text}")
            ]
            
            # Get response from LLM
            response = self.azure_model.invoke(prompt)
            
            # Parse the response
            links = []
            for line in response.content.strip().split('\n'):
                line = line.strip()
                if line and (line.startswith('{') or line.startswith('{')):
                    try:
                        import json
                        link_data = json.loads(line)
                        if 'cause' in link_data and 'effect' in link_data:
                            links.append({
                                'cause': link_data['cause'].strip(),
                                'effect': link_data['effect'].strip()
                            })
                    except json.JSONDecodeError:
                        continue
            
            return links
        except Exception as e:
            logging.warning(f"Error parsing causal links with LLM: {str(e)}")
            return []
    
    def _parse_causal_links(self, causal_links_text):
        """
        Parse causal links from text.
        
        Args:
            causal_links_text (str): Text containing causal links
            
        Returns:
            list: List of dictionaries with cause and effect
        """
        # Try using LLM first if available
        if hasattr(self, 'use_llm') and self.use_llm:
            llm_links = self._parse_causal_links_with_llm(causal_links_text)
            if llm_links:
                return llm_links
        
        # Fallback to regex-based parsing
        links = []
        
        # Look for patterns like "X → Y" or "X -> Y"
        arrow_pattern = r'([^→\n]+)(?:→|->)([^→\n]+)'
        matches = re.finditer(arrow_pattern, causal_links_text)
        
        for match in matches:
            cause = match.group(1).strip()
            effect = match.group(2).strip()
            if cause and effect:
                links.append({
                    'cause': cause,
                    'effect': effect
                })
        
        return links
    
    def _determine_node_type_with_llm(self, node_text):
        """
        Determine the type of node based on text using Azure LLM.
        
        Args:
            node_text (str): The node text
            
        Returns:
            str: The node type
        """
        try:
            # Create a prompt for the LLM
            prompt = [
                ("system", """You are a medical expert specialized in categorizing medical concepts.
                Your task is to categorize the given medical term into one of the following categories:
                - symptom: Signs or symptoms experienced by patients (e.g., pain, fever, nausea)
                - condition: Diseases, disorders, or medical conditions (e.g., diabetes, cancer, heart failure)
                - diagnostic: Tests, scans, or diagnostic procedures (e.g., MRI, blood test, biopsy)
                - treatment: Medications, therapies, or interventions (e.g., surgery, antibiotics, physical therapy)
                - other: Any medical concept that doesn't fit the above categories
                
                Respond with ONLY the category name in lowercase, without any additional text or explanation."""),
                ("user", f"Categorize the following medical term: {node_text}")
            ]
            
            # Get response from LLM
            response = self.azure_model.invoke(prompt)
            
            # Parse the response
            node_type = response.content.strip().lower()
            
            # Validate the response
            valid_types = ['symptom', 'condition', 'diagnostic', 'treatment', 'other']
            if node_type in valid_types:
                return node_type
            else:
                # If the response doesn't match any valid type, use the fallback method
                return None
        except Exception as e:
            logging.warning(f"Error determining node type with LLM: {str(e)}")
            return None
    
    def _determine_node_type(self, node_text):
        """
        Determine the type of node based on text.
        
        Args:
            node_text (str): The node text
            
        Returns:
            str: The node type
        """
        # Try using LLM first if available
        # if hasattr(self, 'use_llm') and self.use_llm:
        #     llm_type = self._determine_node_type_with_llm(node_text)
        #     if llm_type:
        #         return llm_type
        
        # Fallback to keyword-based classification
        node_lower = node_text.lower()
        
        # Simple heuristic - would need to be enhanced for real-world use
        if any(term in node_lower for term in ['pain', 'fever', 'nausea', 'vomiting', 'bleeding', 'cough', 'headache']):
            return 'symptom'
        elif any(term in node_lower for term in ['disease', 'syndrome', 'disorder', 'infection', 'failure', 'cancer']):
            return 'condition'
        elif any(term in node_lower for term in ['test', 'scan', 'x-ray', 'mri', 'ct', 'ultrasound', 'biopsy']):
            return 'diagnostic'
        elif any(term in node_lower for term in ['medication', 'drug', 'therapy', 'treatment', 'surgery']):
            return 'treatment'
        else:
            return 'other'
    
    def _get_color_for_type(self, node_type):
        """
        Get color for node type.
        
        Args:
            node_type (str): The node type
            
        Returns:
            str: The color for the node type
        """
        colors = {
            'symptom': '#FF6B6B',  # Red
            'condition': '#4ECDC4',  # Teal
            'diagnostic': '#FFD166',  # Yellow
            'treatment': '#6A0572',  # Purple
            'other': '#C7F9CC'  # Light green
        }
        return colors.get(node_type, '#CCCCCC')  # Default gray
    
    def create_treatment_comparison(self, treatment_plan_text):
        """
        Create a treatment comparison visualization.
        
        Args:
            treatment_plan_text (str): Text containing treatment plan
            
        Returns:
            matplotlib.figure.Figure: The treatment comparison figure
        """
        # Parse treatments from text
        treatments = self._parse_treatments(treatment_plan_text)
        
        if not treatments:
            # Create empty figure with message if no treatments found
            fig, ax = plt.subplots(figsize=(10, 6))
            ax.text(0.5, 0.5, "No treatment data found for visualization", 
                    horizontalalignment='center', verticalalignment='center',
                    transform=ax.transAxes, fontsize=14)
            ax.axis('off')
            return fig
        
        # Create DataFrame
        df = pd.DataFrame(treatments)
        
        # Sort by effectiveness
        df = df.sort_values('effectiveness', ascending=False)
        
        # Create bar chart
        fig, ax = plt.subplots(figsize=(10, 6))
        bars = ax.barh(df['name'], df['effectiveness'], color=df['color'])
        
        # Add category labels
        for i, bar in enumerate(bars):
            ax.text(bar.get_width() + 0.02, bar.get_y() + bar.get_height()/2, 
                    df['category'].iloc[i], va='center')
        
        # Set labels and title
        ax.set_xlabel('Effectiveness')
        ax.set_title('Treatment Effectiveness Comparison')
        
        # Set y-axis limits
        ax.set_xlim(0, 1.2)
        
        return fig
    
    def _parse_treatments(self, treatment_plan_text):
        """
        Parse treatments from treatment plan text.
        
        Args:
            treatment_plan_text (str): Text containing treatment plan
            
        Returns:
            list: List of dictionaries with treatment information
        """
        treatments = []
        
        # Look for treatment categorization patterns
        causal_pattern = r'([^–\n]+)–\s*✅\s*Causal Treatment'
        preventative_pattern = r'([^–\n]+)–\s*✅\s*Preventative Treatment'
        symptomatic_pattern = r'([^–\n]+)–\s*❌\s*Symptomatic Treatment'
        
        # Find all matches
        causal_matches = re.finditer(causal_pattern, treatment_plan_text)
        preventative_matches = re.finditer(preventative_pattern, treatment_plan_text)
        symptomatic_matches = re.finditer(symptomatic_pattern, treatment_plan_text)
        
        # Process causal treatments
        for match in causal_matches:
            name = match.group(1).strip()
            if name:
                treatments.append({
                    'name': name,
                    'category': 'Causal',
                    'effectiveness': 0.9,  # Assumed high effectiveness
                    'color': '#4CAF50'  # Green
                })
        
        # Process preventative treatments
        for match in preventative_matches:
            name = match.group(1).strip()
            if name:
                treatments.append({
                    'name': name,
                    'category': 'Preventative',
                    'effectiveness': 0.7,  # Assumed medium effectiveness
                    'color': '#2196F3'  # Blue
                })
        
        # Process symptomatic treatments
        for match in symptomatic_matches:
            name = match.group(1).strip()
            if name:
                treatments.append({
                    'name': name,
                    'category': 'Symptomatic',
                    'effectiveness': 0.5,  # Assumed lower effectiveness
                    'color': '#FFC107'  # Yellow
                })
        
        # If no treatments found with the pattern, try a simpler approach
        if not treatments:
            # Look for numbered treatments
            treatment_pattern = r'\d+\.\s*([^:\n]+)'
            matches = re.finditer(treatment_pattern, treatment_plan_text)
            
            for match in matches:
                name = match.group(1).strip()
                if name:
                    # Determine category based on keywords
                    category = 'Other'
                    effectiveness = 0.6
                    color = '#9C27B0'  # Purple
                    
                    name_lower = name.lower()
                    if any(term in name_lower for term in ['surgery', 'removal', 'repair', 'transplant']):
                        category = 'Causal'
                        effectiveness = 0.9
                        color = '#4CAF50'  # Green
                    elif any(term in name_lower for term in ['prevent', 'prophylactic', 'reduce risk']):
                        category = 'Preventative'
                        effectiveness = 0.7
                        color = '#2196F3'  # Blue
                    elif any(term in name_lower for term in ['pain', 'symptom', 'relief', 'comfort']):
                        category = 'Symptomatic'
                        effectiveness = 0.5
                        color = '#FFC107'  # Yellow
                    
                    treatments.append({
                        'name': name,
                        'category': category,
                        'effectiveness': effectiveness,
                        'color': color
                    })
        
        return treatments
    
    def get_legend_html(self):
        """
        Get HTML for the node type legend.
        
        Returns:
            str: HTML for the legend
        """
        legend_html = """
        <div style="background-color: #f9f9f9; padding: 10px; border-radius: 5px; margin-bottom: 20px;">
            <h4 style="margin-top: 0;">Node Types</h4>
            <div style="display: flex; flex-wrap: wrap;">
                <div style="margin-right: 20px; display: flex; align-items: center;">
                    <div style="width: 15px; height: 15px; background-color: #FF6B6B; border-radius: 50%; margin-right: 5px;"></div>
                    <span>Symptom</span>
                </div>
                <div style="margin-right: 20px; display: flex; align-items: center;">
                    <div style="width: 15px; height: 15px; background-color: #4ECDC4; border-radius: 50%; margin-right: 5px;"></div>
                    <span>Condition</span>
                </div>
                <div style="margin-right: 20px; display: flex; align-items: center;">
                    <div style="width: 15px; height: 15px; background-color: #FFD166; border-radius: 50%; margin-right: 5px;"></div>
                    <span>Diagnostic</span>
                </div>
                <div style="margin-right: 20px; display: flex; align-items: center;">
                    <div style="width: 15px; height: 15px; background-color: #6A0572; border-radius: 50%; margin-right: 5px;"></div>
                    <span>Treatment</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="width: 15px; height: 15px; background-color: #C7F9CC; border-radius: 50%; margin-right: 5px;"></div>
                    <span>Other</span>
                </div>
            </div>
        </div>
        """
        return legend_html
    
    def fig_to_base64(self, fig):
        """
        Convert matplotlib figure to base64 string.
        
        Args:
            fig (matplotlib.figure.Figure): The figure to convert
            
        Returns:
            str: Base64 encoded string of the figure
        """
        buf = BytesIO()
        fig.savefig(buf, format='png', bbox_inches='tight')
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        return img_str
    
    def update_causal_graph(self, graph_html_path, new_causal_links_text):
        """
        Update an existing causal graph with new causal links.
        
        Args:
            graph_html_path (str): Path to the existing graph HTML file
            new_causal_links_text (str): Text containing new causal links
            
        Returns:
            str: Path to the updated HTML file
        """
        # Parse new causal links
        new_links = self._parse_causal_links(new_causal_links_text)
        
        # Create a new PyVis network
        net = Network(height="600px", width="100%", directed=True)
        
        # Try to load existing nodes and edges from the HTML file
        existing_nodes = set()
        existing_edges = set()
        
        try:
            # Load the existing graph data
            import re
            with open(graph_html_path, 'r') as f:
                content = f.read()
            
            # Extract nodes data
            nodes_match = re.search(r'var nodes = new vis\.DataSet\(\[(.*?)\]\);', content, re.DOTALL)
            if nodes_match:
                nodes_data = nodes_match.group(1)
                # Parse node IDs and labels
                node_matches = re.finditer(r'\{.*?"id":\s*"(.*?)".*?"label":\s*"(.*?)".*?\}', nodes_data)
                for match in node_matches:
                    node_id = match.group(1)
                    node_label = match.group(2)
                    node_type = self._determine_node_type(node_label)
                    net.add_node(node_id, label=node_label, title=node_label, 
                                color=self._get_color_for_type(node_type))
                    existing_nodes.add(node_id)
            
            # Extract edges data
            edges_match = re.search(r'var edges = new vis\.DataSet\(\[(.*?)\]\);', content, re.DOTALL)
            if edges_match:
                edges_data = edges_match.group(1)
                # Parse edge from and to
                edge_matches = re.finditer(r'\{.*?"from":\s*"(.*?)".*?"to":\s*"(.*?)".*?\}', edges_data)
                for match in edge_matches:
                    from_node = match.group(1)
                    to_node = match.group(2)
                    net.add_edge(from_node, to_node, title=f"{from_node} → {to_node}")
                    existing_edges.add((from_node, to_node))
        except Exception as e:
            logging.warning(f"Error loading existing graph data: {str(e)}. Creating new graph.")
            existing_nodes = set()
            existing_edges = set()
        
        # Add new nodes and edges
        for link in new_links:
            cause = link['cause']
            effect = link['effect']
            
            # Add nodes if they don't exist
            if cause not in existing_nodes:
                cause_type = self._determine_node_type(cause)
                net.add_node(cause, label=cause, title=cause, color=self._get_color_for_type(cause_type))
                existing_nodes.add(cause)
                
            if effect not in existing_nodes:
                effect_type = self._determine_node_type(effect)
                net.add_node(effect, label=effect, title=effect, color=self._get_color_for_type(effect_type))
                existing_nodes.add(effect)
            
            # Add edge if it doesn't exist
            if (cause, effect) not in existing_edges:
                net.add_edge(cause, effect, title=f"{cause} → {effect}")
                existing_edges.add((cause, effect))
        
        # Set physics layout options for better readability
        net.set_options("""
        {
          "physics": {
            "hierarchicalRepulsion": {
              "centralGravity": 0.0,
              "springLength": 100,
              "springConstant": 0.01,
              "nodeDistance": 120
            },
            "solver": "hierarchicalRepulsion",
            "stabilization": {
              "iterations": 100
            }
          },
          "layout": {
            "hierarchical": {
              "enabled": true,
              "direction": "LR",
              "sortMethod": "directed"
            }
          },
          "interaction": {
            "hover": true,
            "navigationButtons": true,
            "keyboard": true
          }
        }
        """)
        
        # Save the updated network to the same file
        net.save_graph(graph_html_path)
        
        return graph_html_path
    
    def get_embedded_graph_html(self, graph_html_path):
        """
        Get HTML for embedding the interactive graph in the report.
        
        Args:
            graph_html_path (str): Path to the generated graph HTML file
            
        Returns:
            str: HTML for embedding the graph
        """
        try:
            with open(graph_html_path, 'r') as f:
                content = f.read()
                
            # Extract just the content we need (PyVis generates a full HTML page)
            # We want to extract just the visualization part
            body_content = content.split('<body>')[1].split('</body>')[0]
            
            # Get necessary scripts
            scripts = []
            for script in content.split('<script'):
                if 'vis-network' in script or 'pyvis' in script:
                    script_part = '<script' + script.split('</script>')[0] + '</script>'
                    scripts.append(script_part)
            
            scripts_str = ''.join(scripts)
            
            # Combine into a div
            embed_html = f"""
            <div class="interactive-graph-container">
                <div id="causal-graph">
                    {body_content}
                </div>
                {scripts_str}
            </div>
            """
            
            return embed_html
        except Exception as e:
            return f"<p>Error loading interactive graph: {str(e)}</p>"
