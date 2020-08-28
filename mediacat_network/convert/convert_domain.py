""" Convert raw MediaCat data to readable force-graph data
    Each node represent one domain site

This script allows the user to read raw MediaCat JSON data and 
convert to a JSON file that can be read by force-graph library 
(https://github.com/vasturiano/force-graph)

Define:
    - Source URL = the article got cited by others, "is_source" = True
    - Referring URL = the article cites other articles, "is_referring" = True

Note 1: Arrow direction: source domain -> referring domain
Note 3: Size of the node is equal to the number of time this domain got cited

----------------------- Format of the raw JSON ---------------------------
    {
      "url": {
        "title": str,
        "authors": [str],
        “date_added”: str,
        "date_published": str,
        "matched_keywords": [str],
        "matched_source_twitter_accounts": [
            {
                "matched": boolean,
                "name": str
            }
        ],
        "referring_sites": [str],
        "is_referring": boolean,
        "is_source": boolean,
        "site": str,
        "matched_source_sites": [
            {
                "matched": boolean,
                "site": str,
                "url": str
            }
        ]
      }
    }

----------------------- Format of the new JSON --------------------------
    {
        "nodes": [
            {"id": int,
            "site": str,
            "list_url": [str]
            "val": int
            "num_url": int
            "referring_domain": str
            "color": str}
        ],
        "links": [
            {
            "source": int
            "target": int
            "weight": boolean
            }
        ]
    }
"""

import json
import random


def get_node(key, index_data, list_nodes):
    """(str, dict, dict) -> None
    This is a helper function for loop_through
    The function takes in a string of URL, a dictionary containing 
    info about this URL, and a dictionary used to store these info in 
    new JSON format.
    Nothing will be returned. 
    """
    # find the domain site of the given URL
    this_url = key.lower()
    site = index_data["site"].lower()
    
    # store the given URL info to list_nodes 
    this_site = list_nodes[site]
    list_url = this_site["list_url"]
    
    # if the given URL is not in the list_nodes, append to the list
    # if the given URL is in the list, do noting
    if this_url not in list_url:
        list_url.append(this_url)


def get_link(key, index_data, list_nodes):
    '''(str, dict, dict) -> []
    This is a helper function for loop_through
    The function takes in a string of URL, a dictionary containing 
    info about this URL, and a dictionary used to store these info in 
    new JSON format.
    A URL is a referring site if is_referring = True
    The sources for this URL are stored in matched_source_sites
    A list of containing link info will be returned
    '''
    link = []
    target_site = index_data["site"].lower()
    target_id = list_nodes[target_site]["id"]
    matched_source_sites = index_data["matched_source_sites"]
    target_is_referring = index_data["is_referring"]
    
    # check if the current URL is a referring URL
    if target_is_referring is True:
        # if is a referring URL, iterat its source sites
        for i in matched_source_sites:
            source_site = i["site"].lower()
            # check if the source site has a unique ID
            if (source_site in list_nodes):
                source_id = list_nodes[source_site]["id"]
                # prepare and add the link info in new format
                source_target = {}
                source_target["source"] = source_id
                source_target["target"] = target_id
                source_target["weight"] = 1
                link.append(source_target)  
    
    return link


def loop_through(data):
    '''(obj) -> list, list
    The function takes raw data and returns two list containing nodes 
    and link information in new format
    '''
    links = []
    nodes = []
    
    # dictionary storing node related info, key is the url
    list_nodes = {}
    # dictionary storing node related info, key is node id
    nodes_list = {}
    
    # initiate ID and assign a unique ID to each node
    ID = 0
    for key, index in data.items():
        domain_site = index["site"].lower()
        if (domain_site not in list_nodes):
            node_val = {"id": ID, "site": domain_site, "list_url":[], "val":0, "referring_domain":""}
            list_nodes[domain_site] = node_val
            nodes_list[ID] = domain_site
            ID += 1

    # iterative over nodes, store nodes info in new format
    for key, index_data in data.items():
        get_node(key, index_data, list_nodes)
        
    # iterative over nodes, store links info in new format
    for key, index_data in data.items():
        link = get_link(key, index_data, list_nodes)
        links += link
    
    # iterative over links, find the link weight
    list_link = []
    unique_link_list = []
    for current_link in links:
        # if the current link has not been counted
        if (current_link not in unique_link_list):
            # count how many time the link with same source and target ID appears
            weight = links.count(current_link)
            # prepare link info to be stored in new format
            source_id = current_link["source"]
            target_id = current_link["target"]
            list_link.append({"source":source_id, "target":target_id, "weight":weight})
            
            # add the current link
            unique_link_list.append(current_link)
            # calculate the size of the node based on the # of referring domain
            list_nodes[source_site]["val"] += weight
            
            # prepare info that will be appeared in the popup window
            # find source domain and target domain
            source_site = nodes_list[source_id]
            target_site = nodes_list[target_id]
            list_nodes[source_site]["referring_domain"] += ("<br><a href='" + str(target_site) 
                                                            + "' target='_blank'> " 
                                                            + str(target_site)+"</a>")
    
    for link in list_link:
        source = link["source"]
        target = link["target"]
        weight = link["weight"]
        source_id = nodes_list[source]
        list_nodes[source_id]["val"] += weight
    
    # iterative over nodes to assign colors for source domain and referring domain
    # Nodes for source domains are colored in different shades of red
    red_colors = ["#8B0000", "#FFA07A", "#FA8072", "#E9967A", "#F08080", 
                  "#CD5C5C", "#DC143C", "#DB7093", "#B22222"]
    # Nodes for referring domain are colored in different shades of blue
    blue_colors = ["#388E8E", "#79CDCD", "#37FDFC", "#33A1DE", "#4A708B", 
                   "#63B8FF", "#1C86EE", "#87CEEB", "#4169E1"]
    for j in list_nodes.keys():
        node = list_nodes[j]
        if node["referring_domain"] == "":
            node["referring_domain"] = "None"
            node["color"] = random.choice(blue_colors)
        else:
            node["color"] = random.choice(red_colors)
        
        # stored the node info in new format 
        node_val = {"id": node["id"], "site": node["site"], 
                    "list_url": node["list_url"], "val":node["val"], 
                    "num_url": len(node["list_url"]), 
                    "referring_domain": node["referring_domain"], "color": node["color"]}
        nodes.append(node_val)
        
    return list_link, nodes


if __name__ == '__main__':
    
    # ---------------------- articles new format -----------------------------
    with open('articles_new_format.json', encoding='utf8') as file:
        data = json.load(file)
    
    # loop through each nodes in the raw JSON and convert to new format
    (links,nodes) = loop_through(data)
    export_data = {"nodes" : nodes, "links": links }
    
    with open('domain_mediaCatData.json', 'w', encoding='utf8') as json_file:
      json.dump(export_data, json_file, indent=4)

    print("Done!")
    