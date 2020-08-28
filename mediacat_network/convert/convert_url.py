""" Convert raw MediaCat data to readable force-graph data
    Each node represent one URL

This script allows the user to read raw MediaCat JSON data and 
convert to a JSON file that can be read by force-graph library 
(https://github.com/vasturiano/force-graph)

Define:
    - Source URL = the article got cited by others, "is_source" = True
    - Referring URL = the article cites other articles, "is_referring" = True
    - Direct Hyperlink Citation = "url": { and "is_source": == True
    - Mention Citation = "matched_keywords": "" and "is_source": == True

Note 1: Arrow direction: source URL -> referring URL
Note 2: An article can both cites other aricle and got cited by other 
        article at the same time
        This means an article can be a source article and referring
        article at the same time
Note 3: Size of the node is equal to the number of time this article got cited

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
            "url": str,
            "val": int,
            "site": str,
            "authors": str,
            "title": str,
            "date_added": str,
            "date_published": str,
            "is_referring": boolean,
            "is_source": boolean,
            "matched_source_sites": [str],
            "matched_keywords": "unknown"}
        ],
        "links": [
            {
            "source": int
            "target": int
            "dashed": boolean
            }
        ]
    }
"""

import json


def get_node(key, index_data, list_nodes):
    """(str, dict, dict) -> None
    This is a helper function for loop_through
    The function takes in a string of URL, a dictionary containing 
    info about this URL, and a dictionary used to store these info in 
    new JSON format.
    Nothing will be returned. 
    """
    authors = index_data["authors"]
    date_added = index_data["date_added"]
    date_published = index_data["date_published"]
    is_referring = index_data["is_referring"]
    is_source = index_data["is_source"]
    title = index_data["title"]
    site = index_data["site"].lower()
    matched_source_sites = index_data["matched_source_sites"]
    referring_sites = index_data["referring_sites"]
    matched_keywords = index_data["matched_keywords"]
    
    # iterate over each author
    # add all authors in one string, seperated by comma
    authors_str = ""
    for i in authors:
        if (authors_str != ""):
            authors_str += ", " + i
        else:
            authors_str = i
    
    # iterate over each keyword
    # add all keywords in one string, seperated by comma
    keywords_str = ""
    for j in matched_keywords:
        if (keywords_str != ""):
            keywords_str += ", " + j
        else:
            keywords_str = j
    
    # prepare and add node info in new format
    # note: the size of the node depends on # of referring sites (# of times it got cited)can't be zero
    key_val = {"url": key, "val":len(referring_sites)+1, 
               "site": site, "authors":authors_str, "title": title,
               "date_added": date_added, "date_published": date_published, 
               "is_referring": is_referring, "is_source": is_source, 
               "matched_source_sites": matched_source_sites, 
               "matched_keywords": keywords_str}
    this_node = list_nodes[key.lower()]
    this_node.update(key_val)


def get_link(data, key, index_data, list_nodes):
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
    target_site = key.lower()
    target_id = list_nodes[target_site]["id"]
    matched_source_sites = index_data["matched_source_sites"]
    target_is_referring = index_data["is_referring"]
    
    # check if the current URL is a referring URL
    if target_is_referring is True:
        # if is a referring URL, find its source URL
        for i in matched_source_sites:
            source_site = i["url"].lower()
            # if the source URL has a unique ID
            if (source_site in list_nodes):
                source_id = list_nodes[source_site]["id"]
                # determine whether the its a dotted link or a solid link
                dashed = (list_nodes[source_site]["is_source"]  == True and 
                          list_nodes[source_site]["is_referring"] == False)
                
                # prepare and add the link info in new format
                source_target = {}
                source_target["source"] = source_id
                source_target["target"] = target_id
                source_target["dashed"] = dashed
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
    
    # initiate ID and assign a unique ID to each URL 
    ID = 0
    for key, index in data.items():
        if (key not in list_nodes):
            node_val = {"id": ID, "url": key.lower()}
            list_nodes[key.lower()] = node_val
            ID += 1

    # iterate over each node, store nodes info in new format
    for key, index_data in data.items():
        get_node(key, index_data, list_nodes)
    
    # iterate over each node, store links info in new format
    for key, index_data in data.items():
        link = get_link(data, key, index_data, list_nodes)
        links += link
    
    # iterate over each nodes
    for j in list_nodes.keys():
        node = list_nodes[j]
        # if author and matched_keywords are not given, then record them as unknown
        if (node["authors"] == ""):
            node["authors"] = "unknown"
        if (node["matched_keywords"] == ""):
            node["matched_keywords"] = "unknown"
            
        # prepare and add updated node info in new format
        node_val = {"id": node["id"], "url": node["url"], "val": node["val"], 
                    "site": node["site"], "authors": node["authors"], 
                    "title": node["title"], "date_added": node["date_added"], 
                    "date_published": node["date_published"], 
                    "is_referring": node["is_referring"], 
                    "is_source": node["is_source"], 
                    "matched_source_sites": node["matched_source_sites"],
                    "matched_keywords": node["matched_keywords"]}
        nodes.append(node_val)
    return links, nodes


if __name__ == '__main__':
    
    # ---------------------- articles new format -----------------------------
    with open('articles_new_format.json', encoding='utf8') as file:
        data = json.load(file)
    
    # loop through each nodes in the raw JSON and convert to new format
    (links,nodes) = loop_through(data)
    export_data = {"nodes" : nodes, "links": links }
    
    with open('url_mediaCatData.json', 'w', encoding='utf8') as json_file:
      json.dump(export_data, json_file, indent=4)

    print("Done!")
   
