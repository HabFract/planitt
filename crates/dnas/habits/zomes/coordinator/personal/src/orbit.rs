use std::{collections::HashMap, cell::RefCell, rc::Rc};
use hdk::prelude::{*, holo_hash::{EntryHashB64, hash_type::AnyLinkable}};
use personal_integrity::*;

use crate::{utils::entry_from_record, get_entry_for_action};

#[hdk_extern]
pub fn create_orbit(orbit: Orbit) -> ExternResult<Record> {
    let orbit_hash = create_entry(&EntryTypes::Orbit(orbit.clone()))?;
    let record = get(orbit_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Orbit"))
            ),
        )?;
    Ok(record)
}

fn get_latest(action_hash: ActionHash) -> ExternResult<Option<Record>> {
    let details = get_details(action_hash, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Orbit not found".into())
    ))?;

    match details {
        Details::Entry(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Malformed details".into()
        ))),
        Details::Record(element_details) => match element_details.updates.last() {
            Some(update) => get_latest(update.action_address().clone()),
            None => Ok(Some(element_details.record)),
        },
    }
}

#[hdk_extern]
pub fn get_my_orbit(original_orbit_hash: ActionHash) -> ExternResult<Option<Record>> {
    get_latest(original_orbit_hash)
}

pub fn get_orbit(original_orbit_hash: ActionHash) -> ExternResult<Option<Record>> {
    let links = get_links(original_orbit_hash.clone(), LinkTypes::OrbitUpdates, None)?;
    let latest_link = links
        .into_iter()
        .max_by(|link_a, link_b| link_a.timestamp.cmp(&link_b.timestamp));
    let latest_orbit_hash = match latest_link {
        Some(link) => {
            link
                .target
                .clone()
                .into_action_hash()
                .ok_or(
                    wasm_error!(
                        WasmErrorInner::Guest(String::from("No action hash associated with link"))
                    ),
                )?
        }
        None => original_orbit_hash.clone(),
    };
    get(latest_orbit_hash, GetOptions::default())
}
#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct UpdateOrbitInput {
    pub original_orbit_hash: ActionHash,
    pub updated_orbit: Orbit,
}
#[hdk_extern]
pub fn update_orbit(input: UpdateOrbitInput) -> ExternResult<Option<Record>> {
    let updated_orbit_hash = update_entry(
        input.original_orbit_hash.clone(),
        &input.updated_orbit,
    )?;

    let path = prefix_path(input.updated_orbit.name.clone())?;
    path.ensure()?;

    // Delete sphere link to stale header
    if let Ok(links) = sphere_to_orbit_links(input.updated_orbit.sphere_hash.clone().into()) {
        let existing_links : Vec<Vec<Link>> = links.into_iter().take(1).collect();
        let link = existing_links[0][0].clone();
        delete_link(link.create_link_hash)?;
    
        // Create sphere link to updated header
        create_link(
            input.updated_orbit.sphere_hash.clone(),
            updated_orbit_hash.clone(),
            LinkTypes::SphereToOrbit,
            (),
        )?;
    }

    // Create anchor link to updated header
    create_link(
        path.path_entry_hash()?,
        updated_orbit_hash.clone(),
        LinkTypes::OrbitsPrefixPath,
        input.updated_orbit.name.as_bytes().to_vec(),
    )?;

    get_latest(updated_orbit_hash.clone())
}

#[hdk_extern]
pub fn delete_orbit(original_orbit_hash: ActionHash) -> ExternResult<ActionHash> {
    delete_entry(original_orbit_hash)
}

#[hdk_extern]
pub fn create_my_orbit(orbit: Orbit) -> ExternResult<Record> {
    let orbit_action_hash = create_entry(&EntryTypes::Orbit(orbit.clone()))?;
    let orbit_entry_hash = hash_entry(&orbit)?;
    let record = get(orbit_action_hash.clone(), GetOptions::default())?
        .ok_or(
            wasm_error!(
                WasmErrorInner::Guest(String::from("Could not find the newly created Orbit"))
            ),
        )?;

    // Create path links for name querying
    let path = prefix_path(orbit.name.clone())?;
    path.ensure()?;
    create_link(
        path.path_entry_hash()?,
        orbit_action_hash.clone(),
        LinkTypes::OrbitsPrefixPath,
        orbit.name.as_bytes().to_vec(),
    )?;
    // Create Sphere link
    create_link(
        orbit.sphere_hash,
        orbit_action_hash.clone(),
        LinkTypes::SphereToOrbit,
        ()
    )?;
    // Create Orbit parent link
    if let Some(parent_hash) = orbit.parent_hash {
        create_link(
            parent_hash,
            orbit_entry_hash,
            LinkTypes::OrbitParentToChild,
            (),
        )?;
    }
    Ok(record)
}

#[hdk_extern]
pub fn _get_all_my_historic_orbit_records(_:()) -> ExternResult<Vec<Record>> {
    let orbit_entry_type: EntryType = UnitEntryTypes::Orbit.try_into()?; 
    let filter = ChainQueryFilter::new().entry_type(orbit_entry_type).include_entries(true); 
    
    let all_my_orbits = query(filter)?; 
    
    Ok(all_my_orbits)
}


#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct SphereOrbitsQueryParams {
    pub sphere_hash: EntryHashB64,
}

#[hdk_extern]
pub fn get_all_my_sphere_orbits(SphereOrbitsQueryParams{sphere_hash} : SphereOrbitsQueryParams) -> ExternResult<Vec<Record>> {
    let maybe_links = sphere_to_orbit_links(sphere_hash.into())?;

    if let Some(links) = maybe_links {
        let entry_hashes = links
            .into_iter()
            .map(|link| {
                let action_hash = link.target.into_action_hash().expect("Only action hashes will be a target of this Link type");
                get_latest(action_hash)
            })
            .collect::<Result<Vec<Option<Record>>, _>>()?
            .into_iter()
            .filter_map(|record_option| {
                record_option.map(|record| record.clone().action().entry_hash())
            })
            .map(|o| o.cloned())
            .filter_map(|optional_hash| optional_hash)
            .collect::<HashSet<EntryHash>>();
        let filter = ChainQueryFilter::new().entry_hashes(entry_hashes).include_entries(true); 
        let my_sphere_orbits = query(filter)?;
        return Ok(my_sphere_orbits)
    }
    Ok(vec![])
}

#[hdk_extern]
pub fn get_orbit_hierarchy_json(input: OrbitHierarchyInput) -> ExternResult<serde_json::Value> {
    let mut all_descendant_hashes = HashSet::new();
    insert_descendants(input.orbit_entry_hash_b64.clone().into(), &mut all_descendant_hashes);

    let orbit_entry_type: EntryType = UnitEntryTypes::Orbit.try_into()?; 
    let filter = ChainQueryFilter::new().entry_hashes(all_descendant_hashes).entry_type(orbit_entry_type).include_entries(true); 
    let selected_orbits = query(filter)?; 

    // debug!("---- Hashes retrieved after recursion: ---- {:#?}", selected_orbits.len());
    let maybe_node_hashmap = build_tree(&selected_orbits);
    if let Ok(hashmap) = maybe_node_hashmap {
        Ok(hashmap.get(&input.orbit_entry_hash_b64).unwrap().borrow().to_json())
    } else {
        Err(wasm_error!(WasmErrorInner::Guest("Could not build tree from the given Orbit hash".to_string())))
    }

}

#[derive(Serialize, Deserialize, Debug)]
#[serde(rename_all = "camelCase")]
pub struct OrbitHierarchyInput {
    pub orbit_entry_hash_b64: EntryHashB64
}

/** Private helpers */

fn insert_descendants(parent_hash: EntryHash, hashes: &mut HashSet<EntryHash>) {
    hashes.insert(parent_hash.clone());

    if let Ok(links) = parent_to_child_links(parent_hash) {
        if let Some(links_vec) = links {
            for link in links_vec {
                if let Some(child_hash) = link.target.into_entry_hash() {
                    if hashes.insert(child_hash.clone()) {
                        // Only recurse if the child hash was not already present
                        insert_descendants(child_hash, hashes);
                    }
                }
            }
        }
    }
    debug!("---- Hashes after recursion: ---- {:#?}", hashes);
}

fn build_tree(orbits: &[Record<SignedHashed<hdk::prelude::Action>>]) -> ExternResult<HashMap<EntryHashB64, Rc<RefCell<Node>>>> {
    let mut nodes: HashMap<EntryHashB64, Rc<RefCell<Node>>> = HashMap::new();
    let mut child_parent_relationships: HashMap<EntryHashB64, EntryHashB64> = HashMap::new();

    // First, create all nodes and track child-parent relationships
    for record in orbits {
        let orbit = entry_from_record::<Orbit>(record.clone())?;
        let entry_hash = hash_entry(orbit.clone())?;
        let entry_hash_b64 : EntryHashB64 = entry_hash.clone().into();
        let node = Rc::new(RefCell::new(Node::new(entry_hash_b64.clone(), Vec::new())));

        // Insert the node into the nodes map
        nodes.insert(entry_hash_b64.clone(), node.clone());

        // If the orbit has a parent, remember this relationship to process later
        if let Some(parent_hash) = orbit.parent_hash {
            let parent_hash_b64 = parent_hash.clone().into();
            child_parent_relationships.insert(entry_hash_b64, parent_hash_b64);
        }
    }

    // Now, establish the parent-child relationships
    for (child_hash_b64, parent_hash_b64) in child_parent_relationships {
        if let Some(parent_node_rc) = nodes.get(&parent_hash_b64) {
            if let Some(child_node_rc) = nodes.get(&child_hash_b64) {
                parent_node_rc.borrow_mut().children.push(child_node_rc.clone());
            }
        } else {
            // If the parent is not in the nodes map, this indicates a problem with the data or logic
            return Err(wasm_error!(WasmErrorInner::Guest(format!(
                "Parent hash not found in the nodes map: {}",
                parent_hash_b64
            ))));
        }
    }

    Ok(nodes)
}

// Link helpers
fn get_links_from_base(base: impl Into<HoloHash<AnyLinkable>>, link_type: impl LinkTypeFilterExt, link_tag: Option<LinkTag>) -> ExternResult<Option<Vec<Link>>> {
    let links = get_links(base, link_type, link_tag)?;
    if links.len() == 0 {
        return Ok(None);
    }
    Ok(Some(links))
}
fn parent_to_child_links(parent_hash: EntryHash) -> ExternResult<Option<Vec<Link>>> {
    get_links_from_base(parent_hash, LinkTypes::OrbitParentToChild, None)
}
fn sphere_to_orbit_links(sphere_hash: EntryHash) -> ExternResult<Option<Vec<Link>>> {
    get_links_from_base(sphere_hash, LinkTypes::SphereToOrbit, None)
}
fn orbit_prefix_path_links(path_hash: EntryHash) -> ExternResult<Option<Vec<Link>>> {
    get_links_from_base(path_hash, LinkTypes::OrbitsPrefixPath, None)
}


fn prefix_path(name: String) -> ExternResult<TypedPath> {
    // convert to lowercase for path for ease of search
    let lower_name = name.to_lowercase();
    let (prefix, _) = lower_name.as_str().split_at(3);

    Path::from(format!("all_orbits.{}", prefix)).typed(LinkTypes::OrbitsPrefixPath)
}
