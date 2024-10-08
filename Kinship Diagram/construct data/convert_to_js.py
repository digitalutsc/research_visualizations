''' Convert CSV to JS

This script allows the user to read two csv files and convert it to 
a js data file for Dragoman kinship diagram.

Note: Portrait icon should NOT be shown in kinship diagram 1 & 2.
      This means we need to run the script seperatly for diagram 1&2 and diagram 3
'''

import pandas as pd
import re
import random


def get_family_info(family_id, families):
    '''(str, obj) -> [str, list, list]
    This is a helper function for get_unions.
    It helps get family information(unique family ID, partner ID's, children ID's) 
    given the family_id
    '''
    family_info = families.loc[families["FamilyID"] == family_id].iloc[0]
    wife = str(family_info["WifeID"]).strip()
    husband = str(family_info["HusbandID"]).strip()
    if (wife == "nan"):
        wife = ""
    if (husband == "nan"):
        husband = ""
    partner = [wife, husband]
    
    children_list = str(family_info["Children"]).strip()
    children_list = re.split(', |: ',children_list)
    children = children_list.copy()
    count = 1
    for i in children_list:
        if (count % 2) == 0:
            children.remove(i)
        if (i == "nan"):
            children = ""
        count += 1
    
    return [family_id, partner, children]

    
def get_individual_info(individual_id, individuals, u, ):
    '''(str, obj, dict) -> list
    This is a helper function for get_persons.
    It takes an individual ID and get individual information (including name, 
    gener, forename, surname, whether the person has portrait, parents, 
    children list, birth years, and death years, etc) about that individual.
    '''
    individual_info = individuals.loc[individuals["IndividualID"] == individual_id].iloc[0]
    gender = str(individual_info["Gender"]).strip()
    Forenames = str(individual_info["Forenames"]).strip()
    Surname = str(individual_info["Surname"]).strip()
    individual_name = Forenames + " " + Surname
    Occupation = str(individual_info["is Dragoman?"]).strip().lower()
    portrait_filename = str(individual_info["Portrait Filename"]).strip().lower()
    parent_union = str(u[individual_id]["parent_union"])
    own_unions = u[individual_id]["own_unions"]
    birth_year = str(individual_info["BirthDate"]).strip()
    death_year = str(individual_info["DeathDate"]).strip()
    
    dragoman = ""
    if "y" in Occupation:
        dragoman = "dragoman"

    birth_year = birth_year.replace("ca. ","")
    birth_year = birth_year.replace("<", "")
    birth_year = birth_year.replace(">", "")
    birth_year = birth_year.replace("UNKNOWN", "?")
    birth_year = birth_year.replace("nan", "?")
    death_year = death_year.replace("<", "")
    death_year = death_year.replace(">", "")
    death_year = death_year.replace("UNKNOWN", "?")
    death_year = death_year.replace("nan", "?")
    return [individual_id, individual_name, Forenames, Surname, gender,
            dragoman, portrait_filename, birth_year, death_year, parent_union,own_unions]


def get_persons(individual_id,individuals,u, color_palette):
    '''(str, obj, dict) -> dict
    This function is takes a individual ID and turn the individual information 
    (name, gender, birth yeat, etc.) to a dictionary containing information 
    related to that person.
    '''
    (individual_id, individual_name, Forenames, Surname, gender, 
     dragoman, portrait, birth_year, death_year, parent_union, 
     own_unions) = get_individual_info(individual_id, individuals, u)
    individual_class = gender + " " + dragoman 
    
    if (portrait !="nan"):
        individual_class += " hasPortrait"
        
    # used to hide portrait for diagram 1 & diagram 2
    # individual_class += " hidePortrait"
    
    # used to show portrait for diagram 3
    individual_class += " showPortrait"
    
    # set family color by last name  
    family_color = ""
    if Surname in color_palette:
        family_color = color_palette[Surname]
    else:
        '''# set people not in color_palette list to a random color
        random_color = "#"+''.join([random.choice('0123456789ABCDEF') for j in range(6)])
        color_palette[Surname] = random_color'''
        # set people not in the color_palette list to grey
        random_color = "#C0C0C0"
        family_color = random_color
        
    individual = {"id": individual_id, "class":individual_class, 
                  "name": individual_name, "forename": Forenames, 
                  "surname": Surname, "portrait": portrait, "birthyear": birth_year, 
                  "deathyear": death_year, "own_unions":own_unions}
    if (parent_union != ""):
        individual["parent_union"] = parent_union
    if (family_color != ""):
        individual["familyColor"] = family_color

    return individual

def get_unions(family_id, families):
    '''(str, obj) -> dict
    This function takes a family ID and returns a dictionary containing all
    family information related to that family.
    '''
    (family_id, partner, children) = get_family_info(family_id, families)
    unions = {"id": family_id, "partner": partner, "children":children}
    return unions


def get_links(family_id, partner, children):
    '''(str, list, list) -> list
    The function taks a family ID, parents and children of that family. 
    It returns a list of links between individuals in a format that we want.
    '''
    links = []
    for i in partner:
        if (i != ""):
            append_list = [i, family_id]
            links.append(append_list)
    for j in children:
        append_list = [family_id, j]
        links.append(append_list)
    return links


def loop_through(families, individuals):
    '''(obj, obj) -> dict
    This function takes 2 objects containing raw information read from the 
    csv file. It loop through each individuals and return a dictionary
    containing all person, union, link information about all the individuals.
    '''
    color_palette = {"Borisi": "#A6692B", "Brutti":"#749983", 
                 "Mascellini":"#A69F4C", "Mamuca della Torre":"#5B6658", 
                 "Tarsia": "#B39D91", "Carli":"#2E4F59", "Don Carli":"#2E4F59", 
                 "Theÿls": "#A63D33", "Pisani": "#593640", "Olivieri": "#374E99"}
    data = {"start" : "", "persons" : {}, "unions" : {}, "links" : []}
    for i in families["FamilyID"]:
        unions = get_unions(i, families)
        data["unions"][i] = unions
        
        (family_id, partner, children) = get_family_info(i, families)
        links = get_links(family_id, partner, children)
        data["links"] += links
    
    u = {}
    for m in individuals["IndividualID"]:
        l = {"own_unions": [], "parent_union": ""}
        u[m] = l
        
    for j in data["links"]:
        first = j[0]
        second = j[1]
        if ("F" in first):
            u[second]["parent_union"] = first
        if ("I" in first):
            if second not in u[first]["own_unions"]:
                u[first]["own_unions"].append(second)
                
    for k in individuals["IndividualID"]:
        individual = get_persons(k, individuals, u, color_palette)
        data["persons"][k] = individual
    
    return data



    
if __name__ == '__main__':
    # read exported by families, exported by individuals csv file
    individuals = pd.read_csv("Gedcom Gramps 2020-05-20 export individuals - Gedcom Gramps 2020-05-20 export individuals.csv",encoding='utf8')
    individuals.head(1)
    families = pd.read_csv("Gedcom Gramps 2020-05-20 export families - Gedcom Gramps 2020-05-20 export families.csv",encoding='utf8')
    families.head(1)
    
    data = loop_through(families, individuals)
    # write to the JS files
    
    '''
    # kinship diagram 1
    data["start"] = "I0086"
    with open('..\kinship1.js', 'w', encoding='utf8') as file:
        file.truncate(0)
        file.write("data = " + str(data))
    
    # kinship diagram 2
    data["start"] = "I0163"
    with open('..\kinship2.js', 'w', encoding='utf8') as file:
        file.truncate(0)
        file.write("data = " + str(data))
    
    '''
    # kinship diagram 3
    data["start"] = "I0117"
    with open('..\kinship3.js', 'w', encoding='utf8') as file:
        file.truncate(0)
        file.write("data = " + str(data))
    

    # test file
    data["start"] = "I0299"
    with open('..\specialCharacter.js', 'w', encoding='utf8') as file:
        file.truncate(0)
        file.write("data = " + str(data))
    
    # kinship diagram 3 island top left
    data["start"] = "I0500"
    with open('..\kinship3_2.js', 'w', encoding='utf8') as file:
        file.truncate(0)
        file.write("data = " + str(data))
    
    # kinship diagram 3 island top left isolated person
    data["start"] = "I0504"
    with open('..\kinship3_3.js', 'w', encoding='utf8') as file:
        file.truncate(0)
        file.write("data = " + str(data))
    
    # kinship diagram 3 island top right
    data["start"] = "I0505"
    with open('..\kinship3_4.js', 'w', encoding='utf8') as file:
        file.truncate(0)
        file.write("data = " + str(data))
    
        
    print ("DONE!\n")
